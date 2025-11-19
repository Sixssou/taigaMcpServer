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

      // Get user story ID if a reference number was provided
      let userStoryId = userStoryIdentifier;
      if (userStoryIdentifier.startsWith('#')) {
        // Remove the # prefix
        const refNumber = userStoryIdentifier.substring(1);
        // Get all user stories for the project
        const userStories = await taigaService.listUserStories(projectId);
        // Find the user story with the matching reference number
        const userStory = userStories.find(us => us.ref.toString() === refNumber);
        if (userStory) {
          userStoryId = userStory.id;
        } else {
          throw new Error(`User story with reference ${userStoryIdentifier} not found`);
        }
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

📋 Basic Information:
- Project: ${getSafeValue(task.project_extra_info?.name)}
- Status: ${getSafeValue(task.status_extra_info?.name)}
- User Story: ${task.user_story_extra_info ? `#${task.user_story_extra_info.ref} - ${task.user_story_extra_info.subject}` : STATUS_LABELS.NOT_SET}

🎯 Assignment:
- Assigned to: ${getSafeValue(task.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}

📅 Timeline:
- Created: ${formatDateTime(task.created_date)}
- Modified: ${formatDateTime(task.modified_date)}

📝 Description:
${getSafeValue(task.description, STATUS_LABELS.NO_DESCRIPTION)}

🏷️ Tags: ${getSafeValue(task.tags?.join(', '), STATUS_LABELS.NO_TAGS)}`;

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
  },
  handler: async ({ taskIdentifier, projectIdentifier, subject, description, status, tags, assignedTo }) => {
    try {
      // Get current task
      const currentTask = await resolveTask(taskIdentifier, projectIdentifier);
      const projectId = currentTask.project;

      // Build update data object
      const updateData = {};

      if (subject !== undefined) updateData.subject = subject;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags;

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
          // Get project members to find the assignee
          const members = await taigaService.getProjectMembers(projectId);

          // Try to find user by full name, email, or user ID
          const member = members.find(m =>
            m.full_name === assignedTo ||
            m.user === parseInt(assignedTo) ||
            m.email === assignedTo ||
            m.user_email === assignedTo ||
            m.full_name?.toLowerCase() === assignedTo.toLowerCase()
          );

          if (!member) {
            const availableMembers = members.map(m =>
              `- ${m.full_name} (${m.user_email || m.email}) - ID: ${m.user}`
            ).join('\n');

            return createErrorResponse(
              `User "${assignedTo}" not found in project. Available members:\n${availableMembers}`
            );
          }

          updateData.assigned_to = member.user;
        }
      }

      const updatedTask = await taigaService.updateTask(currentTask.id, updateData);

      const updateDetails = `${SUCCESS_MESSAGES.TASK_UPDATED}

Task: #${updatedTask.ref} - ${updatedTask.subject}
Project: ${getSafeValue(updatedTask.project_extra_info?.name)}
Status: ${getSafeValue(updatedTask.status_extra_info?.name)}
Assigned to: ${getSafeValue(updatedTask.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}
User Story: ${updatedTask.user_story_extra_info ? `#${updatedTask.user_story_extra_info.ref} - ${updatedTask.user_story_extra_info.subject}` : STATUS_LABELS.NOT_SET}`;

      return createSuccessResponse(updateDetails);
    } catch (error) {
      return createErrorResponse(`Failed to update task: ${error.message}`);
    }
  }
};