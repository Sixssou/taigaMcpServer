#!/usr/bin/env node

/**
 * Enhanced Taiga MCP Server
 * 
 * Inspired by mcpTAIGA project by adriapedralbes
 * Original: https://github.com/adriapedralbes/mcpTAIGA
 * 
 * Copyright (c) 2024 greddy7574@gmail.com
 * 
 * This project represents a substantial rewrite and reimplementation
 * with entirely new architecture, advanced sprint management, issue tracking,
 * and comprehensive Taiga API integration.
 * 
 * Developed collaboratively with Claude Code (claude.ai/code)
 * 
 * Licensed under the ISC License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

// Create a new MCP server
const server = new McpServer({
  name: SERVER_INFO.name,
  version: SERVER_INFO.version,
});

// Create Taiga service instance
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

The server will automatically authenticate with Taiga using the configured credentials (${process.env.TAIGA_USERNAME ? 'Username configured' : 'Username not configured'}, ${process.env.TAIGA_PASSWORD ? 'Password configured' : 'Password not configured'}).

You can also use the 'authenticate' tool to manually authenticate or use different credentials.

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

// Pre-authenticate if credentials are available (optional initialization)
if (process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD) {
  try {
    await authenticate(process.env.TAIGA_USERNAME, process.env.TAIGA_PASSWORD);
  } catch (error) {
    // Ignore pre-auth errors, will retry when needed
  }
}

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);