/**
 * Task related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { SUCCESS_MESSAGES, STATUS_LABELS } from '../constants.js';
import {
  resolveProjectId,
  resolveTask,
  findIdByName,
  getSafeValue,
  formatDateTime,
  createErrorResponse,
  createSuccessResponse
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to create a new task
 */
export const createTaskTool = {
  name: 'createTask',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStoryIdentifier: z.string().describe('User story ID or reference number'),
    subject: z.string().describe('Task title/subject'),
    description: z.string().optional().describe('Task description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  handler: async ({ projectIdentifier, userStoryIdentifier, subject, description, status, tags }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Get user story ID - support both reference numbers (#32 or 32) and IDs
      let userStoryId = userStoryIdentifier;
      let refNumber = null;

      // Check if it's a reference number (with or without #)
      if (userStoryIdentifier.startsWith('#')) {
        refNumber = userStoryIdentifier.substring(1);
      } else {
        // If it's a small number, likely a reference rather than an ID
        const numValue = parseInt(userStoryIdentifier, 10);
        if (!isNaN(numValue) && numValue < 10000) {
          refNumber = userStoryIdentifier;
        }
      }

      // If we identified it as a reference, resolve it to ID
      if (refNumber !== null) {
        const userStories = await taigaService.listUserStories(projectId);
        const userStory = userStories.find(us => us.ref.toString() === refNumber);
        if (userStory) {
          userStoryId = userStory.id;
          console.log(`Resolved User Story reference #${refNumber} to internal ID: ${userStoryId}`);
        } else {
          // Provide helpful error with available references
          const availableRefs = userStories.map(us => `#${us.ref}`).slice(0, 10).join(', ');
          throw new Error(
            `User story with reference #${refNumber} not found in project ${projectId}.\n` +
            `Available references: ${availableRefs}${userStories.length > 10 ? '...' : ''}`
          );
        }
      } else {
        console.log(`Using User Story identifier as internal ID: ${userStoryId}`);
      }

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getTaskStatuses(projectId);
        statusId = findIdByName(statuses, status);
      }

      // Create the task
      const taskData = {
        project: projectId,
        user_story: userStoryId,
        subject,
        description,
        status: statusId,
        tags,
      };

      const createdTask = await taigaService.createTask(taskData);

      const creationDetails = `${SUCCESS_MESSAGES.TASK_CREATED}

Subject: ${createdTask.subject}
Reference: #${createdTask.ref}
Status: ${getSafeValue(createdTask.status_extra_info?.name, 'Default status')}
Project: ${getSafeValue(createdTask.project_extra_info?.name)}
User Story: #${createdTask.user_story_extra_info?.ref} - ${createdTask.user_story_extra_info?.subject}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create task: ${error.message}`);
    }
  }
};

/**
 * Tool to get single task details
 */
export const getTaskTool = {
  name: 'getTask',
  schema: {
    taskIdentifier: z.string().describe('Task ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ taskIdentifier, projectIdentifier }) => {
    try {
      const task = await resolveTask(taskIdentifier, projectIdentifier);

      const taskDetails = `Task Details: #${task.ref} - ${task.subject}

Basic Information:
- Project: ${getSafeValue(task.project_extra_info?.name)}
- Status: ${getSafeValue(task.status_extra_info?.name)}
- User Story: ${task.user_story_extra_info ? `#${task.user_story_extra_info.ref} - ${task.user_story_extra_info.subject}` : STATUS_LABELS.NOT_SET}

Assignment:
- Assigned to: ${getSafeValue(task.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}

Timeline:
- Created: ${formatDateTime(task.created_date)}
- Modified: ${formatDateTime(task.modified_date)}
- Due Date: ${getSafeValue(task.due_date, STATUS_LABELS.NOT_SET)}

Description:
${getSafeValue(task.description, STATUS_LABELS.NO_DESCRIPTION)}

Tags: ${getSafeValue(task.tags?.join(', '), STATUS_LABELS.NO_TAGS)}`;

      return createSuccessResponse(taskDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get task details: ${error.message}`);
    }
  }
};

/**
 * Tool to update a task
 */
export const updateTaskTool = {
  name: 'updateTask',
  schema: {
    taskIdentifier: z.string().describe('Task ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
    subject: z.string().optional().describe('New task title/subject'),
    description: z.string().optional().describe('New task description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress", "Done")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
    assignedTo: z.string().optional().describe('Username or user ID to assign to (or "unassign" to remove assignment)'),
    dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format (e.g., "2025-12-31") or null to remove'),
  },
  handler: async ({ taskIdentifier, projectIdentifier, subject, description, status, tags, assignedTo, dueDate }) => {
    try {
      // Get current task
      const currentTask = await resolveTask(taskIdentifier, projectIdentifier);
      const projectId = currentTask.project;

      // Build update data object
      const updateData = {};

      if (subject !== undefined) updateData.subject = subject;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags;

      // Handle due date
      if (dueDate !== undefined) {
        // Allow null or "null" to clear the due date
        if (dueDate === null || dueDate.toLowerCase() === 'null' || dueDate === '') {
          updateData.due_date = null;
        } else {
          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(dueDate)) {
            return createErrorResponse(
              `Invalid due date format: "${dueDate}". Expected format: YYYY-MM-DD (e.g., "2025-12-31")`
            );
          }
          updateData.due_date = dueDate;
        }
      }

      // Get status ID if a status name was provided
      if (status) {
        const statuses = await taigaService.getTaskStatuses(projectId);
        const statusId = findIdByName(statuses, status);
        if (!statusId) {
          const availableStatuses = statuses.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');
          return createErrorResponse(
            `Invalid status name: "${status}". Available statuses:\n${availableStatuses}`
          );
        }
        updateData.status = statusId;
      }

      // Get assignee ID if provided
      if (assignedTo) {
        if (assignedTo.toLowerCase() === 'unassign' || assignedTo.toLowerCase() === 'none') {
          updateData.assigned_to = null;
        } else {
          // Use enhanced user resolution
          const { resolveUser } = await import('../userResolution.js');
          try {
            const user = await resolveUser(assignedTo, projectId, {
              fuzzyMatch: true,
              fuzzyThreshold: 70
            });
            updateData.assigned_to = user.userId;
          } catch (error) {
            return createErrorResponse(
              `Failed to resolve user for assignment:\n${error.message}`
            );
          }
        }
      }

      const updatedTask = await taigaService.updateTask(currentTask.id, updateData);

      // Small delay to ensure Taiga API has propagated the changes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Re-fetch task to get enriched data (assigned_to_extra_info, etc.)
      // because PATCH doesn't always return complete *_extra_info fields
      const enrichedTask = await taigaService.getTask(currentTask.id);

      const updateDetails = `${SUCCESS_MESSAGES.TASK_UPDATED}

Task: #${enrichedTask.ref} - ${enrichedTask.subject}
Project: ${getSafeValue(enrichedTask.project_extra_info?.name)}
Status: ${getSafeValue(enrichedTask.status_extra_info?.name)}
Assigned to: ${getSafeValue(enrichedTask.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}
Due Date: ${getSafeValue(enrichedTask.due_date, STATUS_LABELS.NOT_SET)}
User Story: ${enrichedTask.user_story_extra_info ? `#${enrichedTask.user_story_extra_info.ref} - ${enrichedTask.user_story_extra_info.subject}` : STATUS_LABELS.NOT_SET}`;

      return createSuccessResponse(updateDetails);
    } catch (error) {
      return createErrorResponse(`Failed to update task: ${error.message}`);
    }
  }
};