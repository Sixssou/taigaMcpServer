/**
 * Comment System MCP Tools for Taiga
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants.js';
import { 
  resolveProjectId,
  createErrorResponse,
  createSuccessResponse,
  formatDateTime,
  getSafeValue
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Parse and get actual item
 * @param {string} itemType - Item type
 * @param {number} itemId - Item ID
 * @param {string} projectIdentifier - Project identifier
 * @returns {Promise<Object>} - Actual item
 */
async function resolveAndGetItem(itemType, itemId, projectIdentifier) {
  // For issues, projectIdentifier is required
  if (itemType === 'issue' && !projectIdentifier) {
    throw new Error('Project identifier is required when working with issues. Please provide projectIdentifier parameter.');
  }

  // Parse project ID
  const projectId = projectIdentifier ? await resolveProjectId(projectIdentifier) : null;

  // Get actual item based on itemType, ensure it exists in specified project
  let actualItem;
  if (itemType === 'issue') {
    // For issues, try as ref number first, then try as direct ID
    try {
      // First try as reference number (e.g. #829)
      actualItem = await taigaService.getIssueByRef(itemId, projectId);
    } catch (refError) {
      try {
        // If ref fails, try as direct ID
        actualItem = await taigaService.getIssue(itemId);
        // Check if it belongs to the correct project
        if (actualItem.project !== projectId) {
          throw new Error(`Issue #${itemId} does not belong to project ${projectIdentifier}`);
        }
      } catch (idError) {
        throw new Error(`Issue #${itemId} not found in project ${projectIdentifier}. Tried both ref and ID: ${refError.message}, ${idError.message}`);
      }
    }
  } else {
    // For user_story and task, use ID directly
    actualItem = { id: itemId };
  }

  return actualItem;
}

/**
 * Add comment tool
 */
export const addCommentTool = {
  name: 'addComment',
  schema: {
    itemType: z.enum(['issue', 'user_story', 'task']).describe('Type of item to comment on'),
    itemId: z.number().describe('ID of the issue, user story, or task'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required for issues)'),
    comment: z.string().min(1).describe('Comment content to add')
  },
  handler: async ({ itemType, itemId, projectIdentifier, comment }) => {
    try {
      // Check authentication status
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Parse and get actual item
      const actualItem = await resolveAndGetItem(itemType, itemId, projectIdentifier);

      // Build comment data
      const commentData = {
        comment: comment
      };

      // Send comment to Taiga (via history API)
      const response = await taigaService.addComment(itemType, actualItem.id, commentData);

      // Format response
      const result = formatCommentResponse(response, 'added');
      return createSuccessResponse(`${SUCCESS_MESSAGES.COMMENT_ADDED}\n\n${result}`);
      
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_ADD_COMMENT}: ${error.message}`);
    }
  }
};

/**
 * List comments tool
 */
export const listCommentsTool = {
  name: 'listComments',
  description: 'List all comments for an Issue, User Story, or Task. Returns the complete history with automatic pagination.',
  schema: {
    itemType: z.enum(['issue', 'user_story', 'task']).describe('Type of item to get comments for'),
    itemId: z.number().describe('ID of the issue, user story, or task'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required for issues)')
  },
  handler: async ({ itemType, itemId, projectIdentifier }) => {
    try {
      // Check authentication status
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Parse and get actual item
      const actualItem = await resolveAndGetItem(itemType, itemId, projectIdentifier);

      // Get item history (including comments)
      const history = await taigaService.getItemHistory(itemType, actualItem.id);

      // Filter comment-related history records
      const comments = filterCommentsFromHistory(history);

      if (!comments || comments.length === 0) {
        return createSuccessResponse(`**${itemType} #${itemId} Comment List**\n\nNo comments currently`);
      }

      // Format comment list
      const formattedComments = formatCommentsList(comments, itemType, itemId);
      return createSuccessResponse(formattedComments);
      
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_LIST_COMMENTS}: ${error.message}`);
    }
  }
};

/**
 * Edit comment tool
 */
export const editCommentTool = {
  name: 'editComment',
  schema: {
    commentId: z.number().describe('ID of the comment to edit'),
    newComment: z.string().min(1).describe('New comment content')
  },
  handler: async ({ commentId, newComment }) => {
    try {
      // Edit comment
      const response = await taigaService.editComment(commentId, newComment);

      // Format response
      const result = formatCommentResponse(response, 'edited');
      return createSuccessResponse(`${SUCCESS_MESSAGES.COMMENT_EDITED}\n\n${result}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        return createErrorResponse(ERROR_MESSAGES.COMMENT_NOT_FOUND);
      }
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_EDIT_COMMENT}: ${error.message}`);
    }
  }
};

/**
 * Delete comment tool
 */
export const deleteCommentTool = {
  name: 'deleteComment',
  schema: {
    commentId: z.number().describe('ID of the comment to delete')
  },
  handler: async ({ commentId }) => {
    try {
      // Delete comment
      await taigaService.deleteComment(commentId);

      return createSuccessResponse(`${SUCCESS_MESSAGES.COMMENT_DELETED}\n\nComment #${commentId} successfully deleted`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        return createErrorResponse(ERROR_MESSAGES.COMMENT_NOT_FOUND);
      }
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_DELETE_COMMENT}: ${error.message}`);
    }
  }
};


/**
 * Filter comments from history
 */
function filterCommentsFromHistory(history) {
  if (!Array.isArray(history)) return [];
  
  return history.filter(entry => 
    // Taiga API returns type as number 1 for changes, not string 'change'
    entry.type === 1 && 
    entry.comment && 
    entry.comment.trim().length > 0
  );
}

/**
 * Format comment list
 */
function formatCommentsList(comments, itemType, itemId) {
  let output = `**${itemType.replace('_', ' ')} #${itemId} Comment List**\n\n`;
  output += `Total ${comments.length} comments\n\n`;

  comments.forEach((comment, index) => {
    const user = comment.user?.full_name || comment.user?.username || 'Unknown user';
    const createdDate = formatDateTime(comment.created_at);
    const commentText = comment.comment || 'No content';

    output += `**${index + 1}. ${user}** ${createdDate}\n`;
    output += `${commentText}\n`;
    if (comment.id) {
      output += `Comment ID: ${comment.id}\n`;
    }
    output += '\n';
  });

  return output;
}

/**
 * Format single comment response
 */
function formatCommentResponse(response, action) {
  const user = response.user?.full_name || response.user?.username || 'Unknown user';
  const createdDate = formatDateTime(response.created_at);
  const commentText = response.comment || 'No content';

  let output = `**Comment ${action === 'added' ? 'Added' : 'Edited'}**\n\n`;
  output += `User: ${user}\n`;
  output += `Time: ${createdDate}\n`;
  output += `Content: ${commentText}\n`;
  if (response.id) {
    output += `Comment ID: ${response.id}`;
  }

  return output;
}

/**
 * Register comment system tools
 */
export function registerCommentTools(server) {
  server.tool(addCommentTool.name, addCommentTool.schema, addCommentTool.handler);
  server.tool(listCommentsTool.name, listCommentsTool.schema, listCommentsTool.handler);
  server.tool(editCommentTool.name, editCommentTool.schema, editCommentTool.handler);
  server.tool(deleteCommentTool.name, deleteCommentTool.schema, deleteCommentTool.handler);
}