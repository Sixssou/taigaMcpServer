/**
 * Utility functions for Taiga MCP Server
 */

import { TaigaService } from './taigaService.js';
import { STATUS_LABELS } from './constants.js';

const taigaService = new TaigaService();

/**
 * Resolve project identifier to project ID
 * @param {string} projectIdentifier - Project ID or slug
 * @returns {Promise<string>} - Project ID
 */
export async function resolveProjectId(projectIdentifier) {
  if (!isNaN(projectIdentifier)) {
    return projectIdentifier;
  }
  
  const project = await taigaService.getProjectBySlug(projectIdentifier);
  return project.id;
}

/**
 * Resolve issue identifier to issue object
 * @param {string} issueIdentifier - Issue ID or reference (#123)
 * @param {string} [projectIdentifier] - Project ID or slug (required for reference)
 * @returns {Promise<Object>} - Issue object
 */
export async function resolveIssue(issueIdentifier, projectIdentifier) {
  // Handle #-prefixed reference numbers
  if (issueIdentifier.startsWith('#')) {
    if (!projectIdentifier) {
      throw new Error('Project identifier is required when using issue reference number');
    }
    
    const projectId = await resolveProjectId(projectIdentifier);
    const ref = issueIdentifier.substring(1);
    return await taigaService.getIssueByRef(ref, projectId);
  }
  
  // For pure numbers, try both approaches: first as ID, then as reference number
  if (/^\d+$/.test(issueIdentifier)) {
    // First try as direct Issue ID
    try {
      return await taigaService.getIssue(issueIdentifier);
    } catch (error) {
      // If that fails and we have a project identifier, try as reference number
      if (projectIdentifier) {
        try {
          const projectId = await resolveProjectId(projectIdentifier);
          return await taigaService.getIssueByRef(issueIdentifier, projectId);
        } catch (refError) {
          // If both fail, throw a more helpful error
          throw new Error(`Issue not found by ID "${issueIdentifier}" or reference number "#${issueIdentifier}" in project. Original errors: ID lookup: ${error.message}, Ref lookup: ${refError.message}`);
        }
      } else {
        // No project identifier available, can only try ID
        throw new Error(`Issue ID "${issueIdentifier}" not found. If this is a reference number, please provide projectIdentifier or use "#${issueIdentifier}" format.`);
      }
    }
  }
  
  // For non-numeric strings, treat as direct ID
  return await taigaService.getIssue(issueIdentifier);
}

/**
 * Resolve user story identifier to user story object
 * Handles direct IDs and reference numbers (with # prefix)
 * @param {string} userStoryIdentifier - User story ID or reference number
 * @param {string} [projectIdentifier] - Project ID or slug (required for reference numbers)
 * @returns {Promise<Object>} - User story object
 */
export async function resolveUserStory(userStoryIdentifier, projectIdentifier) {
  // Handle #-prefixed reference numbers
  if (userStoryIdentifier.startsWith('#')) {
    if (!projectIdentifier) {
      throw new Error('Project identifier is required when using user story reference number');
    }
    
    const projectId = await resolveProjectId(projectIdentifier);
    const ref = userStoryIdentifier.substring(1);
    return await taigaService.getUserStoryByRef(ref, projectId);
  }
  
  // For pure numbers, try both approaches: first as ID, then as reference number
  if (/^\d+$/.test(userStoryIdentifier)) {
    // First try as direct User Story ID
    try {
      return await taigaService.getUserStory(userStoryIdentifier);
    } catch (error) {
      // If that fails and we have a project identifier, try as reference number
      if (projectIdentifier) {
        try {
          const projectId = await resolveProjectId(projectIdentifier);
          return await taigaService.getUserStoryByRef(userStoryIdentifier, projectId);
        } catch (refError) {
          // If both fail, throw a more helpful error
          throw new Error(`User story not found by ID "${userStoryIdentifier}" or reference number "#${userStoryIdentifier}" in project. Original errors: ID lookup: ${error.message}, Ref lookup: ${refError.message}`);
        }
      } else {
        // No project identifier available, can only try ID
        throw new Error(`User story ID "${userStoryIdentifier}" not found. If this is a reference number, please provide projectIdentifier or use "#${userStoryIdentifier}" format.`);
      }
    }
  }
  
  // For non-numeric strings, treat as direct ID
  return await taigaService.getUserStory(userStoryIdentifier);
}

/**
 * Resolve task identifier to task object
 * Handles direct IDs and reference numbers (with # prefix)
 * @param {string} taskIdentifier - Task ID or reference number
 * @param {string} [projectIdentifier] - Project ID or slug (required for reference numbers)
 * @returns {Promise<Object>} - Task object
 */
export async function resolveTask(taskIdentifier, projectIdentifier) {
  // Handle #-prefixed reference numbers
  if (taskIdentifier.startsWith('#')) {
    if (!projectIdentifier) {
      throw new Error('Project identifier is required when using task reference number');
    }

    const projectId = await resolveProjectId(projectIdentifier);
    const ref = taskIdentifier.substring(1);
    return await taigaService.getTaskByRef(ref, projectId);
  }

  // For pure numbers, try both approaches: first as ID, then as reference number
  if (/^\d+$/.test(taskIdentifier)) {
    // First try as direct Task ID
    try {
      return await taigaService.getTask(taskIdentifier);
    } catch (error) {
      // If that fails and we have a project identifier, try as reference number
      if (projectIdentifier) {
        try {
          const projectId = await resolveProjectId(projectIdentifier);
          return await taigaService.getTaskByRef(taskIdentifier, projectId);
        } catch (refError) {
          // If both fail, throw a more helpful error
          throw new Error(`Task not found by ID "${taskIdentifier}" or reference number "#${taskIdentifier}" in project. Original errors: ID lookup: ${error.message}, Ref lookup: ${refError.message}`);
        }
      } else {
        // No project identifier available, can only try ID
        throw new Error(`Task ID "${taskIdentifier}" not found. If this is a reference number, please provide projectIdentifier or use "#${taskIdentifier}" format.`);
      }
    }
  }

  // For non-numeric strings, treat as direct ID
  return await taigaService.getTask(taskIdentifier);
}

/**
 * Resolve milestone identifier to milestone object
 * Handles direct IDs and milestone names
 * @param {string} milestoneIdentifier - Milestone ID or name
 * @param {string} projectIdentifier - Project ID or slug (required for name resolution)
 * @returns {Promise<Object>} - Milestone object
 */
export async function resolveMilestone(milestoneIdentifier, projectIdentifier) {
  // If it's a pure number, try as direct ID first
  if (/^\d+$/.test(milestoneIdentifier)) {
    try {
      return await taigaService.getMilestone(milestoneIdentifier);
    } catch (error) {
      // If that fails and we have a project identifier, try by name
      if (projectIdentifier) {
        const projectId = await resolveProjectId(projectIdentifier);
        const milestones = await taigaService.listMilestones(projectId);
        const milestone = milestones.find(m =>
          m.name === milestoneIdentifier ||
          m.name.toLowerCase() === milestoneIdentifier.toLowerCase()
        );

        if (milestone) {
          return milestone;
        }

        // If both fail, throw error
        throw new Error(`Milestone not found by ID "${milestoneIdentifier}" or name in project. Original error: ${error.message}`);
      } else {
        // No project identifier available, can only try ID
        throw new Error(`Milestone ID "${milestoneIdentifier}" not found. If this is a name, please provide projectIdentifier.`);
      }
    }
  }

  // For non-numeric strings, treat as name and search in project
  if (!projectIdentifier) {
    throw new Error('Project identifier is required when using milestone name');
  }

  const projectId = await resolveProjectId(projectIdentifier);
  const milestones = await taigaService.listMilestones(projectId);
  const milestone = milestones.find(m =>
    m.name === milestoneIdentifier ||
    m.name.toLowerCase() === milestoneIdentifier.toLowerCase()
  );

  if (!milestone) {
    const availableMilestones = milestones.map(m => `- ${m.name} (ID: ${m.id})`).join('\n');
    throw new Error(
      `Milestone "${milestoneIdentifier}" not found in project. Available milestones:\n${availableMilestones}`
    );
  }

  return milestone;
}

/**
 * Find status ID by name
 * @param {Array} statuses - Array of status objects
 * @param {string} statusName - Status name to find
 * @returns {number|undefined} - Status ID or undefined if not found
 */
export function findStatusIdByName(statuses, statusName) {
  if (!statusName) return undefined;
  
  const status = statuses.find(s => 
    s.name.toLowerCase() === statusName.toLowerCase()
  );
  return status?.id;
}

/**
 * Find ID by name in a collection
 * @param {Array} collection - Array of objects with name property
 * @param {string} name - Name to find
 * @returns {number|undefined} - ID or undefined if not found
 */
export function findIdByName(collection, name) {
  if (!name) return undefined;
  
  const item = collection.find(item => 
    item.name.toLowerCase() === name.toLowerCase()
  );
  return item?.id;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date or 'Not set'
 */
export function formatDate(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
}

/**
 * Format datetime for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted datetime
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleString();
}

/**
 * Calculate completion percentage
 * @param {number} completed - Completed items
 * @param {number} total - Total items
 * @returns {number} - Percentage (0-100)
 */
export function calculateCompletionPercentage(completed, total) {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Create MCP error response
 * @param {string} message - Error message
 * @returns {Object} - MCP error response
 */
export function createErrorResponse(message) {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
}

/**
 * Create MCP success response
 * @param {string} text - Response text
 * @returns {Object} - MCP success response
 */
export function createSuccessResponse(text) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Get status label (Active/Closed)
 * @param {boolean} closed - Whether item is closed
 * @returns {string} - Status label
 */
export function getStatusLabel(closed) {
  return closed ? STATUS_LABELS.CLOSED : STATUS_LABELS.ACTIVE;
}

/**
 * Get safe value or default
 * @param {any} value - Value to check
 * @param {string} defaultValue - Default value if null/undefined
 * @returns {string} - Safe value
 */
export function getSafeValue(value, defaultValue = STATUS_LABELS.UNKNOWN) {
  return value || defaultValue;
}

/**
 * Format project list for display
 * @param {Array} projects - Array of project objects
 * @returns {string} - Formatted project list
 */
export function formatProjectList(projects) {
  return projects.map(p => `- ${p.name} (ID: ${p.id}, Slug: ${p.slug})`).join('\n');
}

/**
 * Format user story list for display
 * @param {Array} userStories - Array of user story objects
 * @returns {string} - Formatted user story list
 */
export function formatUserStoryList(userStories) {
  return userStories.map(us => 
    `- #${us.ref}: ${us.subject} (Status: ${getSafeValue(us.status_extra_info?.name)})`
  ).join('\n');
}

/**
 * Format issue list for display
 * @param {Array} issues - Array of issue objects
 * @returns {string} - Formatted issue list
 */
export function formatIssueList(issues) {
  return issues.map(issue => `- #${issue.ref}: ${issue.subject}
  Status: ${getSafeValue(issue.status_extra_info?.name)}
  Priority: ${getSafeValue(issue.priority_extra_info?.name)}
  Sprint: ${getSafeValue(issue.milestone_extra_info?.name, STATUS_LABELS.NO_SPRINT)}
  Assigned: ${getSafeValue(issue.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}`).join('\n\n');
}

/**
 * Format sprint list for display
 * @param {Array} sprints - Array of sprint objects
 * @returns {string} - Formatted sprint list
 */
export function formatSprintList(sprints) {
  return sprints.map(sprint => {
    const startDate = formatDate(sprint.estimated_start);
    const endDate = formatDate(sprint.estimated_finish);
    const status = getStatusLabel(sprint.closed);
    return `- ${sprint.name} (ID: ${sprint.id})
  Status: ${status}
  Duration: ${startDate} ~ ${endDate}`;
  }).join('\n\n');
}

/**
 * Format sprint issues for display
 * @param {Array} issues - Array of issue objects
 * @returns {string} - Formatted issue list for sprint
 */
export function formatSprintIssues(issues) {
  return issues.map(issue => `- #${issue.ref}: ${issue.subject}
   Status: ${getSafeValue(issue.status_extra_info?.name)}
   Priority: ${getSafeValue(issue.priority_extra_info?.name)}
   Assigned: ${getSafeValue(issue.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}`).join('\n\n');
}

/**
 * Calculate due date status based on due date and completion status
 * @param {string} dueDate - Due date string (YYYY-MM-DD)
 * @param {boolean} isClosed - Whether the item is closed/completed
 * @returns {string} - Status: null, "completed", "past_due", "due_soon", "on_track"
 */
export function calculateDueDateStatus(dueDate, isClosed) {
  if (!dueDate) return null;
  if (isClosed) return 'completed';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'past_due';
  if (diffDays <= 2) return 'due_soon';
  return 'on_track';
}

/**
 * Enrich user object with full details
 * @param {Object} userInfo - User info from Taiga API (assigned_to_extra_info or owner_extra_info)
 * @returns {Object|null} - Enriched user object or null
 */
export function enrichUserObject(userInfo) {
  if (!userInfo) return null;

  return {
    id: userInfo.id || userInfo.user || null,
    username: userInfo.username || null,
    fullName: userInfo.full_name || userInfo.full_name_display || null,
    email: userInfo.email || userInfo.user_email || null,
    photo: userInfo.photo || userInfo.big_photo || null
  };
}

/**
 * Enrich status object with full details
 * @param {Object} statusInfo - Status info from Taiga API
 * @returns {Object|null} - Enriched status object or null
 */
export function enrichStatusObject(statusInfo) {
  if (!statusInfo) return null;

  return {
    id: statusInfo.id,
    name: statusInfo.name,
    color: statusInfo.color || '#cccccc',
    isClosed: statusInfo.is_closed || false
  };
}

/**
 * Enrich priority object with full details
 * @param {Object} priorityInfo - Priority info from Taiga API
 * @returns {Object|null} - Enriched priority object or null
 */
export function enrichPriorityObject(priorityInfo) {
  if (!priorityInfo) return null;

  return {
    id: priorityInfo.id,
    name: priorityInfo.name,
    order: priorityInfo.order || 0
  };
}

/**
 * Enrich task object with full metadata
 * @param {Object} task - Task object from Taiga API
 * @returns {Object} - Enriched task object
 */
export function enrichTaskObject(task) {
  const isClosed = task.status_extra_info?.is_closed || task.is_closed || false;

  return {
    id: task.id,
    ref: task.ref,
    subject: task.subject,
    description: task.description || '',
    status: enrichStatusObject(task.status_extra_info),
    assignedTo: enrichUserObject(task.assigned_to_extra_info),
    owner: enrichUserObject(task.owner_extra_info),
    priority: enrichPriorityObject(task.priority_extra_info),
    dueDate: task.due_date || null,
    dueDateStatus: calculateDueDateStatus(task.due_date, isClosed),
    createdDate: task.created_date,
    modifiedDate: task.modified_date,
    finishedDate: task.finished_date || null,
    tags: task.tags || [],
    isBlocked: task.is_blocked || false,
    blockedNote: task.blocked_note || '',
    isClosed: isClosed,
    attachments: task.total_attachments || 0,
    comments: task.total_comments || 0
  };
}

/**
 * Enrich user story object with full metadata
 * @param {Object} userStory - User story object from Taiga API
 * @param {Array} tasks - Optional array of tasks for this user story
 * @returns {Object} - Enriched user story object
 */
export function enrichUserStoryObject(userStory, tasks = null) {
  const isClosed = userStory.status_extra_info?.is_closed || userStory.is_closed || false;

  const enriched = {
    id: userStory.id,
    ref: userStory.ref,
    subject: userStory.subject,
    description: userStory.description || '',
    status: enrichStatusObject(userStory.status_extra_info),
    assignedTo: enrichUserObject(userStory.assigned_to_extra_info),
    owner: enrichUserObject(userStory.owner_extra_info),
    priority: enrichPriorityObject(userStory.priority_extra_info),
    points: userStory.total_points || null,
    dueDate: userStory.due_date || null,
    dueDateStatus: calculateDueDateStatus(userStory.due_date, isClosed),
    createdDate: userStory.created_date,
    modifiedDate: userStory.modified_date,
    finishDate: userStory.finish_date || null,
    tags: userStory.tags || [],
    blockedNote: userStory.blocked_note || '',
    isBlocked: userStory.is_blocked || false,
    isClosed: isClosed,
    attachments: userStory.total_attachments || 0,
    comments: userStory.total_comments || 0
  };

  // If tasks are provided, include them
  if (tasks !== null && Array.isArray(tasks)) {
    enriched.tasks = tasks.map(task => enrichTaskObject(task));
  }

  // If tasks are not provided, add task counts if available
  if (tasks === null) {
    enriched.taskCount = userStory.total_tasks || 0;
    enriched.taskCompletedCount = userStory.tasks_completed || 0;
  }

  return enriched;
}

/**
 * Enrich issue object with full metadata
 * @param {Object} issue - Issue object from Taiga API
 * @returns {Object} - Enriched issue object
 */
export function enrichIssueObject(issue) {
  const isClosed = issue.status_extra_info?.is_closed || issue.is_closed || false;

  return {
    id: issue.id,
    ref: issue.ref,
    subject: issue.subject,
    description: issue.description || '',
    status: enrichStatusObject(issue.status_extra_info),
    assignedTo: enrichUserObject(issue.assigned_to_extra_info),
    owner: enrichUserObject(issue.owner_extra_info),
    priority: enrichPriorityObject(issue.priority_extra_info),
    severity: issue.severity_extra_info ? {
      id: issue.severity_extra_info.id,
      name: issue.severity_extra_info.name,
      order: issue.severity_extra_info.order || 0
    } : null,
    type: issue.type_extra_info ? {
      id: issue.type_extra_info.id,
      name: issue.type_extra_info.name
    } : null,
    dueDate: issue.due_date || null,
    dueDateStatus: calculateDueDateStatus(issue.due_date, isClosed),
    createdDate: issue.created_date,
    modifiedDate: issue.modified_date,
    finishedDate: issue.finished_date || null,
    tags: issue.tags || [],
    isBlocked: issue.is_blocked || false,
    blockedNote: issue.blocked_note || '',
    isClosed: isClosed,
    attachments: issue.total_attachments || 0,
    comments: issue.total_comments || 0
  };
}