/**
 * Sprint (Milestone) related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES } from '../constants.js';
import {
  resolveProjectId,
  resolveMilestone,
  formatSprintList,
  formatDate,
  formatSprintIssues,
  getStatusLabel,
  getSafeValue,
  calculateCompletionPercentage,
  createErrorResponse,
  createSuccessResponse
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list sprints in a project
 */
export const listSprintsTool = {
  name: 'listMilestones',
  description: 'List all sprints (milestones) in a project. Returns the complete list with automatic pagination.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const milestones = await taigaService.listMilestones(projectId);

      if (milestones.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_SPRINTS);
      }

      const sprintsList = `Sprints in Project:\n\n${formatSprintList(milestones)}`;
      return createSuccessResponse(sprintsList);
    } catch (error) {
      return createErrorResponse(`Failed to list sprints: ${error.message}`);
    }
  }
};

/**
 * Tool to get sprint details and statistics
 */
export const getSprintStatsTool = {
  name: 'getMilestoneStats',
  description: 'Get detailed statistics for a specific sprint (milestone). Accepts sprint ID or name.',
  schema: {
    milestoneIdentifier: z.string().describe('Milestone (Sprint) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using milestone name)'),
  },
  handler: async ({ milestoneIdentifier, projectIdentifier }) => {
    try {
      // Resolve milestone using the same logic as other tools
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);

      // Get statistics using the resolved milestone's ID
      const stats = await taigaService.getMilestoneStats(milestone.id);

      const startDate = formatDate(milestone.estimated_start);
      const endDate = formatDate(milestone.estimated_finish);
      const status = getStatusLabel(milestone.closed);
      const completionRate = calculateCompletionPercentage(stats.completed_userstories || 0, stats.total_userstories || 0);

      const milestoneDetails = `Sprint Details: ${milestone.name}

Basic Information:
- Status: ${status}
- Start Date: ${startDate}
- End Date: ${endDate}
- Project: ${getSafeValue(milestone.project_extra_info?.name)}

Progress Statistics:
- User Stories: ${stats.completed_userstories || 0}/${stats.total_userstories || 0} completed
- Tasks: ${stats.completed_tasks || 0}/${stats.total_tasks || 0} completed
- Points: ${stats.completed_points || 0}/${stats.total_points || 0} completed
- Hours: ${stats.completed_hours || 0}/${stats.total_hours || 0} completed

User Stories Progress:
${stats.completed_userstories || 0 > 0 ? `Completed: ${stats.completed_userstories}` : 'No completed stories'}
${(stats.total_userstories || 0) - (stats.completed_userstories || 0) > 0 ? `Remaining: ${(stats.total_userstories || 0) - (stats.completed_userstories || 0)}` : ''}

Completion Rate: ${completionRate}%`;

      return createSuccessResponse(milestoneDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get sprint details: ${error.message}`);
    }
  }
};

/**
 * Tool to create a new sprint
 */
export const createSprintTool = {
  name: 'createMilestone',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    name: z.string().describe('Sprint name'),
    estimatedStart: z.string().optional().describe('Estimated start date (YYYY-MM-DD)'),
    estimatedFinish: z.string().optional().describe('Estimated finish date (YYYY-MM-DD)'),
  },
  handler: async ({ projectIdentifier, name, estimatedStart, estimatedFinish }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Create the milestone
      const milestoneData = {
        project: projectId,
        name,
        estimated_start: estimatedStart,
        estimated_finish: estimatedFinish,
      };

      const createdMilestone = await taigaService.createMilestone(milestoneData);

      const creationDetails = `${SUCCESS_MESSAGES.SPRINT_CREATED}

Name: ${createdMilestone.name}
ID: ${createdMilestone.id}
Start Date: ${getSafeValue(createdMilestone.estimated_start, 'Not set')}
End Date: ${getSafeValue(createdMilestone.estimated_finish, 'Not set')}
Project: ${getSafeValue(createdMilestone.project_extra_info?.name)}
Status: ${getStatusLabel(createdMilestone.closed)}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to get issues by sprint
 */
export const getIssuesBySprintTool = {
  name: 'getIssuesByMilestone',
  description: 'Get all issues in a specific sprint (milestone). Returns the complete list with automatic pagination.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    milestoneIdentifier: z.string().describe('Sprint (Milestone) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
  },
  handler: async ({ projectIdentifier, milestoneIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Resolve milestone using the same logic as other tools
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);

      // Get issues using the resolved milestone's ID
      const issues = await taigaService.getIssuesByMilestone(projectId, milestone.id);

      if (issues.length === 0) {
        return createErrorResponse(`No issues found in Sprint: ${milestone.name}`);
      }

      const sprintOverview = `Issues in Sprint: ${milestone.name}

Sprint Overview:
- Sprint: ${milestone.name}
- Status: ${getStatusLabel(milestone.closed)}
- Duration: ${formatDate(milestone.estimated_start)} ~ ${formatDate(milestone.estimated_finish)}
- Total Issues: ${issues.length}

Issues List:
${formatSprintIssues(issues)}`;

      return createSuccessResponse(sprintOverview);
    } catch (error) {
      return createErrorResponse(`Failed to get issues by sprint: ${error.message}`);
    }
  }
};