#!/usr/bin/env node

/**
 * HTTP/SSE Server for Taiga MCP Server
 *
 * Provides HTTP access to the MCP server using Server-Sent Events (SSE) transport.
 * Designed for internal network access (e.g., from n8n workflows).
 *
 * Copyright (c) 2024 greddy7574@gmail.com
 * Licensed under the ISC License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';
import dotenv from 'dotenv';
import { TaigaService } from './taigaService.js';
import { authenticate } from './taigaAuth.js';
import { SERVER_INFO, RESOURCE_URIS } from './constants.js';
import { registerAllTools } from './tools/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const PORT = process.env.MCP_HTTP_PORT || 3000;
const HOST = process.env.MCP_HTTP_HOST || '0.0.0.0';

// Global storage for active SSE sessions
const activeSessions = new Map();

/**
 * Create and configure MCP server instance
 */
function createMcpServer() {
  const server = new McpServer({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
  });

  const taigaService = new TaigaService();

  // Add resources for documentation and context
  server.resource(
    'taiga-api-docs',
    RESOURCE_URIS.API_DOCS,
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: `Taiga API Documentation

This MCP server allows you to interact with Taiga using natural language.
You can perform the following actions:

1. List your projects
2. Create user stories within a project
3. List user stories in a project
4. Create tasks within a user story
5. List tasks in a user story
6. Create issues in a project
7. List issues in a project
8. List sprints (milestones) in a project
9. Get sprint details and statistics
10. Create new sprints
11. Get single issue details (including sprint info)
12. Get issues by sprint
13. Authenticate with Taiga

The server connects to the Taiga API at ${process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1'}.

The server will automatically authenticate with Taiga using the configured credentials.
          `,
        },
      ],
    })
  );

  // Add resource for projects
  server.resource(
    'projects',
    RESOURCE_URIS.PROJECTS,
    async (uri) => {
      try {
        const projects = await taigaService.listProjects();
        return {
          contents: [
            {
              uri: uri.href,
              text: `Your Taiga Projects:

${projects.map(p => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`).join('\n')}
              `,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error fetching projects: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Register all MCP tools from modules
  registerAllTools(server);

  return server;
}

/**
 * Create HTTP server with SSE endpoint
 */
function createHttpServer() {
  const httpServer = http.createServer(async (req, res) => {
    // CORS headers for internal network access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check endpoint
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        server: SERVER_INFO.name,
        version: SERVER_INFO.version,
        transport: 'sse',
        activeSessions: activeSessions.size,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // SSE endpoint for MCP communication
    if (req.url === '/sse' && req.method === 'GET') {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[HTTP] New SSE connection from ${req.socket.remoteAddress} (${sessionId})`);

      const mcpServer = createMcpServer();

      // Pre-authenticate if credentials are available
      if (process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD) {
        try {
          await authenticate(process.env.TAIGA_USERNAME, process.env.TAIGA_PASSWORD);
          console.log(`[HTTP] Pre-authentication successful (${sessionId})`);
        } catch (error) {
          console.error(`[HTTP] Pre-authentication failed (${sessionId}):`, error.message);
        }
      }

      try {
        const transport = new SSEServerTransport('/message', res);

        // Store the session
        activeSessions.set(sessionId, { mcpServer, transport, createdAt: Date.now() });
        console.log(`[HTTP] Session stored (${sessionId}), total sessions: ${activeSessions.size}`);

        // Connect the MCP server to the transport
        await mcpServer.connect(transport);
        console.log(`[HTTP] MCP server connected via SSE (${sessionId})`);

        // Clean up when connection closes
        req.on('close', () => {
          activeSessions.delete(sessionId);
          console.log(`[HTTP] Session closed (${sessionId}), remaining sessions: ${activeSessions.size}`);
        });

      } catch (error) {
        console.error(`[HTTP] Error connecting MCP server (${sessionId}):`, error);
        activeSessions.delete(sessionId);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
      return;
    }

    // Handle POST requests to /message endpoint (for SSE client messages)
    if (req.url === '/message' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          console.log('[HTTP] Received POST /message:', JSON.stringify(message).substring(0, 200));

          // The SSEServerTransport should handle this internally
          // We just acknowledge receipt
          res.writeHead(202, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ accepted: true }));
        } catch (error) {
          console.error('[HTTP] Error processing POST /message:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // Default response for unknown endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      availableEndpoints: {
        health: 'GET /health',
        sse: 'GET /sse',
        message: 'POST /message'
      }
    }));
  });

  return httpServer;
}

/**
 * Start the HTTP server
 */
async function startServer() {
  const httpServer = createHttpServer();

  httpServer.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Taiga MCP Server - HTTP/SSE Mode                   ║
╠════════════════════════════════════════════════════════════╣
║  Server:    ${SERVER_INFO.name.padEnd(45)} ║
║  Version:   ${SERVER_INFO.version.padEnd(45)} ║
║  Transport: SSE (Server-Sent Events)                       ║
║  Listen:    http://${HOST}:${PORT}${' '.repeat(Math.max(0, 30 - HOST.length - PORT.toString().length))} ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    - GET  /health    Health check                          ║
║    - GET  /sse       MCP SSE connection                    ║
║    - POST /message   MCP message endpoint                  ║
╠════════════════════════════════════════════════════════════╣
║  Taiga API: ${(process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1').padEnd(43)} ║
║  Auth:      ${(process.env.TAIGA_USERNAME ? '✓ Configured' : '✗ Not configured').padEnd(43)} ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[HTTP] Received SIGTERM, shutting down gracefully...');
    httpServer.close(() => {
      console.log('[HTTP] Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[HTTP] Received SIGINT, shutting down gracefully...');
    httpServer.close(() => {
      console.log('[HTTP] Server closed');
      process.exit(0);
    });
  });

  // Cleanup old sessions every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.createdAt > maxAge) {
        console.log(`[HTTP] Cleaning up stale session: ${sessionId}`);
        activeSessions.delete(sessionId);
      }
    }
  }, 60 * 1000); // Check every minute
}

// Start server
startServer().catch(error => {
  console.error('[HTTP] Failed to start server:', error);
  process.exit(1);
});
