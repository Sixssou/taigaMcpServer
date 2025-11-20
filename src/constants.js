/**
 * Constants and configuration for Taiga MCP Server
 */

export const SERVER_INFO = {
  name: 'Taiga MCP',
  version: '1.2.2',
};

export const RESOURCE_URIS = {
  API_DOCS: 'docs://taiga/api',
  PROJECTS: 'taiga://projects',
};

export const ERROR_MESSAGES = {
  AUTHENTICATION_FAILED: 'Authentication failed',
  PROJECT_NOT_FOUND: 'Project not found',
  ISSUE_NOT_FOUND: 'Issue not found',
  SPRINT_NOT_FOUND: 'Sprint not found',
  TASK_NOT_FOUND: 'Task not found',
  INVALID_REFERENCE: 'Invalid reference format',
  MISSING_PROJECT_ID: 'Project identifier is required when using reference number',
  FAILED_TO_LIST_PROJECTS: 'Failed to list projects from Taiga',
  FAILED_TO_CREATE_USER_STORY: 'Failed to create user story in Taiga',
  FAILED_TO_CREATE_TASK: 'Failed to create task in Taiga',
  FAILED_TO_UPDATE_TASK: 'Failed to update task in Taiga',
  FAILED_TO_GET_TASK: 'Failed to get task details from Taiga',
  FAILED_TO_CREATE_ISSUE: 'Failed to create issue in Taiga',
  FAILED_TO_CREATE_SPRINT: 'Failed to create sprint in Taiga',
  FAILED_TO_LIST_USER_STORIES: 'Failed to list user stories from Taiga',
  FAILED_TO_LIST_ISSUES: 'Failed to list issues from Taiga',
  FAILED_TO_LIST_SPRINTS: 'Failed to list sprints from Taiga',
  FAILED_TO_GET_PROJECT: 'Failed to get project details from Taiga',
  FAILED_TO_GET_ISSUE: 'Failed to get issue details from Taiga',
  FAILED_TO_GET_SPRINT: 'Failed to get sprint details from Taiga',
  FAILED_TO_GET_SPRINT_STATS: 'Failed to get sprint statistics from Taiga',
  FAILED_TO_ADD_COMMENT: 'Failed to add comment to Taiga',
  FAILED_TO_LIST_COMMENTS: 'Failed to list comments from Taiga',
  FAILED_TO_EDIT_COMMENT: 'Failed to edit comment in Taiga',
  FAILED_TO_DELETE_COMMENT: 'Failed to delete comment from Taiga',
  COMMENT_NOT_FOUND: 'Comment not found',
  INVALID_COMMENT_TARGET: 'Invalid comment target type',
  FAILED_TO_UPLOAD_ATTACHMENT: 'Failed to upload attachment to Taiga',
  FAILED_TO_LIST_ATTACHMENTS: 'Failed to list attachments from Taiga',
  FAILED_TO_DOWNLOAD_ATTACHMENT: 'Failed to download attachment from Taiga',
  FAILED_TO_DELETE_ATTACHMENT: 'Failed to delete attachment from Taiga',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',
  INVALID_FILE_FORMAT: 'Invalid file format or size',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  FAILED_TO_CREATE_EPIC: 'Failed to create epic in Taiga',
  FAILED_TO_LIST_EPICS: 'Failed to list epics from Taiga',
  FAILED_TO_GET_EPIC: 'Failed to get epic details from Taiga',
  FAILED_TO_UPDATE_EPIC: 'Failed to update epic in Taiga',
  FAILED_TO_LINK_STORY: 'Failed to link user story to epic',
  FAILED_TO_UNLINK_STORY: 'Failed to unlink user story from epic',
  EPIC_NOT_FOUND: 'Epic not found',
  USER_STORY_NOT_FOUND: 'User story not found',
  FAILED_TO_CREATE_WIKI: 'Failed to create wiki page in Taiga',
  FAILED_TO_LIST_WIKI: 'Failed to list wiki pages from Taiga',
  FAILED_TO_GET_WIKI: 'Failed to get wiki page details from Taiga',
  FAILED_TO_UPDATE_WIKI: 'Failed to update wiki page in Taiga',
  FAILED_TO_DELETE_WIKI: 'Failed to delete wiki page from Taiga',
  FAILED_TO_WATCH_WIKI: 'Failed to watch/unwatch wiki page',
  WIKI_PAGE_NOT_FOUND: 'Wiki page not found',
  INVALID_WIKI_SLUG: 'Invalid wiki page slug format',
};

export const SUCCESS_MESSAGES = {
  AUTHENTICATED: 'Successfully authenticated',
  USER_STORY_CREATED: 'User story created successfully!',
  USER_STORY_UPDATED: 'User story updated successfully!',
  USER_STORY_DELETED: 'User story deleted successfully!',
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  ISSUE_CREATED: 'Issue created successfully!',
  SPRINT_CREATED: 'Sprint created successfully!',
  COMMENT_ADDED: 'Comment added successfully!',
  COMMENT_EDITED: 'Comment edited successfully!',
  COMMENT_DELETED: 'Comment deleted successfully!',
  ATTACHMENT_UPLOADED: 'Attachment uploaded successfully!',
  ATTACHMENT_DOWNLOADED: 'Attachment downloaded successfully!',
  ATTACHMENT_DELETED: 'Attachment deleted successfully!',
  EPIC_CREATED: 'Epic created successfully!',
  EPIC_UPDATED: 'Epic updated successfully!',
  STORY_LINKED_TO_EPIC: 'User story linked to epic successfully!',
  STORY_UNLINKED_FROM_EPIC: 'User story unlinked from epic successfully!',
  WIKI_PAGE_CREATED: 'Wiki page created successfully!',
  WIKI_PAGE_UPDATED: 'Wiki page updated successfully!',
  WIKI_PAGE_DELETED: 'Wiki page deleted successfully!',
  WIKI_PAGE_WATCHED: 'Wiki page watch status updated successfully!',
};

export const BATCH_OPERATIONS = {
  MAX_BATCH_SIZE: 20,
  ERROR_EMPTY_BATCH: 'Batch array cannot be empty',
  ERROR_BATCH_TOO_LARGE: 'Batch size exceeds maximum limit',
  SUCCESS_BATCH_CREATED_ISSUES: 'Batch Issues creation completed',
  SUCCESS_BATCH_CREATED_STORIES: 'Batch User Stories creation completed',
  SUCCESS_BATCH_CREATED_TASKS: 'Batch Tasks creation completed',
  BATCH_OPERATION_START: 'Starting batch operation...',
  BATCH_OPERATION_COMPLETE: 'Batch operation completed!',
};

export const ADVANCED_QUERY = {
  MAX_RESULTS: 1000,
  DEFAULT_LIMIT: 50,
  MAX_COMPLEXITY: 10,
  TIMEOUT_MS: 30000,

  // Query error messages
  ERROR_EMPTY_QUERY: 'Query string cannot be empty',
  ERROR_INVALID_SYNTAX: 'Invalid query syntax',
  ERROR_UNSUPPORTED_FIELD: 'Unsupported field for this data type',
  ERROR_INVALID_OPERATOR: 'Invalid operator',
  ERROR_INVALID_VALUE: 'Invalid value for field',
  ERROR_QUERY_TOO_COMPLEX: 'Query complexity exceeds maximum limit',
  ERROR_EXECUTION_TIMEOUT: 'Query execution timeout',
  ERROR_NO_RESULTS: 'No results found for the given query',

  // Query success messages
  SUCCESS_QUERY_EXECUTED: 'Query executed successfully',
  SUCCESS_QUERY_VALIDATED: 'Query syntax validation passed',

  // Query hint messages
  HINT_USE_QUOTES: 'Use quotes for values containing spaces',
  HINT_CHECK_SPELLING: 'Check field names and operator spelling',
  HINT_USE_LIMIT: 'Consider using LIMIT to reduce result size',
  HINT_USE_HELP: 'Use queryHelp for syntax assistance',

  // Supported data types
  SUPPORTED_TYPES: ['issues', 'user_stories', 'tasks'],

  // Query complexity weights
  COMPLEXITY_WEIGHTS: {
    FILTER: 1,
    LOGIC_OP: 0.5,
    ORDER_BY: 1,
    LIMIT: 0.2,
    GROUP_BY: 2,
    TEXT_SEARCH: 1.5,
    DATE_RANGE: 1.2
  }
};

export const API_ENDPOINTS = {
  PROJECTS: '/projects',
  USER_STORIES: '/userstories',
  TASKS: '/tasks',
  ISSUES: '/issues',
  MILESTONES: '/milestones',
  USER_STORY_STATUSES: '/userstory-statuses',
  TASK_STATUSES: '/task-statuses',
  ISSUE_STATUSES: '/issue-statuses',
  PRIORITIES: '/priorities',
  SEVERITIES: '/severities',
  ISSUE_TYPES: '/issue-types',
  USERS_ME: '/users/me',
  HISTORY: '/history',
  COMMENTS: '/history', // Comments are part of history system
  ISSUE_ATTACHMENTS: '/issues/attachments',
  USERSTORY_ATTACHMENTS: '/userstories/attachments',
  TASK_ATTACHMENTS: '/tasks/attachments',
  EPICS: '/epics',
  EPIC_RELATED_USERSTORIES: (epicId) => `/epics/${epicId}/related_userstories`, // Function to build epic-related user stories endpoint
  WIKI: '/wiki',
  WIKI_ATTACHMENTS: '/wiki/attachments',
  MEMBERSHIPS: '/memberships',
};

export const RESPONSE_TEMPLATES = {
  NO_PROJECTS: 'No projects found.',
  NO_USER_STORIES: 'No user stories found in this project.',
  NO_TASKS: 'No tasks found.',
  NO_ISSUES: 'No issues found in this project.',
  NO_SPRINTS: 'No sprints found in this project.',
  NO_WIKI_PAGES: 'No wiki pages found in this project.',
  PROJECT_REQUIRED_FOR_REF: 'Project identifier is required when using reference number.',
};

export const STATUS_LABELS = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  UNKNOWN: 'Unknown',
  NOT_SET: 'Not set',
  UNASSIGNED: 'Unassigned',
  NO_SPRINT: 'No Sprint',
  NO_DESCRIPTION: 'No description provided',
  NO_TAGS: 'No tags',
};