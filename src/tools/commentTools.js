/**
 * 評論系統MCP工具
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
 * 解析並獲取實際的item
 * @param {string} itemType - 項目類型
 * @param {number} itemId - 項目ID
 * @param {string} projectIdentifier - 項目識別符
 * @returns {Promise<Object>} - 實際的item
 */
async function resolveAndGetItem(itemType, itemId, projectIdentifier) {
  // 對於issues，projectIdentifier是必需的
  if (itemType === 'issue' && !projectIdentifier) {
    throw new Error('Project identifier is required when working with issues. Please provide projectIdentifier parameter.');
  }

  // 解析項目ID
  const projectId = projectIdentifier ? await resolveProjectId(projectIdentifier) : null;
  
  // 根據itemType獲取實際的item，確保它存在於指定項目中
  let actualItem;
  if (itemType === 'issue') {
    // 對於issue，先嘗試作為ref number，再嘗試作為直接ID
    try {
      // 首先嘗試作為reference number (如 #829)
      actualItem = await taigaService.getIssueByRef(itemId, projectId);
    } catch (refError) {
      try {
        // 如果ref失敗，嘗試作為直接ID
        actualItem = await taigaService.getIssue(itemId);
        // 檢查是否屬於正確的項目
        if (actualItem.project !== projectId) {
          throw new Error(`Issue #${itemId} does not belong to project ${projectIdentifier}`);
        }
      } catch (idError) {
        throw new Error(`Issue #${itemId} not found in project ${projectIdentifier}. Tried both ref and ID: ${refError.message}, ${idError.message}`);
      }
    }
  } else {
    // 對於user_story和task，直接使用ID
    actualItem = { id: itemId };
  }

  return actualItem;
}

/**
 * 添加評論工具
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
      // 檢查認證狀態
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // 解析並獲取實際的item
      const actualItem = await resolveAndGetItem(itemType, itemId, projectIdentifier);

      // 構建評論數據
      const commentData = {
        comment: comment
      };

      // 發送評論到Taiga (通過歷史API)
      const response = await taigaService.addComment(itemType, actualItem.id, commentData);
      
      // 格式化響應
      const result = formatCommentResponse(response, 'added');
      return createSuccessResponse(`${SUCCESS_MESSAGES.COMMENT_ADDED}\n\n${result}`);
      
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_ADD_COMMENT}: ${error.message}`);
    }
  }
};

/**
 * 查看評論列表工具
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
      // 檢查認證狀態
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // 解析並獲取實際的item
      const actualItem = await resolveAndGetItem(itemType, itemId, projectIdentifier);

      // 獲取項目歷史記錄（包含評論）
      const history = await taigaService.getItemHistory(itemType, actualItem.id);
      
      // 過濾出評論相關的歷史記錄
      const comments = filterCommentsFromHistory(history);
      
      if (!comments || comments.length === 0) {
        return createSuccessResponse(`**${itemType} #${itemId} 評論列表**\n\n目前沒有評論`);
      }
      
      // 格式化評論列表
      const formattedComments = formatCommentsList(comments, itemType, itemId);
      return createSuccessResponse(formattedComments);
      
    } catch (error) {
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_LIST_COMMENTS}: ${error.message}`);
    }
  }
};

/**
 * 編輯評論工具
 */
export const editCommentTool = {
  name: 'editComment',
  schema: {
    commentId: z.number().describe('ID of the comment to edit'),
    newComment: z.string().min(1).describe('New comment content')
  },
  handler: async ({ commentId, newComment }) => {
    try {
      // 編輯評論
      const response = await taigaService.editComment(commentId, newComment);
      
      // 格式化響應
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
 * 刪除評論工具
 */
export const deleteCommentTool = {
  name: 'deleteComment',
  schema: {
    commentId: z.number().describe('ID of the comment to delete')
  },
  handler: async ({ commentId }) => {
    try {
      // 刪除評論
      await taigaService.deleteComment(commentId);
      
      return createSuccessResponse(`${SUCCESS_MESSAGES.COMMENT_DELETED}\n\n評論 #${commentId} 已成功刪除`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        return createErrorResponse(ERROR_MESSAGES.COMMENT_NOT_FOUND);
      }
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_DELETE_COMMENT}: ${error.message}`);
    }
  }
};


/**
 * 從歷史記錄中過濾出評論
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
 * 格式化評論列表
 */
function formatCommentsList(comments, itemType, itemId) {
  let output = `**${itemType.replace('_', ' ')} #${itemId} 評論列表**\n\n`;
  output += `共 ${comments.length} 個評論\n\n`;
  
  comments.forEach((comment, index) => {
    const user = comment.user?.full_name || comment.user?.username || '未知用戶';
    const createdDate = formatDateTime(comment.created_at);
    const commentText = comment.comment || '無內容';
    
    output += `**${index + 1}. ${user}** ${createdDate}\n`;
    output += `${commentText}\n`;
    if (comment.id) {
      output += `評論ID: ${comment.id}\n`;
    }
    output += '\n';
  });
  
  return output;
}

/**
 * 格式化單個評論響應
 */
function formatCommentResponse(response, action) {
  const user = response.user?.full_name || response.user?.username || '未知用戶';
  const createdDate = formatDateTime(response.created_at);
  const commentText = response.comment || '無內容';
  
  let output = `**評論已${action === 'added' ? '添加' : '編輯'}**\n\n`;
  output += `用戶: ${user}\n`;
  output += `時間: ${createdDate}\n`;
  output += `內容: ${commentText}\n`;
  if (response.id) {
    output += `評論ID: ${response.id}`;
  }
  
  return output;
}

/**
 * 註冊評論系統工具
 */
export function registerCommentTools(server) {
  server.tool(addCommentTool.name, addCommentTool.schema, addCommentTool.handler);
  server.tool(listCommentsTool.name, listCommentsTool.schema, listCommentsTool.handler);
  server.tool(editCommentTool.name, editCommentTool.schema, editCommentTool.handler);
  server.tool(deleteCommentTool.name, deleteCommentTool.schema, deleteCommentTool.handler);
}