/**
 * Batch operations MCP tools for Taiga
 * Enables bulk operations for efficient project management
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  BATCH_OPERATIONS,
  RESPONSE_TEMPLATES
} from '../constants.js';
import { 
  resolveProjectId,
  createErrorResponse,
  createSuccessResponse,
  formatDateTime,
  getSafeValue
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Batch create multiple issues
 */
export const batchCreateIssuesTool = {
  name: 'batchCreateIssues',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    issues: z.array(z.object({
      subject: z.string().describe('Issue title/subject'),
      description: z.string().optional().describe('Issue description'),
      type: z.string().optional().describe('Issue type (Bug, Feature, Question, etc.)'),
      priority: z.string().optional().describe('Issue priority (Low, Normal, High, etc.)'),
      severity: z.string().optional().describe('Issue severity'),
      tags: z.array(z.string()).optional().describe('Issue tags')
    })).describe('Array of issues to create')
  },
  handler: async ({ projectIdentifier, issues }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      
      if (issues.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (issues.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      const results = [];
      const errors = [];
      
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        try {
          const createdIssue = await taigaService.createIssue({
            projectId,
            subject: issue.subject,
            description: issue.description || '',
            type: issue.type,
            priority: issue.priority,
            severity: issue.severity,
            tags: issue.tags || []
          });
          
          results.push({
            index: i + 1,
            subject: issue.subject,
            ref: createdIssue.ref,
            id: createdIssue.id,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            subject: issue.subject,
            error: error.message,
            status: 'failed'
          });
        }
      }

      // Format response
      let responseText = `${BATCH_OPERATIONS.SUCCESS_BATCH_CREATED_ISSUES}\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Created ${results.length} Issues:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} Issues:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.subject} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${issues.length} successful`;
      
      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_CREATE_ISSUE}: ${error.message}`);
    }
  }
};

/**
 * Batch create multiple user stories
 */
export const batchCreateUserStoriesTool = {
  name: 'batchCreateUserStories',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStories: z.array(z.object({
      subject: z.string().describe('User story title'),
      description: z.string().optional().describe('User story description'),
      points: z.number().optional().describe('Story points'),
      tags: z.array(z.string()).optional().describe('User story tags')
    })).describe('Array of user stories to create')
  },
  handler: async ({ projectIdentifier, userStories }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      
      if (userStories.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (userStories.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      const results = [];
      const errors = [];
      
      for (let i = 0; i < userStories.length; i++) {
        const story = userStories[i];
        try {
          const createdStory = await taigaService.createUserStory({
            projectId,
            subject: story.subject,
            description: story.description || '',
            points: story.points,
            tags: story.tags || []
          });
          
          results.push({
            index: i + 1,
            subject: story.subject,
            ref: createdStory.ref,
            id: createdStory.id,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            subject: story.subject,
            error: error.message,
            status: 'failed'
          });
        }
      }

      // Format response
      let responseText = `${BATCH_OPERATIONS.SUCCESS_BATCH_CREATED_STORIES}\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Created ${results.length} User Stories:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} User Stories:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.subject} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${userStories.length} successful`;
      
      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_CREATE_USER_STORY}: ${error.message}`);
    }
  }
};

/**
 * Batch create multiple tasks
 */
export const batchCreateTasksTool = {
  name: 'batchCreateTasks',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStoryRef: z.string().describe('User story reference number (e.g., #123)'),
    tasks: z.array(z.object({
      subject: z.string().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      tags: z.array(z.string()).optional().describe('Task tags')
    })).describe('Array of tasks to create')
  },
  handler: async ({ projectIdentifier, userStoryRef, tasks }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      
      if (tasks.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (tasks.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      // Find user story by reference
      const userStories = await taigaService.listUserStories(projectId);
      const refNumber = userStoryRef.replace('#', '');
      const userStory = userStories.find(story => story.ref === parseInt(refNumber));
      
      if (!userStory) {
        return createErrorResponse(`User story ${userStoryRef} not found`);
      }

      const results = [];
      const errors = [];
      
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        try {
          const createdTask = await taigaService.createTask({
            project: projectId,
            user_story: userStory.id,
            subject: task.subject,
            description: task.description || '',
            tags: task.tags || []
          });
          
          results.push({
            index: i + 1,
            subject: task.subject,
            ref: createdTask.ref,
            id: createdTask.id,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            subject: task.subject,
            error: error.message,
            status: 'failed'
          });
        }
      }

      // Format response
      let responseText = `${BATCH_OPERATIONS.SUCCESS_BATCH_CREATED_TASKS}\n\n`;
      responseText += `**User Story:** ${userStory.subject} (${userStoryRef})\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Created ${results.length} Tasks:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} Tasks:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.subject} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${tasks.length} successful`;
      
      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_CREATE_TASK}: ${error.message}`);
    }
  }
};

/**
 * Batch update multiple tasks
 */
export const batchUpdateTasksTool = {
  name: 'batchUpdateTasks',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    tasks: z.array(z.object({
      taskIdentifier: z.string().describe('Task ID or reference number'),
      subject: z.string().optional().describe('New task title'),
      description: z.string().optional().describe('New task description'),
      status: z.string().optional().describe('Status name'),
      assignedTo: z.string().optional().describe('User identifier (username, email, or ID)'),
      dueDate: z.string().optional().describe('Due date (YYYY-MM-DD) or null to clear'),
      tags: z.array(z.string()).optional().describe('Task tags')
    })).describe('Array of tasks to update'),
    continueOnError: z.boolean().optional().describe('Continue processing if an update fails (default: true)')
  },
  handler: async ({ projectIdentifier, tasks, continueOnError = true }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      if (tasks.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (tasks.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < tasks.length; i++) {
        const taskUpdate = tasks[i];
        try {
          // Import utilities
          const { resolveTask, findIdByName } = await import('../utils.js');
          const { resolveUser } = await import('../userResolution.js');

          // Get current task
          const currentTask = await resolveTask(taskUpdate.taskIdentifier, projectIdentifier);

          // Build update data
          const updateData = {};
          if (taskUpdate.subject !== undefined) updateData.subject = taskUpdate.subject;
          if (taskUpdate.description !== undefined) updateData.description = taskUpdate.description;
          if (taskUpdate.tags !== undefined) updateData.tags = taskUpdate.tags;

          // Handle due date
          if (taskUpdate.dueDate !== undefined) {
            if (taskUpdate.dueDate === null || taskUpdate.dueDate.toLowerCase() === 'null' || taskUpdate.dueDate === '') {
              updateData.due_date = null;
            } else {
              updateData.due_date = taskUpdate.dueDate;
            }
          }

          // Handle status
          if (taskUpdate.status) {
            const statuses = await taigaService.getTaskStatuses(projectId);
            const statusId = findIdByName(statuses, taskUpdate.status);
            if (statusId) {
              updateData.status = statusId;
            }
          }

          // Handle assignment
          if (taskUpdate.assignedTo) {
            if (taskUpdate.assignedTo.toLowerCase() === 'unassign' || taskUpdate.assignedTo.toLowerCase() === 'none') {
              updateData.assigned_to = null;
            } else {
              const user = await resolveUser(taskUpdate.assignedTo, projectId);
              updateData.assigned_to = user.userId;
            }
          }

          const updatedTask = await taigaService.updateTask(currentTask.id, updateData);

          results.push({
            index: i + 1,
            taskIdentifier: taskUpdate.taskIdentifier,
            ref: updatedTask.ref,
            subject: updatedTask.subject,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            taskIdentifier: taskUpdate.taskIdentifier,
            error: error.message,
            status: 'failed'
          });

          if (!continueOnError) {
            break;
          }
        }
      }

      // Format response
      let responseText = `**Batch Update Tasks Completed**\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Updated ${results.length} Tasks:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} Tasks:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.taskIdentifier} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${tasks.length} successful`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Batch update tasks failed: ${error.message}`);
    }
  }
};

/**
 * Batch update multiple user stories
 */
export const batchUpdateUserStoriesTool = {
  name: 'batchUpdateUserStories',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStories: z.array(z.object({
      userStoryIdentifier: z.string().describe('User story ID or reference number'),
      subject: z.string().optional().describe('New user story title'),
      description: z.string().optional().describe('New user story description'),
      status: z.string().optional().describe('Status name'),
      assignedTo: z.string().optional().describe('User identifier (username, email, or ID)'),
      milestone: z.string().optional().describe('Sprint/milestone identifier'),
      points: z.number().optional().describe('Story points'),
      tags: z.array(z.string()).optional().describe('User story tags')
    })).describe('Array of user stories to update'),
    continueOnError: z.boolean().optional().describe('Continue processing if an update fails (default: true)')
  },
  handler: async ({ projectIdentifier, userStories, continueOnError = true }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      if (userStories.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (userStories.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < userStories.length; i++) {
        const storyUpdate = userStories[i];
        try {
          // Import utilities
          const { resolveUserStory, findIdByName, resolveMilestone } = await import('../utils.js');
          const { resolveUser } = await import('../userResolution.js');

          // Get current user story
          const currentStory = await resolveUserStory(storyUpdate.userStoryIdentifier, projectIdentifier);

          // Build update data
          const updateData = {};
          if (storyUpdate.subject !== undefined) updateData.subject = storyUpdate.subject;
          if (storyUpdate.description !== undefined) updateData.description = storyUpdate.description;
          if (storyUpdate.tags !== undefined) updateData.tags = storyUpdate.tags;
          if (storyUpdate.points !== undefined) updateData.points = storyUpdate.points;

          // Handle status
          if (storyUpdate.status) {
            const statuses = await taigaService.getUserStoryStatuses(projectId);
            const statusId = findIdByName(statuses, storyUpdate.status);
            if (statusId) {
              updateData.status = statusId;
            }
          }

          // Handle assignment
          if (storyUpdate.assignedTo) {
            if (storyUpdate.assignedTo.toLowerCase() === 'unassign' || storyUpdate.assignedTo.toLowerCase() === 'none') {
              updateData.assigned_to = null;
            } else {
              const user = await resolveUser(storyUpdate.assignedTo, projectId);
              updateData.assigned_to = user.userId;
            }
          }

          // Handle milestone
          if (storyUpdate.milestone) {
            if (storyUpdate.milestone.toLowerCase() === 'remove' || storyUpdate.milestone.toLowerCase() === 'none') {
              updateData.milestone = null;
            } else {
              const milestone = await resolveMilestone(storyUpdate.milestone, projectIdentifier);
              updateData.milestone = milestone.id;
            }
          }

          const updatedStory = await taigaService.updateUserStory(currentStory.id, updateData);

          results.push({
            index: i + 1,
            userStoryIdentifier: storyUpdate.userStoryIdentifier,
            ref: updatedStory.ref,
            subject: updatedStory.subject,
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            userStoryIdentifier: storyUpdate.userStoryIdentifier,
            error: error.message,
            status: 'failed'
          });

          if (!continueOnError) {
            break;
          }
        }
      }

      // Format response
      let responseText = `**Batch Update User Stories Completed**\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Updated ${results.length} User Stories:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} User Stories:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.userStoryIdentifier} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${userStories.length} successful`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Batch update user stories failed: ${error.message}`);
    }
  }
};

/**
 * Batch assign items to a user
 */
export const batchAssignTool = {
  name: 'batchAssign',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    itemType: z.enum(['task', 'userStory', 'issue']).describe('Type of items to assign'),
    itemIdentifiers: z.array(z.string()).describe('Array of item identifiers (IDs or references)'),
    assignedTo: z.string().describe('User identifier (username, email, ID, or "unassign")'),
    continueOnError: z.boolean().optional().describe('Continue processing if an assignment fails (default: true)')
  },
  handler: async ({ projectIdentifier, itemType, itemIdentifiers, assignedTo, continueOnError = true }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      if (itemIdentifiers.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (itemIdentifiers.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      // Resolve user once for all assignments
      const { resolveUser } = await import('../userResolution.js');
      let userId = null;

      if (assignedTo.toLowerCase() !== 'unassign' && assignedTo.toLowerCase() !== 'none') {
        const user = await resolveUser(assignedTo, projectId);
        userId = user.userId;
      }

      const results = [];
      const errors = [];

      // Import resolve functions
      const { resolveTask, resolveUserStory, resolveIssue } = await import('../utils.js');

      const resolverMap = {
        'task': resolveTask,
        'userStory': resolveUserStory,
        'issue': resolveIssue
      };

      const updateMap = {
        'task': taigaService.updateTask.bind(taigaService),
        'userStory': taigaService.updateUserStory.bind(taigaService),
        'issue': taigaService.updateIssue.bind(taigaService)
      };

      const resolver = resolverMap[itemType];
      const updater = updateMap[itemType];

      for (let i = 0; i < itemIdentifiers.length; i++) {
        const identifier = itemIdentifiers[i];
        try {
          // Resolve item
          const item = await resolver(identifier, projectIdentifier);

          // Update assignment - PATCH returns complete object with assigned_to_extra_info
          const updatedItem = await updater(item.id, {
            assigned_to: userId
          });

          results.push({
            index: i + 1,
            identifier,
            ref: updatedItem.ref,
            subject: updatedItem.subject,
            assignedTo: updatedItem.assigned_to_extra_info?.full_name || 'Unassigned',
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            identifier,
            error: error.message,
            status: 'failed'
          });

          if (!continueOnError) {
            break;
          }
        }
      }

      // Format response
      const assigneeName = userId ? (assignedTo) : 'Unassigned';
      let responseText = `**Batch Assignment Completed**\n`;
      responseText += `Assigned to: ${assigneeName}\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Assigned ${results.length} ${itemType}s:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref})\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} ${itemType}s:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.identifier} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${itemIdentifiers.length} successful`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Batch assignment failed: ${error.message}`);
    }
  }
};

/**
 * Batch update due dates for items
 */
export const batchUpdateDueDatesTool = {
  name: 'batchUpdateDueDates',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    itemType: z.enum(['task', 'userStory', 'issue']).describe('Type of items'),
    itemIdentifiers: z.array(z.string()).describe('Array of item identifiers'),
    dueDate: z.string().describe('Due date (YYYY-MM-DD), relative (+7d, -3d), or "sprint_end"'),
    sprintIdentifier: z.string().optional().describe('Sprint identifier (required for "sprint_end")'),
    continueOnError: z.boolean().optional().describe('Continue processing if an update fails (default: true)')
  },
  handler: async ({ projectIdentifier, itemType, itemIdentifiers, dueDate, sprintIdentifier, continueOnError = true }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      if (itemIdentifiers.length === 0) {
        return createErrorResponse(BATCH_OPERATIONS.ERROR_EMPTY_BATCH);
      }

      if (itemIdentifiers.length > BATCH_OPERATIONS.MAX_BATCH_SIZE) {
        return createErrorResponse(`${BATCH_OPERATIONS.ERROR_BATCH_TOO_LARGE} (max: ${BATCH_OPERATIONS.MAX_BATCH_SIZE})`);
      }

      // Calculate actual due date
      let actualDueDate = null;

      if (dueDate === 'sprint_end') {
        if (!sprintIdentifier) {
          return createErrorResponse('Sprint identifier required for "sprint_end" due date');
        }
        const { resolveMilestone } = await import('../utils.js');
        const sprint = await resolveMilestone(sprintIdentifier, projectIdentifier);
        actualDueDate = sprint.estimated_finish;
      } else if (dueDate.match(/^[+-]\d+d$/)) {
        // Relative date (e.g., +7d, -3d)
        const days = parseInt(dueDate.replace('d', ''));
        const date = new Date();
        date.setDate(date.getDate() + days);
        actualDueDate = date.toISOString().split('T')[0];
      } else if (dueDate.toLowerCase() === 'null' || dueDate === '') {
        actualDueDate = null;
      } else {
        // Absolute date
        actualDueDate = dueDate;
      }

      const results = [];
      const errors = [];

      // Import resolve functions
      const { resolveTask, resolveUserStory, resolveIssue } = await import('../utils.js');

      const resolverMap = {
        'task': resolveTask,
        'userStory': resolveUserStory,
        'issue': resolveIssue
      };

      const updateMap = {
        'task': taigaService.updateTask.bind(taigaService),
        'userStory': taigaService.updateUserStory.bind(taigaService),
        'issue': taigaService.updateIssue.bind(taigaService)
      };

      const resolver = resolverMap[itemType];
      const updater = updateMap[itemType];

      for (let i = 0; i < itemIdentifiers.length; i++) {
        const identifier = itemIdentifiers[i];
        try {
          // Resolve item
          const item = await resolver(identifier, projectIdentifier);

          // Update due date
          const updatedItem = await updater(item.id, {
            due_date: actualDueDate
          });

          results.push({
            index: i + 1,
            identifier,
            ref: updatedItem.ref,
            subject: updatedItem.subject,
            dueDate: updatedItem.due_date || 'No due date',
            status: 'success'
          });
        } catch (error) {
          errors.push({
            index: i + 1,
            identifier,
            error: error.message,
            status: 'failed'
          });

          if (!continueOnError) {
            break;
          }
        }
      }

      // Format response
      let responseText = `**Batch Update Due Dates Completed**\n`;
      responseText += `Due date set to: ${actualDueDate || 'None'}\n\n`;

      if (results.length > 0) {
        responseText += `**Successfully Updated ${results.length} ${itemType}s:**\n`;
        results.forEach(result => {
          responseText += `${result.index}. ${result.subject} (#${result.ref}) - Due: ${result.dueDate}\n`;
        });
      }

      if (errors.length > 0) {
        responseText += `\n**Failed ${errors.length} ${itemType}s:**\n`;
        errors.forEach(error => {
          responseText += `${error.index}. ${error.identifier} - ${error.error}\n`;
        });
      }

      responseText += `\n**Summary:** ${results.length}/${itemIdentifiers.length} successful`;

      return createSuccessResponse(responseText);
    } catch (error) {
      return createErrorResponse(`Batch update due dates failed: ${error.message}`);
    }
  }
};

/**
 * Register all batch tools
 */
export function registerBatchTools(server) {
  server.tool(batchCreateIssuesTool.name, batchCreateIssuesTool.schema, batchCreateIssuesTool.handler);
  server.tool(batchCreateUserStoriesTool.name, batchCreateUserStoriesTool.schema, batchCreateUserStoriesTool.handler);
  server.tool(batchCreateTasksTool.name, batchCreateTasksTool.schema, batchCreateTasksTool.handler);
  server.tool(batchUpdateTasksTool.name, batchUpdateTasksTool.schema, batchUpdateTasksTool.handler);
  server.tool(batchUpdateUserStoriesTool.name, batchUpdateUserStoriesTool.schema, batchUpdateUserStoriesTool.handler);
  server.tool(batchAssignTool.name, batchAssignTool.schema, batchAssignTool.handler);
  server.tool(batchUpdateDueDatesTool.name, batchUpdateDueDatesTool.schema, batchUpdateDueDatesTool.handler);
}