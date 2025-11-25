/**
 * User Story related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES, ERROR_MESSAGES, STATUS_LABELS } from '../constants.js';
import {
  resolveProjectId,
  findIdByName,
  formatUserStoryList,
  getSafeValue,
  createErrorResponse,
  createSuccessResponse,
  formatDateTime,
  resolveUserStory,
  enrichUserStoryWithDetails
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list user stories in a project
 */
export const listUserStoriesTool = {
  name: 'listUserStories',
  description: 'List all user stories in a project. Returns the complete list with automatic pagination.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const userStories = await taigaService.listUserStories(projectId);

      if (userStories.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_USER_STORIES);
      }

      const userStoriesText = `User Stories in Project:\n\n${formatUserStoryList(userStories)}`;
      return createSuccessResponse(userStoriesText);
    } catch (error) {
      return createErrorResponse(`Failed to list user stories: ${error.message}`);
    }
  }
};

/**
 * Tool to create a new user story
 */
export const createUserStoryTool = {
  name: 'createUserStory',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    subject: z.string().describe('User story title/subject'),
    description: z.string().optional().describe('User story description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  handler: async ({ projectIdentifier, subject, description, status, tags }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getUserStoryStatuses(projectId);
        statusId = findIdByName(statuses, status);
      }

      // Create the user story
      const userStoryData = {
        project: projectId,
        subject,
        description,
        status: statusId,
        tags,
      };

      const createdStory = await taigaService.createUserStory(userStoryData);

      const creationDetails = `${SUCCESS_MESSAGES.USER_STORY_CREATED}

Subject: ${createdStory.subject}
Reference: #${createdStory.ref}
Status: ${getSafeValue(createdStory.status_extra_info?.name, 'Default status')}
Project: ${getSafeValue(createdStory.project_extra_info?.name)}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create user story: ${error.message}`);
    }
  }
};

/**
 * Tool to get single user story details
 */
export const getUserStoryTool = {
  name: 'getUserStory',
  schema: {
    userStoryIdentifier: z.string().describe('User story ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ userStoryIdentifier, projectIdentifier }) => {
    try {
      let userStory = await resolveUserStory(userStoryIdentifier, projectIdentifier);

      // Enrich with full milestone and epic details if needed
      userStory = await enrichUserStoryWithDetails(userStory);

      // Extract milestone information
      const milestoneName = userStory.milestone_extra_info?.name ||
                           (userStory.milestone ? `Milestone #${userStory.milestone}` : 'No milestone');

      // Extract epic information from epics array (Taiga returns epics as array, not single field)
      const epicName = userStory.epics && userStory.epics.length > 0
        ? userStory.epics[0].subject
        : 'No epic';
      const epicId = userStory.epics && userStory.epics.length > 0
        ? userStory.epics[0].id
        : null;

      const userStoryDetails = `User Story Details: #${userStory.ref} - ${userStory.subject}

Basic Information:
- Project: ${getSafeValue(userStory.project_extra_info?.name)}
- Status: ${getSafeValue(userStory.status_extra_info?.name)}
- Points: ${getSafeValue(userStory.total_points, 'Not set')}
- Owner: ${getSafeValue(userStory.owner_extra_info?.full_name)}

Assignment & Organization:
- Assigned to: ${getSafeValue(userStory.assigned_to_extra_info?.full_name_display, STATUS_LABELS.UNASSIGNED)}
- Milestone: ${milestoneName}${userStory.milestone ? ` (ID: ${userStory.milestone})` : ''}
- Epic: ${epicName}${epicId ? ` (ID: ${epicId})` : ''}

Timeline:
- Created: ${formatDateTime(userStory.created_date)}
- Modified: ${formatDateTime(userStory.modified_date)}

Description:
${getSafeValue(userStory.description, 'No description provided')}

Tags: ${getSafeValue(userStory.tags?.join(', '), 'No tags')}`;

      return createSuccessResponse(userStoryDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get user story: ${error.message}`);
    }
  }
};

/**
 * Tool to update a user story
 */
export const updateUserStoryTool = {
  name: 'updateUserStory',
  schema: {
    userStoryIdentifier: z.string().describe('User story ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
    subject: z.string().optional().describe('New user story title/subject'),
    description: z.string().optional().describe('New user story description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
    points: z.number().optional().describe('Story points'),
    assignedTo: z.string().optional().describe('Username or user ID to assign to'),
  },
  handler: async ({ userStoryIdentifier, projectIdentifier, subject, description, status, tags, points, assignedTo }) => {
    try {
      // Get current user story
      const currentStory = await resolveUserStory(userStoryIdentifier, projectIdentifier);
      const projectId = currentStory.project;

      // Build update data object
      const updateData = {};
      
      if (subject !== undefined) updateData.subject = subject;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags;
      if (points !== undefined) updateData.points = points;

      // Get status ID if a status name was provided
      if (status) {
        const statuses = await taigaService.getUserStoryStatuses(projectId);
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

      const updatedStory = await taigaService.updateUserStory(currentStory.id, updateData);

      const updateDetails = `${SUCCESS_MESSAGES.USER_STORY_UPDATED}

User Story: #${updatedStory.ref} - ${updatedStory.subject}
Project: ${getSafeValue(updatedStory.project_extra_info?.name)}
Status: ${getSafeValue(updatedStory.status_extra_info?.name)}
Points: ${getSafeValue(updatedStory.total_points, 'Not set')}
Assigned to: ${getSafeValue(updatedStory.assigned_to_extra_info?.full_name_display, STATUS_LABELS.UNASSIGNED)}`;

      return createSuccessResponse(updateDetails);
    } catch (error) {
      return createErrorResponse(`Failed to update user story: ${error.message}`);
    }
  }
};

/**
 * Tool to delete a user story
 */
export const deleteUserStoryTool = {
  name: 'deleteUserStory',
  schema: {
    userStoryIdentifier: z.string().describe('User story ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ userStoryIdentifier, projectIdentifier }) => {
    try {
      // Get user story details before deletion for confirmation message
      const userStory = await resolveUserStory(userStoryIdentifier, projectIdentifier);

      await taigaService.deleteUserStory(userStory.id);

      const deletionDetails = `${SUCCESS_MESSAGES.USER_STORY_DELETED}

Deleted User Story: #${userStory.ref} - ${userStory.subject}
Project: ${getSafeValue(userStory.project_extra_info?.name)}`;

      return createSuccessResponse(deletionDetails);
    } catch (error) {
      return createErrorResponse(`Failed to delete user story: ${error.message}`);
    }
  }
};

/**
 * Tool to get multiple user stories in a single call (batch operation)
 */
export const batchGetUserStoriesTool = {
  name: 'batchGetUserStories',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    userStoryIdentifiers: z.array(z.string()).describe('Array of user story identifiers (IDs or reference numbers like "123", "#45", or "45")'),
  },
  handler: async ({ projectIdentifier, userStoryIdentifiers }) => {
    try {
      // Resolve project ID first
      const projectId = await resolveProjectId(projectIdentifier);

      // Resolve all user stories in parallel
      const promises = userStoryIdentifiers.map(async (identifier) => {
        try {
          let userStory = await resolveUserStory(identifier, projectIdentifier);
          // Enrich with full milestone and epic details
          userStory = await enrichUserStoryWithDetails(userStory);
          return {
            success: true,
            identifier: identifier,
            data: userStory
          };
        } catch (error) {
          return {
            success: false,
            identifier: identifier,
            error: error.message
          };
        }
      });

      const results = await Promise.all(promises);

      // Separate successful and failed results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // Build response with enriched data
      const enrichedUserStories = successful.map(result => {
        const us = result.data;
        // Extract epic from epics array (Taiga returns epics as array)
        const epicName = us.epics && us.epics.length > 0 ? us.epics[0].subject : 'No epic';
        const epicId = us.epics && us.epics.length > 0 ? us.epics[0].id : null;

        return {
          ref: us.ref,
          id: us.id,
          subject: us.subject,
          status: us.status_extra_info?.name || 'Unknown',
          points: us.total_points || 0,
          milestone: us.milestone_extra_info?.name || (us.milestone ? `Milestone #${us.milestone}` : 'No milestone'),
          milestoneId: us.milestone || null,
          epic: epicName,
          epicId: epicId,
          assignedTo: us.assigned_to_extra_info?.full_name_display || STATUS_LABELS.UNASSIGNED,
          tags: us.tags || [],
          isClosed: us.is_closed || false
        };
      });

      const summary = `Batch Get User Stories Results:
Total requested: ${userStoryIdentifiers.length}
Successful: ${successful.length}
Failed: ${failed.length}

${successful.length > 0 ? `Successfully Retrieved User Stories:\n${enrichedUserStories.map(us =>
  `  #${us.ref} - ${us.subject}
    - Status: ${us.status}
    - Points: ${us.points}
    - Milestone: ${us.milestone}
    - Epic: ${us.epic}
    - Assigned to: ${us.assignedTo}
    - Tags: ${us.tags.join(', ') || 'None'}`
).join('\n\n')}` : ''}

${failed.length > 0 ? `\nFailed to Retrieve:\n${failed.map(f =>
  `  ${f.identifier}: ${f.error}`
).join('\n')}` : ''}`;

      return createSuccessResponse(summary);
    } catch (error) {
      return createErrorResponse(`Failed to batch get user stories: ${error.message}`);
    }
  }
};

/**
 * Tool to add user story to a sprint (milestone)
 */
export const addUserStoryToSprintTool = {
  name: 'addUserStoryToSprint',
  schema: {
    userStoryIdentifier: z.string().describe('User story ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    sprintIdentifier: z.string().describe('Sprint ID or name (or "remove" to remove from sprint)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ userStoryIdentifier, sprintIdentifier, projectIdentifier }) => {
    try {
      // Resolve the user story first
      const userStory = await resolveUserStory(userStoryIdentifier, projectIdentifier);

      let milestoneId = null;

      // Handle sprint removal
      if (sprintIdentifier.toLowerCase() === 'remove' || sprintIdentifier.toLowerCase() === 'none') {
        milestoneId = null;
      } else {
        // Get project ID for sprint lookup
        const projectId = userStory.project || (projectIdentifier ? await resolveProjectId(projectIdentifier) : null);
        if (!projectId) {
          return createErrorResponse('Could not determine project ID for sprint lookup');
        }

        // Try to find sprint by ID first, then by name
        let sprint = null;

        // If it's a number, try to get sprint by ID
        if (!isNaN(sprintIdentifier)) {
          try {
            sprint = await taigaService.getMilestone(sprintIdentifier);
          } catch (error) {
            // If getting by ID fails, we'll try by name below
          }
        }

        // If not found by ID or not a number, search by name
        if (!sprint) {
          const sprints = await taigaService.listMilestones(projectId);
          sprint = sprints.find(s =>
            s.name === sprintIdentifier ||
            s.name.toLowerCase() === sprintIdentifier.toLowerCase()
          );
        }

        if (!sprint) {
          const sprints = await taigaService.listMilestones(projectId);
          const availableSprints = sprints.map(s =>
            `- ${s.name} (ID: ${s.id})`
          ).join('\n');

          return createErrorResponse(
            `Sprint "${sprintIdentifier}" not found in project. Available sprints:\n${availableSprints}`
          );
        }

        milestoneId = sprint.id;
      }

      // Update the user story with the new milestone
      const updateData = {
        milestone: milestoneId
      };

      const updatedUserStory = await taigaService.updateUserStory(userStory.id, updateData);

      const sprintDetails = `${SUCCESS_MESSAGES.USER_STORY_UPDATED.replace('updated', 'sprint assignment updated')}

User Story: #${updatedUserStory.ref} - ${updatedUserStory.subject}
Sprint: ${milestoneId ?
  (updatedUserStory.milestone_extra_info?.name || 'Unknown sprint') :
  'Removed from sprint'
}
Project: ${getSafeValue(updatedUserStory.project_extra_info?.name)}
Status: ${getSafeValue(updatedUserStory.status_extra_info?.name)}`;

      return createSuccessResponse(sprintDetails);
    } catch (error) {
      return createErrorResponse(`Failed to add user story to sprint: ${error.message}`);
    }
  }
};