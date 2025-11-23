/**
 * Advanced Query Syntax Specification and Operator Definitions
 * Advanced Query Grammar and Operators for Taiga MCP Server
 */

// Supported field types
export const FIELD_TYPES = {
  // Issue fields
  ISSUE: {
    subject: 'string',      // Title
    description: 'string',  // Description
    status: 'enum',        // Status
    priority: 'enum',      // Priority
    type: 'enum',          // Type
    severity: 'enum',      // Severity
    assignee: 'string',    // Assignee
    reporter: 'string',    // Reporter
    owner: 'string',       // Creator
    tags: 'array',         // Tags
    created: 'date',       // Created time
    updated: 'date',       // Updated time
    closed: 'boolean',     // Is closed
    due_date: 'date',      // Due date
    finish_date: 'date',   // Completion date
    blocked: 'boolean',    // Is blocked
    milestone: 'string',   // Milestone/Sprint
    attachments: 'number', // Number of attachments
    comments: 'number',    // Number of comments
    ref: 'number'          // Reference number
  },

  // User Story fields
  USER_STORY: {
    subject: 'string',
    description: 'string',
    status: 'enum',
    points: 'number',      // Story points
    priority: 'enum',      // Priority
    assignee: 'string',
    owner: 'string',       // Owner/Creator
    tags: 'array',
    created: 'date',
    updated: 'date',
    closed: 'boolean',     // Is closed
    due_date: 'date',      // Due date
    finish_date: 'date',   // Completion date
    blocked: 'boolean',    // Is blocked
    milestone: 'string',   // Milestone/Sprint
    epic: 'string',        // Epic
    attachments: 'number', // Number of attachments
    comments: 'number',    // Number of comments
    ref: 'number'
  },

  // Task fields
  TASK: {
    subject: 'string',
    description: 'string',
    status: 'enum',
    assignee: 'string',
    owner: 'string',       // Creator
    user_story: 'string',  // Associated user story
    tags: 'array',
    created: 'date',
    updated: 'date',
    closed: 'boolean',     // Is closed
    due_date: 'date',      // Due date
    finish_date: 'date',   // Completion date
    blocked: 'boolean',    // Is blocked
    milestone: 'string',   // Milestone/Sprint
    attachments: 'number', // Number of attachments
    comments: 'number',    // Number of comments
    ref: 'number'
  }
};

// Field aliases for more intuitive querying
export const FIELD_ALIASES = {
  sprint: 'milestone',
  assigned: 'assignee',
  created_by: 'owner',
  is_blocked: 'blocked',
  is_closed: 'closed',
  has_attachments: 'attachments'
};

// Comparison operators
export const OPERATORS = {
  // Equality comparison
  EQUAL: '=',
  NOT_EQUAL: '!=',

  // Numeric comparison
  GREATER_THAN: '>',
  GREATER_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_EQUAL: '<=',

  // Range query
  RANGE: '..',           // Example: points:3..8
  BETWEEN: 'between',    // Example: created:between:[2025-11-01,2025-11-30]

  // String matching
  CONTAINS: 'contains',  // description:contains:"API"
  STARTS_WITH: 'starts', // subject:starts:"Fix"
  ENDS_WITH: 'ends',     // subject:ends:"Bug"
  FUZZY: '~',           // subject:~"login"
  WILDCARD: '*',        // subject:*login*

  // Array operations
  IN: 'in',             // tags:in:[frontend,backend] or status:in:[New,In progress]
  NOT_IN: 'not_in',     // tags:not_in:[deprecated]

  // Existence checks
  EXISTS: 'exists',     // assignee:exists
  NULL: 'null',         // assignee:null
  EMPTY: 'empty',       // tags:empty - field is empty/null/undefined
  NOT_EMPTY: 'notempty' // assignee:notempty - field has a value
};

// Logical operators
export const LOGIC_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
};

// Sort directions
export const SORT_DIRECTIONS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Predefined time keywords
export const TIME_KEYWORDS = {
  // Relative time
  today: () => new Date(),
  yesterday: () => new Date(Date.now() - 24 * 60 * 60 * 1000),
  this_week: () => getThisWeekStart(),
  last_week: () => getLastWeekStart(),
  this_month: () => getThisMonthStart(),
  last_month: () => getLastMonthStart(),

  // Relative time ranges
  '1d': () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  '3d': () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  '7d': () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  '30d': () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  '90d': () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
};

// Special values for various fields
export const SPECIAL_VALUES = {
  milestone: ['active', 'closed', 'null', '*'],
  due_date: ['past', 'upcoming', 'null'],
  epic: ['null', '*'],
  user_story: ['null'],
  boolean: ['true', 'false']
};

// Status enum values (based on actual Taiga statuses)
export const STATUS_VALUES = {
  ISSUE: ['new', 'in-progress', 'ready-for-test', 'closed', 'needs-info', 'rejected'],
  USER_STORY: ['new', 'in-progress', 'ready-for-test', 'done'],
  TASK: ['new', 'in-progress', 'ready-for-test', 'closed']
};

// Priority enum values
export const PRIORITY_VALUES = ['low', 'normal', 'high', 'urgent'];

// Type enum values
export const TYPE_VALUES = ['bug', 'feature', 'enhancement', 'task', 'story'];

// Severity enum values
export const SEVERITY_VALUES = ['minor', 'normal', 'important', 'critical'];

// Query syntax examples
export const QUERY_EXAMPLES = {
  basic: [
    'status:open',
    'priority:high', 
    'assignee:john',
    'type:bug'
  ],
  
  comparison: [
    'points:>=5',
    'created:>2024-01-01',
    'updated:<7d',
    'ref:>100'
  ],
  
  text_search: [
    'subject:contains:"login"',
    'description:*API*',
    'subject:~"bug"',
    'tags:frontend'
  ],
  
  logical: [
    'status:open AND priority:high',
    'type:bug OR type:feature', 
    'NOT status:closed',
    '(status:open OR status:in-progress) AND assignee:john'
  ],
  
  advanced: [
    'status:open AND priority:high AND created:>7d',
    'assignee:john AND (type:bug OR priority:urgent)',
    'tags:frontend AND points:3..8 AND status:!=done',
    'milestone:"Sprint 3" AND updated:this_week'
  ],
  
  sorting: [
    'status:open ORDER BY priority DESC',
    'assignee:john ORDER BY created ASC',
    'type:bug ORDER BY updated DESC LIMIT 10'
  ]
};

// Helper functions
function getThisWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
  return new Date(now.setDate(diff));
}

function getLastWeekStart() {
  const thisWeek = getThisWeekStart();
  return new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function getThisMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getLastMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

// Syntax validation rules
export const VALIDATION_RULES = {
  // Field name validation
  isValidField: (field, type) => {
    return FIELD_TYPES[type] && Object.keys(FIELD_TYPES[type]).includes(field);
  },

  // Operator validation
  isValidOperator: (operator) => {
    return Object.values(OPERATORS).includes(operator);
  },

  // Value type validation
  isValidValue: (field, value, type) => {
    const fieldType = FIELD_TYPES[type][field];

    switch (fieldType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'date':
        return !isNaN(Date.parse(value)) || TIME_KEYWORDS[value];
      case 'enum':
        // Check enum values based on field
        if (field === 'status') return STATUS_VALUES[type].includes(value);
        if (field === 'priority') return PRIORITY_VALUES.includes(value);
        if (field === 'type') return TYPE_VALUES.includes(value);
        if (field === 'severity') return SEVERITY_VALUES.includes(value);
        return true;
      case 'array':
        return true; // Tags can be any string
      default:
        return true;
    }
  }
};

export default {
  FIELD_TYPES,
  FIELD_ALIASES,
  OPERATORS,
  LOGIC_OPERATORS,
  SORT_DIRECTIONS,
  TIME_KEYWORDS,
  SPECIAL_VALUES,
  STATUS_VALUES,
  PRIORITY_VALUES,
  TYPE_VALUES,
  SEVERITY_VALUES,
  QUERY_EXAMPLES,
  VALIDATION_RULES
};