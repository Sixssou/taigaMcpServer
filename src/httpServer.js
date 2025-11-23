#!/usr/bin/env node

/**
 * HTTP Server for Taiga MCP Server
 *
 * Provides HTTP access to the MCP server using standard HTTP POST/Response.
 * Designed for internal network access (e.g., from n8n workflows).
 *
 * Copyright (c) 2024 greddy7574@gmail.com
 * Licensed under the ISC License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import http from 'http';
import dotenv from 'dotenv';
import { TaigaService } from './taigaService.js';
import { authenticate } from './taigaAuth.js';
import { SERVER_INFO, RESOURCE_URIS } from './constants.js';
import { registerAllTools, getAllTools } from './tools/index.js';
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

// Global MCP server instance
let mcpServerInstance = null;
let isAuthenticated = false;

/**
 * Create and configure MCP server instance
 */
function createMcpServer() {
  if (mcpServerInstance) {
    return mcpServerInstance;
  }

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

  mcpServerInstance = server;
  return server;
}

/**
 * Custom HTTP Transport for MCP
 */
class HTTPTransport {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }

  async start() {
    console.log('[HTTP Transport] Started');
  }

  async send(message) {
    // Store the response to send back
    this._lastResponse = message;
  }

  async close() {
    if (this.onclose) {
      this.onclose();
    }
  }
}

/**
 * Create HTTP server
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
        transport: 'http',
        authenticated: isAuthenticated,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Main MCP endpoint (HTTP POST)
    if (req.url === '/mcp' && req.method === 'POST') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const request = JSON.parse(body);
          console.log('[HTTP] Received MCP request:', request.method || 'unknown method');

          const server = createMcpServer();

          // Handle different MCP protocol methods
          let response;

          if (request.method === 'tools/list') {
            // Return list of all available tools
            const allTools = getAllTools();
            response = {
              tools: allTools.map(tool => {
                // Convert Zod schema to JSON Schema format
                let inputSchema = { type: 'object', properties: {} };

                if (tool.schema && typeof tool.schema === 'object') {
                  const properties = {};

                  // Extract properties from Zod schema
                  for (const [key, value] of Object.entries(tool.schema)) {
                    if (value && value._def) {
                      // It's a Zod object, extract basic type info
                      const zodType = value._def.typeName;
                      let propSchema = { type: 'string' }; // default

                      if (zodType === 'ZodString' || zodType?.includes('String')) {
                        propSchema = { type: 'string' };
                      } else if (zodType === 'ZodNumber' || zodType?.includes('Number')) {
                        propSchema = { type: 'number' };
                      } else if (zodType === 'ZodBoolean' || zodType?.includes('Boolean')) {
                        propSchema = { type: 'boolean' };
                      } else if (zodType === 'ZodArray' || zodType?.includes('Array')) {
                        propSchema = { type: 'array' };
                      } else if (zodType === 'ZodObject' || zodType?.includes('Object')) {
                        propSchema = { type: 'object' };
                      }

                      // Add description if available
                      if (value._def.description) {
                        propSchema.description = value._def.description;
                      }

                      properties[key] = propSchema;
                    }
                  }

                  if (Object.keys(properties).length > 0) {
                    inputSchema.properties = properties;
                  }
                }

                return {
                  name: tool.name,
                  description: tool.description || '',
                  inputSchema: inputSchema
                };
              })
            };
          } else if (request.method === 'tools/call') {
            // Call a specific tool
            const toolName = request.params.name;
            const toolArgs = request.params.arguments || {};

            const allTools = getAllTools();
            const tool = allTools.find(t => t.name === toolName);

            if (!tool) {
              response = {
                error: {
                  code: -32602,
                  message: `Tool not found: ${toolName}`
                }
              };
            } else {
              try {
                const result = await tool.handler(toolArgs);
                response = { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
              } catch (error) {
                response = {
                  error: {
                    code: -32603,
                    message: `Tool execution error: ${error.message}`
                  }
                };
              }
            }
          } else if (request.method === 'resources/list') {
            response = { resources: [] };
          } else if (request.method === 'resources/read') {
            response = { contents: [] };
          } else if (request.method === 'initialize') {
            response = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: SERVER_INFO.name,
                version: SERVER_INFO.version
              }
            };
          } else if (request.method === 'notifications/initialized') {
            // Just acknowledge the notification
            response = {};
          } else {
            response = {
              error: {
                code: -32601,
                message: `Method not found: ${request.method}`
              }
            };
          }

          // Send JSON-RPC response
          const jsonRpcResponse = {
            jsonrpc: '2.0',
            id: request.id,
            result: response
          };

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(jsonRpcResponse));

          console.log('[HTTP] Sent response for:', request.method);

        } catch (error) {
          console.error('[HTTP] Error processing request:', error);

          const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: error.message
            }
          };

          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(errorResponse));
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
        mcp: 'POST /mcp'
      }
    }));
  });

  return httpServer;
}

/**
 * Start the HTTP server
 */
async function startServer() {
  // Pre-authenticate if credentials are available
  if (process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD) {
    try {
      await authenticate(process.env.TAIGA_USERNAME, process.env.TAIGA_PASSWORD);
      isAuthenticated = true;
      console.log('[HTTP] Pre-authentication successful');
    } catch (error) {
      console.error('[HTTP] Pre-authentication failed:', error.message);
    }
  }

  const httpServer = createHttpServer();

  httpServer.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Taiga MCP Server - HTTP Mode                       ║
╠════════════════════════════════════════════════════════════╣
║  Server:    ${SERVER_INFO.name.padEnd(45)} ║
║  Version:   ${SERVER_INFO.version.padEnd(45)} ║
║  Transport: HTTP (POST/Response)                           ║
║  Listen:    http://${HOST}:${PORT}${' '.repeat(Math.max(0, 30 - HOST.length - PORT.toString().length))} ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    - GET  /health    Health check                          ║
║    - POST /mcp       MCP protocol endpoint                 ║
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
}

// Start server
startServer().catch(error => {
  console.error('[HTTP] Failed to start server:', error);
  process.exit(1);
});
