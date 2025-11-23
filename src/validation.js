/**
 * Validation and Dry-Run System
 * Validates task/story/issue data before creation or update
 */

import { TaigaService } from './taigaService.js';
import { resolveProjectId } from './utils.js';
import { resolveUser } from './userResolution.js';
import { resolveStatus } from './metadataService.js';

const taigaService = new TaigaService();

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {Array} errors - Array of error messages
 * @property {Array} warnings - Array of warning messages
 * @property {Object} resolvedData - Resolved data (IDs instead of names)
 * @property {Object} suggestions - Suggestions for fixing errors
 */

/**
 * Validate task data before creation or update
 * @param {Object} taskData - Task data to validate
 * @param {string} projectIdentifier - Project ID or slug
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Strict validation mode (default: false)
 * @returns {Promise<ValidationResult>} - Validation result
 */
export async function validateTask(taskData, projectIdentifier, options = {}) {
  const { strict = false } = options;
  const errors = [];
  const warnings = [];
  const resolvedData = { ...taskData };
  const suggestions = {};

  try {
    const projectId = await resolveProjectId(projectIdentifier);
    resolvedData.project = projectId;

    // Validate required fields
    if (!taskData.subject || taskData.subject.trim() === '') {
      errors.push('Task subject is required and cannot be empty');
    } else if (taskData.subject.length > 500) {
      errors.push('Task subject exceeds maximum length of 500 characters');
    }

    // Validate status
    if (taskData.status) {
      try {
        const statusResult = await resolveStatus(taskData.status, projectIdentifier, 'task');
        resolvedData.status = statusResult.status.id;
      } catch (error) {
        errors.push(`Invalid status: ${error.message}`);
        suggestions.status = 'Use getAvailableStatuses to see valid status names';
      }
    }

    // Validate assignee
    if (taskData.assignedTo) {
      if (taskData.assignedTo.toLowerCase() !== 'unassign' && taskData.assignedTo.toLowerCase() !== 'none') {
        try {
          const user = await resolveUser(taskData.assignedTo, projectId, {
            fuzzyMatch: !strict,
            fuzzyThreshold: 70
          });
          resolvedData.assigned_to = user.userId;

          if (user.matchType === 'fuzzy') {
            warnings.push(`User matched with fuzzy search: "${taskData.assignedTo}" → "${user.fullName}" (${user.matchScore}% similarity)`);
          }
        } catch (error) {
          errors.push(`Invalid assignee: ${error.message}`);
          suggestions.assignedTo = 'Use listProjectMembers to see available users';
        }
      } else {
        resolvedData.assigned_to = null;
      }
    }

    // Validate due date format
    if (taskData.dueDate) {
      if (taskData.dueDate !== null && taskData.dueDate.toLowerCase() !== 'null') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(taskData.dueDate)) {
          errors.push(`Invalid due date format: "${taskData.dueDate}". Expected format: YYYY-MM-DD`);
          suggestions.dueDate = 'Use format YYYY-MM-DD (e.g., "2025-12-31")';
        } else {
          // Validate date is not in the past (warning only)
          const dueDate = new Date(taskData.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (dueDate < today) {
            warnings.push(`Due date is in the past: ${taskData.dueDate}`);
          }

          resolvedData.due_date = taskData.dueDate;
        }
      } else {
        resolvedData.due_date = null;
      }
    }

    // Validate tags
    if (taskData.tags) {
      if (!Array.isArray(taskData.tags)) {
        errors.push('Tags must be an array of strings');
      } else if (taskData.tags.some(tag => typeof tag !== 'string')) {
        errors.push('All tags must be strings');
      } else {
        resolvedData.tags = taskData.tags;
      }
    }

    // Validate description length
    if (taskData.description && taskData.description.length > 10000) {
      warnings.push('Task description is very long (>10000 characters). Consider shortening it.');
    }

  } catch (error) {
    errors.push(`Validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    resolvedData,
    suggestions
  };
}

/**
 * Validate user story data before creation or update
 * @param {Object} storyData - User story data to validate
 * @param {string} projectIdentifier - Project ID or slug
 * @param {Object} options - Validation options
 * @returns {Promise<ValidationResult>} - Validation result
 */
export async function validateUserStory(storyData, projectIdentifier, options = {}) {
  const { strict = false } = options;
  const errors = [];
  const warnings = [];
  const resolvedData = { ...storyData };
  const suggestions = {};

  try {
    const projectId = await resolveProjectId(projectIdentifier);
    resolvedData.project = projectId;

    // Validate required fields
    if (!storyData.subject || storyData.subject.trim() === '') {
      errors.push('User story subject is required and cannot be empty');
    } else if (storyData.subject.length > 500) {
      errors.push('User story subject exceeds maximum length of 500 characters');
    }

    // Validate status
    if (storyData.status) {
      try {
        const statusResult = await resolveStatus(storyData.status, projectIdentifier, 'userStory');
        resolvedData.status = statusResult.status.id;
      } catch (error) {
        errors.push(`Invalid status: ${error.message}`);
        suggestions.status = 'Use getAvailableStatuses to see valid status names';
      }
    }

    // Validate assignee
    if (storyData.assignedTo) {
      if (storyData.assignedTo.toLowerCase() !== 'unassign' && storyData.assignedTo.toLowerCase() !== 'none') {
        try {
          const user = await resolveUser(storyData.assignedTo, projectId, {
            fuzzyMatch: !strict,
            fuzzyThreshold: 70
          });
          resolvedData.assigned_to = user.userId;

          if (user.matchType === 'fuzzy') {
            warnings.push(`User matched with fuzzy search: "${storyData.assignedTo}" → "${user.fullName}" (${user.matchScore}% similarity)`);
          }
        } catch (error) {
          errors.push(`Invalid assignee: ${error.message}`);
          suggestions.assignedTo = 'Use listProjectMembers to see available users';
        }
      } else {
        resolvedData.assigned_to = null;
      }
    }

    // Validate points
    if (storyData.points !== undefined) {
      if (typeof storyData.points !== 'number' || storyData.points < 0) {
        errors.push('Story points must be a non-negative number');
      } else if (storyData.points > 100) {
        warnings.push('Story points value is very high (>100). Is this intentional?');
      }
      resolvedData.points = storyData.points;
    }

    // Validate milestone
    if (storyData.milestone) {
      if (storyData.milestone.toLowerCase() !== 'remove' && storyData.milestone.toLowerCase() !== 'none') {
        try {
          const { resolveMilestone } = await import('./utils.js');
          const milestone = await resolveMilestone(storyData.milestone, projectIdentifier, {
            fuzzyMatch: !strict,
            fuzzyThreshold: 70
          });
          resolvedData.milestone = milestone.id;

          if (milestone._matchType === 'fuzzy') {
            warnings.push(`Milestone matched with fuzzy search: "${storyData.milestone}" → "${milestone.name}" (${milestone._matchScore}% similarity)`);
          }
        } catch (error) {
          errors.push(`Invalid milestone: ${error.message}`);
          suggestions.milestone = 'Use listProjectMilestones to see available milestones';
        }
      } else {
        resolvedData.milestone = null;
      }
    }

    // Validate tags
    if (storyData.tags) {
      if (!Array.isArray(storyData.tags)) {
        errors.push('Tags must be an array of strings');
      } else if (storyData.tags.some(tag => typeof tag !== 'string')) {
        errors.push('All tags must be strings');
      } else {
        resolvedData.tags = storyData.tags;
      }
    }

    // Validate description length
    if (storyData.description && storyData.description.length > 10000) {
      warnings.push('User story description is very long (>10000 characters). Consider shortening it.');
    }

  } catch (error) {
    errors.push(`Validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    resolvedData,
    suggestions
  };
}

/**
 * Validate issue data before creation or update
 * @param {Object} issueData - Issue data to validate
 * @param {string} projectIdentifier - Project ID or slug
 * @param {Object} options - Validation options
 * @returns {Promise<ValidationResult>} - Validation result
 */
export async function validateIssue(issueData, projectIdentifier, options = {}) {
  const { strict = false } = options;
  const errors = [];
  const warnings = [];
  const resolvedData = { ...issueData };
  const suggestions = {};

  try {
    const projectId = await resolveProjectId(projectIdentifier);
    resolvedData.project = projectId;

    // Validate required fields
    if (!issueData.subject || issueData.subject.trim() === '') {
      errors.push('Issue subject is required and cannot be empty');
    } else if (issueData.subject.length > 500) {
      errors.push('Issue subject exceeds maximum length of 500 characters');
    }

    // Validate status
    if (issueData.status) {
      try {
        const statusResult = await resolveStatus(issueData.status, projectIdentifier, 'issue');
        resolvedData.status = statusResult.status.id;
      } catch (error) {
        errors.push(`Invalid status: ${error.message}`);
        suggestions.status = 'Use getAvailableStatuses to see valid status names';
      }
    }

    // Validate assignee
    if (issueData.assignedTo) {
      if (issueData.assignedTo.toLowerCase() !== 'unassign' && issueData.assignedTo.toLowerCase() !== 'none') {
        try {
          const user = await resolveUser(issueData.assignedTo, projectId, {
            fuzzyMatch: !strict,
            fuzzyThreshold: 70
          });
          resolvedData.assigned_to = user.userId;

          if (user.matchType === 'fuzzy') {
            warnings.push(`User matched with fuzzy search: "${issueData.assignedTo}" → "${user.fullName}" (${user.matchScore}% similarity)`);
          }
        } catch (error) {
          errors.push(`Invalid assignee: ${error.message}`);
          suggestions.assignedTo = 'Use listProjectMembers to see available users';
        }
      } else {
        resolvedData.assigned_to = null;
      }
    }

    // Validate tags
    if (issueData.tags) {
      if (!Array.isArray(issueData.tags)) {
        errors.push('Tags must be an array of strings');
      } else if (issueData.tags.some(tag => typeof tag !== 'string')) {
        errors.push('All tags must be strings');
      } else {
        resolvedData.tags = issueData.tags;
      }
    }

  } catch (error) {
    errors.push(`Validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    resolvedData,
    suggestions
  };
}

/**
 * Format validation result for display
 * @param {ValidationResult} result - Validation result
 * @param {string} entityType - Entity type (task, userStory, issue)
 * @returns {string} - Formatted validation result
 */
export function formatValidationResult(result, entityType = 'item') {
  let output = '';

  if (result.isValid) {
    output += `✅ **Validation PASSED for ${entityType}**\n\n`;
  } else {
    output += `❌ **Validation FAILED for ${entityType}**\n\n`;
  }

  if (result.errors.length > 0) {
    output += `**Errors (${result.errors.length}):**\n`;
    result.errors.forEach((error, idx) => {
      output += `${idx + 1}. ${error}\n`;
    });
    output += '\n';
  }

  if (result.warnings.length > 0) {
    output += `**Warnings (${result.warnings.length}):**\n`;
    result.warnings.forEach((warning, idx) => {
      output += `${idx + 1}. ${warning}\n`;
    });
    output += '\n';
  }

  if (Object.keys(result.suggestions).length > 0) {
    output += `**Suggestions:**\n`;
    Object.entries(result.suggestions).forEach(([field, suggestion]) => {
      output += `- ${field}: ${suggestion}\n`;
    });
    output += '\n';
  }

  if (result.isValid && result.resolvedData) {
    output += `**Resolved Data:**\n`;
    output += '```json\n';
    output += JSON.stringify(result.resolvedData, null, 2);
    output += '\n```\n';
  }

  return output;
}
