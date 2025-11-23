/**
 * Metadata Discovery MCP Tools
 * Provides tools for discovering and viewing project metadata
 */

import { z } from 'zod';
import {
  getProjectMetadata,
  getAvailableStatuses,
  getProjectMembers,
  getProjectMilestones,
  getIssuePriorities,
  getIssueSeverities,
  getIssueTypes,
  clearMetadataCache
} from '../metadataService.js';
import { createErrorResponse, createSuccessResponse } from '../utils.js';

/**
 * Tool to get complete project metadata
 */
export const getProjectMetadataTool = {
  name: 'getProjectMetadata',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    useCache: z.boolean().optional().describe('Use cached data (default: true)'),
    include: z.array(z.string()).optional().describe('Specific metadata types to include (default: all)')
  },
  handler: async ({ projectIdentifier, useCache = true, include }) => {
    try {
      const metadata = await getProjectMetadata(projectIdentifier, { useCache, include });

      let responseText = `**Project Metadata for ${metadata.summary.projectName}**\n\n`;

      // Summary
      responseText += `**Summary:**\n`;
      responseText += `- Project ID: ${metadata.summary.projectId}\n`;
      responseText += `- Project Slug: ${metadata.summary.projectSlug}\n`;
      responseText += `- Total Members: ${metadata.summary.totalMembers} (${metadata.summary.activeMembers} active)\n`;
      responseText += `- Total Milestones: ${metadata.summary.totalMilestones} (${metadata.summary.activeMilestones} active)\n`;
      responseText += `- User Story Statuses: ${metadata.summary.userStoryStatusCount}\n`;
      responseText += `- Task Statuses: ${metadata.summary.taskStatusCount}\n`;
      responseText += `- Issue Statuses: ${metadata.summary.issueStatusCount}\n\n`;

      // User Story Statuses
      if (metadata.userStoryStatuses) {
        responseText += `**User Story Statuses (${metadata.userStoryStatuses.length}):**\n`;
        metadata.userStoryStatuses.forEach(s => {
          responseText += `- ${s.name} (ID: ${s.id})${s.is_closed ? ' [CLOSED]' : ''}\n`;
        });
        responseText += '\n';
      }

      // Task Statuses
      if (metadata.taskStatuses) {
        responseText += `**Task Statuses (${metadata.taskStatuses.length}):**\n`;
        metadata.taskStatuses.forEach(s => {
          responseText += `- ${s.name} (ID: ${s.id})${s.is_closed ? ' [CLOSED]' : ''}\n`;
        });
        responseText += '\n';
      }

      // Issue Statuses
      if (metadata.issueStatuses) {
        responseText += `**Issue Statuses (${metadata.issueStatuses.length}):**\n`;
        metadata.issueStatuses.forEach(s => {
          responseText += `- ${s.name} (ID: ${s.id})${s.is_closed ? ' [CLOSED]' : ''}\n`;
        });
        responseText += '\n';
      }

      // Priorities
      if (metadata.priorities) {
        responseText += `**Issue Priorities (${metadata.priorities.length}):**\n`;
        metadata.priorities.forEach(p => {
          responseText += `- ${p.name} (ID: ${p.id})\n`;
        });
        responseText += '\n';
      }

      // Severities
      if (metadata.severities) {
        responseText += `**Issue Severities (${metadata.severities.length}):**\n`;
        metadata.severities.forEach(s => {
          responseText += `- ${s.name} (ID: ${s.id})\n`;
        });
        responseText += '\n';
      }

      // Issue Types
      if (metadata.issueTypes) {
        responseText += `**Issue Types (${metadata.issueTypes.length}):**\n`;
        metadata.issueTypes.forEach(t => {
          responseText += `- ${t.name} (ID: ${t.id})\n`;
        });
        responseText += '\n';
      }

      // Active Members (first 10)
      if (metadata.members) {
        const activeMembers = metadata.members.filter(m => m.is_active !== false);
        responseText += `**Active Members (showing ${Math.min(10, activeMembers.length)} of ${activeMembers.length}):**\n`;
        activeMembers.slice(0, 10).forEach(m => {
          responseText += `- ${m.full_name || m.username}\n`;
          responseText += `  Username: ${m.username}, Email: ${m.user_email || m.email}\n`;
          responseText += `  User ID: ${m.user}, Role: ${m.role_name || 'N/A'}\n`;
        });
        if (activeMembers.length > 10) {
          responseText += `... and ${activeMembers.length - 10} more\n`;
        }
        responseText += '\n';
      }

      // Active Milestones (first 10)
      if (metadata.milestones) {
        const activeMilestones = metadata.milestones.filter(m => !m.closed);
        responseText += `**Active Milestones (showing ${Math.min(10, activeMilestones.length)} of ${activeMilestones.length}):**\n`;
        activeMilestones.slice(0, 10).forEach(m => {
          responseText += `- ${m.name} (ID: ${m.id})`;
          if (m.estimated_start || m.estimated_finish) {
            responseText += ` [${m.estimated_start || '?'} to ${m.estimated_finish || '?'}]`;
          }
          responseText += '\n';
        });
        if (activeMilestones.length > 10) {
          responseText += `... and ${activeMilestones.length - 10} more\n`;
        }
      }

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Failed to get project metadata: ${error.message}`);
    }
  }
};

/**
 * Tool to list project members with all identifier formats
 */
export const listProjectMembersTool = {
  name: 'listProjectMembers',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    activeOnly: z.boolean().optional().describe('Show only active members (default: false)')
  },
  handler: async ({ projectIdentifier, activeOnly = false }) => {
    try {
      const members = await getProjectMembers(projectIdentifier, { activeOnly });

      let responseText = `**Project Members (${members.length} ${activeOnly ? 'active ' : ''}members)**\n\n`;

      members.forEach((m, idx) => {
        responseText += `${idx + 1}. ${m.fullName}\n`;
        responseText += `   - Username: ${m.username}\n`;
        responseText += `   - Email: ${m.email}\n`;
        responseText += `   - User ID: ${m.userId}\n`;
        responseText += `   - Role: ${m.roleName || 'N/A'}\n`;
        responseText += `   - Status: ${m.isActive ? 'Active' : 'Inactive'}\n`;
        responseText += '\n';
      });

      responseText += `\n**Usage Tips:**\n`;
      responseText += `You can assign tasks/stories to users using any of these formats:\n`;
      responseText += `- Username (e.g., "${members[0]?.username}")\n`;
      responseText += `- Email (e.g., "${members[0]?.email}")\n`;
      responseText += `- User ID (e.g., "${members[0]?.userId}")\n`;
      responseText += `- Full name (e.g., "${members[0]?.fullName}") - supports fuzzy matching\n`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Failed to list project members: ${error.message}`);
    }
  }
};

/**
 * Tool to get available statuses for an entity type
 */
export const getAvailableStatusesTool = {
  name: 'getAvailableStatuses',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    entityType: z.enum(['userStory', 'task', 'issue']).describe('Entity type')
  },
  handler: async ({ projectIdentifier, entityType }) => {
    try {
      const statuses = await getAvailableStatuses(projectIdentifier, entityType);

      let responseText = `**Available Statuses for ${entityType}**\n\n`;

      const openStatuses = statuses.filter(s => !s.isClosed);
      const closedStatuses = statuses.filter(s => s.isClosed);

      if (openStatuses.length > 0) {
        responseText += `**Open Statuses (${openStatuses.length}):**\n`;
        openStatuses.forEach(s => {
          responseText += `- "${s.name}" (ID: ${s.id})\n`;
        });
        responseText += '\n';
      }

      if (closedStatuses.length > 0) {
        responseText += `**Closed Statuses (${closedStatuses.length}):**\n`;
        closedStatuses.forEach(s => {
          responseText += `- "${s.name}" (ID: ${s.id})\n`;
        });
        responseText += '\n';
      }

      responseText += `\n**Usage:**\n`;
      responseText += `Use the exact status name (case-insensitive) when updating ${entityType}s.\n`;
      responseText += `Example: status: "${statuses[0]?.name}"\n`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Failed to get available statuses: ${error.message}`);
    }
  }
};

/**
 * Tool to list project milestones/sprints
 */
export const listProjectMilestonesTool = {
  name: 'listProjectMilestones',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    activeOnly: z.boolean().optional().describe('Show only active (not closed) milestones (default: false)')
  },
  handler: async ({ projectIdentifier, activeOnly = false }) => {
    try {
      const milestones = await getProjectMilestones(projectIdentifier, { activeOnly });

      let responseText = `**Project Milestones/Sprints (${milestones.length} ${activeOnly ? 'active ' : ''}milestones)**\n\n`;

      milestones.forEach((m, idx) => {
        responseText += `${idx + 1}. "${m.name}" (ID: ${m.id})\n`;
        if (m.estimatedStart || m.estimatedFinish) {
          responseText += `   Duration: ${m.estimatedStart || 'Not set'} to ${m.estimatedFinish || 'Not set'}\n`;
        }
        responseText += `   Status: ${m.isClosed ? 'Closed' : 'Active'}\n`;
        responseText += '\n';
      });

      responseText += `\n**Usage Tips:**\n`;
      responseText += `You can reference milestones using:\n`;
      responseText += `- Milestone ID (e.g., "${milestones[0]?.id}")\n`;
      responseText += `- Milestone name (e.g., "${milestones[0]?.name}") - supports fuzzy matching\n`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Failed to list project milestones: ${error.message}`);
    }
  }
};

/**
 * Tool to clear metadata cache
 */
export const clearMetadataCacheTool = {
  name: 'clearMetadataCache',
  schema: {
    projectIdentifier: z.string().optional().describe('Project ID or slug (clears all if not provided)')
  },
  handler: async ({ projectIdentifier }) => {
    try {
      if (projectIdentifier) {
        const { resolveProjectId } = await import('../utils.js');
        const projectId = await resolveProjectId(projectIdentifier);
        clearMetadataCache(projectId);
        return createSuccessResponse(`Metadata cache cleared for project ${projectIdentifier}`);
      } else {
        clearMetadataCache();
        return createSuccessResponse('All metadata caches cleared');
      }
    } catch (error) {
      return createErrorResponse(`Failed to clear metadata cache: ${error.message}`);
    }
  }
};

/**
 * Register all metadata tools
 */
export function registerMetadataTools(server) {
  server.tool(getProjectMetadataTool.name, getProjectMetadataTool.schema, getProjectMetadataTool.handler);
  server.tool(listProjectMembersTool.name, listProjectMembersTool.schema, listProjectMembersTool.handler);
  server.tool(getAvailableStatusesTool.name, getAvailableStatusesTool.schema, getAvailableStatusesTool.handler);
  server.tool(listProjectMilestonesTool.name, listProjectMilestonesTool.schema, listProjectMilestonesTool.handler);
  server.tool(clearMetadataCacheTool.name, clearMetadataCacheTool.schema, clearMetadataCacheTool.handler);
}
