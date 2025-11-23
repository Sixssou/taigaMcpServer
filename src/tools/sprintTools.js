/**
 * Sprint (Milestone) related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES } from '../constants.js';
import {
  resolveProjectId,
  resolveMilestone,
  resolveUserStory,
  formatSprintList,
  formatDate,
  formatSprintIssues,
  getStatusLabel,
  getSafeValue,
  calculateCompletionPercentage,
  createErrorResponse,
  createSuccessResponse,
  enrichUserStoryObject,
  enrichTaskObject,
  enrichIssueObject
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

/**
 * Tool to update a sprint
 */
export const updateSprintTool = {
  name: 'updateMilestone',
  description: 'Update a sprint (milestone) with new information. Can update name, dates, and status.',
  schema: {
    milestoneIdentifier: z.string().describe('Milestone (Sprint) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using milestone name)'),
    name: z.string().optional().describe('New sprint name'),
    estimatedStart: z.string().optional().describe('New estimated start date (YYYY-MM-DD)'),
    estimatedFinish: z.string().optional().describe('New estimated finish date (YYYY-MM-DD)'),
    closed: z.boolean().optional().describe('Whether to close/reopen the sprint'),
  },
  handler: async ({ milestoneIdentifier, projectIdentifier, name, estimatedStart, estimatedFinish, closed }) => {
    try {
      // Resolve milestone using the same logic as other tools
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);

      // Build update data object with only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (estimatedStart !== undefined) updateData.estimated_start = estimatedStart;
      if (estimatedFinish !== undefined) updateData.estimated_finish = estimatedFinish;
      if (closed !== undefined) updateData.closed = closed;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return createErrorResponse('No update data provided. Please specify at least one field to update.');
      }

      // Update the milestone
      const updatedMilestone = await taigaService.updateMilestone(milestone.id, updateData);

      const updateDetails = `${SUCCESS_MESSAGES.SPRINT_UPDATED}

Name: ${updatedMilestone.name}
ID: ${updatedMilestone.id}
Start Date: ${getSafeValue(updatedMilestone.estimated_start, 'Not set')}
End Date: ${getSafeValue(updatedMilestone.estimated_finish, 'Not set')}
Project: ${getSafeValue(updatedMilestone.project_extra_info?.name)}
Status: ${getStatusLabel(updatedMilestone.closed)}`;

      return createSuccessResponse(updateDetails);
    } catch (error) {
      return createErrorResponse(`Failed to update sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to delete a sprint
 */
export const deleteSprintTool = {
  name: 'deleteMilestone',
  description: 'Delete a sprint (milestone) from a project. WARNING: This action cannot be undone!',
  schema: {
    milestoneIdentifier: z.string().describe('Milestone (Sprint) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using milestone name)'),
  },
  handler: async ({ milestoneIdentifier, projectIdentifier }) => {
    try {
      // Resolve milestone using the same logic as other tools
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);

      // Store milestone info before deletion
      const milestoneName = milestone.name;
      const milestoneId = milestone.id;

      // Delete the milestone
      await taigaService.deleteMilestone(milestoneId);

      const deletionDetails = `${SUCCESS_MESSAGES.SPRINT_DELETED}

Deleted Sprint: ${milestoneName}
ID: ${milestoneId}
Project: ${getSafeValue(milestone.project_extra_info?.name)}`;

      return createSuccessResponse(deletionDetails);
    } catch (error) {
      return createErrorResponse(`Failed to delete sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to get complete sprint structure with enriched metadata
 */
export const getSprintCompleteTool = {
  name: 'getSprintComplete',
  description: 'Get complete sprint structure with user stories, tasks, and issues. Returns enriched metadata including status, assignees, priorities, due dates, and more.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    milestoneIdentifier: z.string().describe('Milestone (Sprint) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
    includeUserStories: z.boolean().optional().describe('Include user stories in response (default: true)'),
    includeTasks: z.boolean().optional().describe('Include tasks for each user story (default: true)'),
    includeIssues: z.boolean().optional().describe('Include issues in response (default: false)'),
    includeClosedItems: z.boolean().optional().describe('Include closed/completed items (default: false)'),
  },
  handler: async ({ projectIdentifier, milestoneIdentifier, includeUserStories = true, includeTasks = true, includeIssues = false, includeClosedItems = false }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);
      const stats = await taigaService.getMilestoneStats(milestone.id);

      // Build sprint basic info
      const sprintData = {
        sprint: {
          id: milestone.id,
          name: milestone.name,
          slug: milestone.slug,
          status: getStatusLabel(milestone.closed),
          estimatedStart: milestone.estimated_start,
          estimatedFinish: milestone.estimated_finish,
          createdDate: milestone.created_date,
          modifiedDate: milestone.modified_date
        },
        stats: {
          totalUserStories: stats.total_userstories || 0,
          completedUserStories: stats.completed_userstories || 0,
          totalTasks: stats.total_tasks || 0,
          completedTasks: stats.completed_tasks || 0,
          totalPoints: stats.total_points || 0,
          completedPoints: stats.completed_points || 0,
          totalIssues: 0,
          completedIssues: 0
        }
      };

      // Fetch user stories if requested
      if (includeUserStories) {
        let userStories = await taigaService.getUserStoriesByMilestone(projectId, milestone.id);

        // Filter closed items if needed
        if (!includeClosedItems) {
          userStories = userStories.filter(us => !us.is_closed && !(us.status_extra_info?.is_closed));
        }

        // Enrich user stories with tasks if requested
        const enrichedUserStories = [];
        for (const userStory of userStories) {
          let tasks = null;

          if (includeTasks) {
            tasks = await taigaService.getTasksByUserStory(userStory.id);

            // Filter closed tasks if needed
            if (!includeClosedItems) {
              tasks = tasks.filter(task => !task.is_closed && !(task.status_extra_info?.is_closed));
            }
          }

          enrichedUserStories.push(enrichUserStoryObject(userStory, tasks));
        }

        sprintData.userStories = enrichedUserStories;
      }

      // Fetch issues if requested
      if (includeIssues) {
        let issues = await taigaService.getIssuesByMilestone(projectId, milestone.id);

        // Filter closed items if needed
        if (!includeClosedItems) {
          issues = issues.filter(issue => !issue.is_closed && !(issue.status_extra_info?.is_closed));
        }

        // Update stats
        sprintData.stats.totalIssues = issues.length;
        sprintData.stats.completedIssues = issues.filter(issue => issue.is_closed || issue.status_extra_info?.is_closed).length;

        sprintData.issues = issues.map(issue => enrichIssueObject(issue));
      }

      // Return as JSON
      return createSuccessResponse(JSON.stringify(sprintData, null, 2));
    } catch (error) {
      return createErrorResponse(`Failed to get complete sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to get user stories by milestone with enriched metadata (without tasks for performance)
 */
export const getUserStoriesByMilestoneTool = {
  name: 'getUserStoriesByMilestone',
  description: 'Get all user stories in a sprint with enriched metadata. Optimized for performance by excluding task details.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    milestoneIdentifier: z.string().describe('Milestone (Sprint) ID or name (e.g., "123" or "Sprint 1" - auto-detects format)'),
    includeClosedStories: z.boolean().optional().describe('Include closed/completed user stories (default: false)'),
  },
  handler: async ({ projectIdentifier, milestoneIdentifier, includeClosedStories = false }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const milestone = await resolveMilestone(milestoneIdentifier, projectIdentifier);

      // Fetch user stories
      let userStories = await taigaService.getUserStoriesByMilestone(projectId, milestone.id);

      // Filter closed items if needed
      if (!includeClosedStories) {
        userStories = userStories.filter(us => !us.is_closed && !(us.status_extra_info?.is_closed));
      }

      // Enrich user stories (without tasks)
      const enrichedUserStories = userStories.map(us => enrichUserStoryObject(us, null));

      const result = {
        userStories: enrichedUserStories,
        total: enrichedUserStories.length
      };

      return createSuccessResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      return createErrorResponse(`Failed to get user stories by milestone: ${error.message}`);
    }
  }
};

/**
 * Tool to get tasks by user story with enriched metadata
 */
export const getTasksByUserStoryTool = {
  name: 'getTasksByUserStory',
  description: 'Get all tasks for a specific user story with enriched metadata including status, assignees, priorities, and due dates.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStoryIdentifier: z.string().describe('User story ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    includeClosedTasks: z.boolean().optional().describe('Include closed/completed tasks (default: false)'),
  },
  handler: async ({ projectIdentifier, userStoryIdentifier, includeClosedTasks = false }) => {
    try {
      // Resolve user story
      const userStory = await resolveUserStory(userStoryIdentifier, projectIdentifier);

      // Fetch tasks
      let tasks = await taigaService.getTasksByUserStory(userStory.id);

      // Count totals before filtering
      const totalClosed = tasks.filter(task => task.is_closed || task.status_extra_info?.is_closed).length;

      // Filter closed items if needed
      if (!includeClosedTasks) {
        tasks = tasks.filter(task => !task.is_closed && !(task.status_extra_info?.is_closed));
      }

      // Enrich tasks
      const enrichedTasks = tasks.map(task => enrichTaskObject(task));

      const result = {
        userStory: {
          id: userStory.id,
          ref: userStory.ref,
          subject: userStory.subject
        },
        tasks: enrichedTasks,
        total: includeClosedTasks ? tasks.length : (tasks.length + totalClosed),
        totalClosed: totalClosed
      };

      return createSuccessResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      return createErrorResponse(`Failed to get tasks by user story: ${error.message}`);
    }
  }
};