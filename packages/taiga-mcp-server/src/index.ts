import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { TaigaClient } from '@taiga-monorepo/core';

dotenv.config();

const app = express();
const PORT = process.env.MCP_PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Initialize Taiga client
const taigaClient = new TaigaClient({
  apiUrl: process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1',
  username: process.env.TAIGA_USERNAME,
  password: process.env.TAIGA_PASSWORD
});

// Create MCP Server
const mcpServer = new Server(
  {
    name: 'taiga-mcp-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ========================================
// Define MCP Tools
// ========================================

const tools: Tool[] = [
  // Authentication
  {
    name: 'authenticate',
    description: 'Authenticate with Taiga',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  // Projects
  {
    name: 'list_projects',
    description: 'List all accessible projects',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project',
    description: 'Get project details by ID or slug',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Project ID (number) or slug (string)',
        },
      },
      required: ['identifier'],
    },
  },
  // Sprints/Milestones
  {
    name: 'list_milestones',
    description: 'List milestones (sprints) for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'Project ID',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_milestone',
    description: 'Get milestone details',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: {
          type: 'number',
          description: 'Milestone ID',
        },
      },
      required: ['milestone_id'],
    },
  },
  {
    name: 'create_milestone',
    description: 'Create a new milestone (sprint)',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number' },
        name: { type: 'string' },
        estimated_start: { type: 'string' },
        estimated_finish: { type: 'string' },
      },
      required: ['project_id', 'name', 'estimated_start', 'estimated_finish'],
    },
  },
  {
    name: 'get_milestone_stats',
    description: 'Get milestone statistics',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'number' },
      },
      required: ['milestone_id'],
    },
  },
  // Issues
  {
    name: 'list_issues',
    description: 'List issues in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number' },
        milestone_id: { type: 'number' },
        status_id: { type: 'number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get issue details',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'number' },
      },
      required: ['issue_id'],
    },
  },
  {
    name: 'create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number' },
        subject: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'number' },
        priority: { type: 'number' },
        severity: { type: 'number' },
        milestone: { type: 'number' },
      },
      required: ['project_id', 'subject', 'type', 'priority', 'severity'],
    },
  },
  {
    name: 'update_issue_status',
    description: 'Update issue status',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'number' },
        status_id: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['issue_id', 'status_id', 'version'],
    },
  },
  {
    name: 'assign_issue',
    description: 'Assign or unassign issue to team member',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'number' },
        assigned_to: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['issue_id', 'version'],
    },
  },
  // User Stories
  {
    name: 'list_user_stories',
    description: 'List user stories in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number' },
        milestone_id: { type: 'number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_user_story',
    description: 'Get user story details',
    inputSchema: {
      type: 'object',
      properties: {
        story_id: { type: 'number' },
      },
      required: ['story_id'],
    },
  },
  {
    name: 'create_user_story',
    description: 'Create a new user story',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'number' },
        subject: { type: 'string' },
        description: { type: 'string' },
        milestone: { type: 'number' },
      },
      required: ['project_id', 'subject'],
    },
  },
  // Add more tools as needed...
];

// Register tools handler
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register call tool handler
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'authenticate':
        await taigaClient.authenticate();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Successfully authenticated with Taiga'
              }, null, 2),
            },
          ],
        };

      case 'list_projects':
        const projects = await taigaClient.listProjects();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, projects }, null, 2),
            },
          ],
        };

      case 'get_project': {
        const identifier = String(args?.identifier);
        const isNumeric = /^\d+$/.test(identifier);
        const project = isNumeric
          ? await taigaClient.getProject(Number(identifier))
          : await taigaClient.getProjectBySlug(identifier);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, project }, null, 2),
            },
          ],
        };
      }

      case 'list_milestones': {
        const milestones = await taigaClient.listMilestones(Number(args?.project_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, milestones }, null, 2),
            },
          ],
        };
      }

      case 'get_milestone': {
        const milestone = await taigaClient.getMilestone(Number(args?.milestone_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, milestone }, null, 2),
            },
          ],
        };
      }

      case 'create_milestone': {
        const milestone = await taigaClient.createMilestone({
          project: Number(args?.project_id),
          name: String(args?.name),
          estimated_start: String(args?.estimated_start),
          estimated_finish: String(args?.estimated_finish),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, milestone }, null, 2),
            },
          ],
        };
      }

      case 'get_milestone_stats': {
        const stats = await taigaClient.getMilestoneStats(Number(args?.milestone_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, stats }, null, 2),
            },
          ],
        };
      }

      case 'list_issues': {
        const issues = await taigaClient.listIssues(Number(args?.project_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, issues }, null, 2),
            },
          ],
        };
      }

      case 'get_issue': {
        const issue = await taigaClient.getIssue(Number(args?.issue_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, issue }, null, 2),
            },
          ],
        };
      }

      case 'create_issue': {
        const issue = await taigaClient.createIssue({
          project: Number(args?.project_id),
          subject: String(args?.subject),
          description: args?.description ? String(args.description) : undefined,
          type: Number(args?.type),
          priority: Number(args?.priority),
          severity: Number(args?.severity),
          milestone: args?.milestone ? Number(args.milestone) : undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, issue }, null, 2),
            },
          ],
        };
      }

      case 'update_issue_status': {
        const issue = await taigaClient.updateIssue(
          Number(args?.issue_id),
          {
            status: Number(args?.status_id),
            version: Number(args?.version)
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, issue }, null, 2),
            },
          ],
        };
      }

      case 'assign_issue': {
        const issue = await taigaClient.updateIssue(
          Number(args?.issue_id),
          {
            assigned_to: args?.assigned_to ? Number(args.assigned_to) : null,
            version: Number(args?.version)
          }
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, issue }, null, 2),
            },
          ],
        };
      }

      case 'list_user_stories': {
        const stories = await taigaClient.listUserStories(Number(args?.project_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, stories }, null, 2),
            },
          ],
        };
      }

      case 'get_user_story': {
        const story = await taigaClient.getUserStory(Number(args?.story_id));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, story }, null, 2),
            },
          ],
        };
      }

      case 'create_user_story': {
        const story = await taigaClient.createUserStory({
          project: Number(args?.project_id),
          subject: String(args?.subject),
          description: args?.description ? String(args.description) : undefined,
          milestone: args?.milestone ? Number(args.milestone) : undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, story }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message || 'Unknown error'
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ========================================
// SSE Endpoints
// ========================================

app.get('/sse', async (req, res) => {
  console.log('📡 New SSE connection established');

  const transport = new SSEServerTransport('/message', res);
  await mcpServer.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.log('❌ SSE connection closed');
  });
});

app.post('/message', async (req, res) => {
  // Messages are handled by the SSE transport
  res.status(200).end();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'taiga-mcp-server',
    transport: 'SSE',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Taiga MCP Server (SSE) running on port', PORT);
  console.log('📡 SSE Endpoint: http://localhost:' + PORT + '/sse');
  console.log('🏥 Health check: http://localhost:' + PORT + '/health');
});
