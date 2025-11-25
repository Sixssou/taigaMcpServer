/**
 * Advanced Search MCP Tools for Taiga
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

import { QueryParser } from '../query/QueryParser.js';
import { QueryExecutor } from '../query/QueryExecutor.js';
import { QUERY_EXAMPLES } from '../query/queryGrammar.js';

const taigaService = new TaigaService();

/**
 * Advanced search tool
 */
export const advancedSearchTool = {
  name: 'advancedSearch',
  schema: {
    projectIdentifier: z.string().describe('Project ID, slug, or name'),
    query: z.string().describe('Advanced search query using special syntax'),
    type: z.enum(['issues', 'user_stories', 'tasks']).optional().default('issues').describe('Type of items to search'),
    limit: z.number().optional().describe('Maximum number of results (default: 100, max: 500)'),
    offset: z.number().optional().describe('Number of results to skip for pagination (default: 0)'),
    orderBy: z.string().optional().describe('Field to sort by (prefix with - for descending, e.g., "-created")'),
    includeMetadata: z.boolean().optional().default(true).describe('Include enriched metadata (assignee names, status names, etc.)')
  },
  handler: async ({ projectIdentifier, query, type = 'issues', limit = 100, offset = 0, orderBy, includeMetadata = true }) => {
    try {
      // Validate limit
      if (limit > 500) {
        return createErrorResponse('Limit cannot exceed 500. Use offset for pagination.');
      }

      const projectId = await resolveProjectId(projectIdentifier);
      const parser = new QueryParser();
      const executor = new QueryExecutor(taigaService);

      // Map type
      const dataType = type === 'issues' ? 'ISSUE' :
                       type === 'user_stories' ? 'USER_STORY' : 'TASK';

      // Parse query
      const parsedQuery = parser.parse(query, dataType);

      // Add orderBy if provided and not already in query
      if (orderBy && !parsedQuery.orderBy) {
        const direction = orderBy.startsWith('-') ? 'DESC' : 'ASC';
        const field = orderBy.startsWith('-') ? orderBy.substring(1) : orderBy;
        parsedQuery.orderBy = { field, direction };
      }

      // Execute query
      const startTime = Date.now();
      const result = await executor.execute(parsedQuery, projectId);
      const endTime = Date.now();

      // Apply pagination
      const total = result.results.length;
      const paginatedResults = result.results.slice(offset, offset + limit);

      // Format results with metadata
      const formattedResults = includeMetadata ?
        formatAdvancedSearchResultsWithMetadata(paginatedResults, type, query, endTime - startTime, total, limit, offset) :
        formatAdvancedSearchResults(paginatedResults, type, query, endTime - startTime, total, limit, offset);

      return createSuccessResponse(formattedResults);

    } catch (error) {
      if (error.message.includes('Query parsing error') || error.message.includes('Query execution failed')) {
        return createErrorResponse(`${error.message}\n\nQuery syntax examples:\n${getQueryExamples()}`);
      }
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_LIST_ISSUES}: ${error.message}`);
    }
  }
};

/**
 * Query syntax help tool
 */
export const queryHelpTool = {
  name: 'queryHelp',
  schema: {
    topic: z.enum(['syntax', 'operators', 'examples', 'fields']).optional().describe('Help topic to show')
  },
  handler: async ({ topic }) => {
    try {
      let helpContent = '';
      
      switch (topic) {
        case 'syntax':
          helpContent = getQuerySyntaxHelp();
          break;
        case 'operators':
          helpContent = getOperatorsHelp();
          break;
        case 'examples':
          helpContent = getQueryExamplesHelp();
          break;
        case 'fields':
          helpContent = getFieldsHelp();
          break;
        default:
          helpContent = getGeneralHelp();
          break;
      }
      
      return createSuccessResponse(helpContent);

    } catch (error) {
      return createErrorResponse(`Unable to get help information: ${error.message}`);
    }
  }
};

/**
 * Query syntax validation tool
 */
export const validateQueryTool = {
  name: 'validateQuery',
  schema: {
    query: z.string().describe('Query string to validate'),
    type: z.enum(['issues', 'user_stories', 'tasks']).optional().default('issues').describe('Type of items to validate against')
  },
  handler: async ({ query, type = 'issues' }) => {
    try {
      const parser = new QueryParser();
      const dataType = type === 'issues' ? 'ISSUE' :
                       type === 'user_stories' ? 'USER_STORY' : 'TASK';

      // Parse query (this validates syntax)
      const parsedQuery = parser.parse(query, dataType);
      const stats = parser.getQueryStats(parsedQuery);
      
      const validationResult = `
**Query Validation Passed**

**Parsing Results:**
- Filter Count: ${stats.filterCount}
- Logic Operator: ${parsedQuery.logic}
- Sort: ${stats.hasOrderBy ? `${parsedQuery.orderBy.field} ${parsedQuery.orderBy.direction}` : 'None'}
- Limit: ${stats.hasLimit ? parsedQuery.limit : 'None'}
- Group By: ${stats.hasGroupBy ? parsedQuery.groupBy : 'None'}
- Complexity: ${stats.complexity}

**Filter Details:**
${parsedQuery.filters.map((filter, index) =>
  `${index + 1}. ${filter.field} ${filter.operator} ${JSON.stringify(filter.value)}`
).join('\n')}

**Query Type:** ${type}
`;
      
      return createSuccessResponse(validationResult);
      
    } catch (error) {
      return createErrorResponse(`**Query Validation Failed**\n\n${error.message}\n\nUse queryHelp for syntax assistance`);
    }
  }
};

/**
 * Format advanced search results (simple format)
 */
function formatAdvancedSearchResults(results, type, query, executionTime, total, limit, offset) {
  if (!results || results.length === 0) {
    return `**Advanced Search Results**\n\nQuery: \`${query}\`\nType: ${type}\nTotal: ${total || 0}\n\nNo matching results found`;
  }

  let output = `**Advanced Search Results**\n\n`;
  output += `Query: \`${query}\`\n`;
  output += `Type: ${type}\n`;
  output += `Execution Time: ${executionTime}ms\n`;
  output += `Total Results: ${total}\n`;
  output += `Showing: ${results.length} (offset: ${offset}, limit: ${limit})\n\n`;

  // Format results by type
  results.forEach((item, index) => {
    output += formatSearchItem(item, type, offset + index + 1);
    output += '\n';
  });

  // Pagination tips
  if (total > offset + limit) {
    output += `\n**Pagination Available**: Use offset=${offset + limit} to see next ${Math.min(limit, total - offset - limit)} results`;
  }

  return output;
}

/**
 * Format advanced search results with enriched metadata
 */
function formatAdvancedSearchResultsWithMetadata(results, type, query, executionTime, total, limit, offset) {
  if (!results || results.length === 0) {
    return `**Advanced Search Results**\n\nQuery: \`${query}\`\nType: ${type}\nTotal: ${total || 0}\n\nNo matching results found`;
  }

  let output = `**Advanced Search Results**\n\n`;
  output += `Query: \`${query}\`\n`;
  output += `Type: ${type}\n`;
  output += `Execution Time: ${executionTime}ms\n`;
  output += `Total Results: ${total}\n`;
  output += `Showing: ${results.length} (offset: ${offset}, limit: ${limit})\n\n`;

  // Format results by type with metadata
  results.forEach((item, index) => {
    output += formatSearchItemWithMetadata(item, type, offset + index + 1);
    output += '\n';
  });

  // Pagination tips
  if (total > offset + limit) {
    output += `\n**Pagination Available**: Use offset=${offset + limit} to see next ${Math.min(limit, total - offset - limit)} results`;
  }

  return output;
}

/**
 * Format single search result item
 */
function formatSearchItem(item, type, index) {
  const ref = item.ref || index;
  const subject = item.subject || 'No title';
  const status = item.status_extra_info?.name || item.status || 'Unknown';
  const created = formatDateTime(item.created_date);

  let output = `**${index}. #${ref}: ${subject}**\n`;
  output += `   Status: ${status}\n`;

  if (type === 'issues') {
    const priority = item.priority_extra_info?.name || item.priority || 'Normal';
    const type_name = item.type_extra_info?.name || item.type || 'Issue';
    const assignee = item.assigned_to_extra_info?.full_name || 'Unassigned';

    output += `   Type: ${type_name} | Priority: ${priority}\n`;
    output += `   Assignee: ${assignee}\n`;
  } else if (type === 'user_stories') {
    const points = item.total_points || 0;
    const assignee = item.assigned_to_extra_info?.full_name || 'Unassigned';

    output += `   Points: ${points} | Assignee: ${assignee}\n`;
  } else if (type === 'tasks') {
    const assignee = item.assigned_to_extra_info?.full_name || 'Unassigned';
    const userStory = item.user_story_extra_info?.subject || 'No related story';

    output += `   Assignee: ${assignee}\n`;
    output += `   User Story: ${userStory}\n`;
  }

  output += `   Created: ${created}`;

  return output;
}

/**
 * Format single search result item with enriched metadata
 */
function formatSearchItemWithMetadata(item, type, index) {
  const ref = item.ref || index;
  const subject = item.subject || 'No title';
  const status = item.status_extra_info?.name || item.status || 'Unknown';
  const isClosed = item.is_closed || false;
  const created = formatDateTime(item.created_date);
  const updated = formatDateTime(item.modified_date);

  let output = `**${index}. #${ref}: ${subject}**\n`;
  output += `   Status: ${status}${isClosed ? ' (Closed)' : ''}\n`;

  // Common metadata fields
  const assignee = item.assigned_to_extra_info?.full_name || 'Unassigned';
  const owner = item.owner_extra_info?.full_name || 'Unknown';
  const milestone = item.milestone_extra_info?.name || item.milestone_slug || 'No Sprint';
  const blocked = item.is_blocked || false;
  const dueDate = item.due_date ? formatDateTime(item.due_date) : null;
  const attachments = item.attachments?.length || 0;
  const comments = item.total_comments || 0;

  if (type === 'issues') {
    const priority = item.priority_extra_info?.name || item.priority || 'Normal';
    const type_name = item.type_extra_info?.name || item.type || 'Issue';
    const severity = item.severity_extra_info?.name || 'Normal';

    output += `   Type: ${type_name} | Priority: ${priority} | Severity: ${severity}\n`;
    output += `   Assignee: ${assignee} | Owner: ${owner}\n`;
    output += `   Sprint: ${milestone}${blocked ? ' | 🚫 BLOCKED' : ''}\n`;
    if (dueDate) output += `   Due Date: ${dueDate}\n`;
    if (attachments > 0 || comments > 0) {
      output += `   Attachments: ${attachments} | Comments: ${comments}\n`;
    }
  } else if (type === 'user_stories') {
    const points = item.total_points || 0;
    const epic = item.epic_extra_info?.subject || 'No Epic';

    output += `   Points: ${points} | Assignee: ${assignee} | Owner: ${owner}\n`;
    output += `   Sprint: ${milestone} | Epic: ${epic}${blocked ? ' | 🚫 BLOCKED' : ''}\n`;
    if (dueDate) output += `   Due Date: ${dueDate}\n`;
    if (attachments > 0 || comments > 0) {
      output += `   Attachments: ${attachments} | Comments: ${comments}\n`;
    }
  } else if (type === 'tasks') {
    const userStory = item.user_story_extra_info?.subject || 'No related story';

    output += `   Assignee: ${assignee} | Owner: ${owner}\n`;
    output += `   User Story: ${userStory}\n`;
    output += `   Sprint: ${milestone}${blocked ? ' | 🚫 BLOCKED' : ''}\n`;
    if (dueDate) output += `   Due Date: ${dueDate}\n`;
    if (attachments > 0 || comments > 0) {
      output += `   Attachments: ${attachments} | Comments: ${comments}\n`;
    }
  }

  output += `   Created: ${created} | Updated: ${updated}`;

  return output;
}

/**
 * Get query examples
 */
function getQueryExamples() {
  return `
Basic queries:
- status:open
- priority:high
- assignee:john

Comparison queries:
- points:>=5
- created:>2024-01-01
- updated:<7d

Text search:
- subject:contains:"login"
- description:*API*
- tags:frontend

Logic combinations:
- status:open AND priority:high
- type:bug OR type:feature
- NOT status:closed
`;
}

/**
 * Get query syntax help
 */
function getQuerySyntaxHelp() {
  return `
**Advanced Query Syntax Guide**

## Basic Syntax
\`field:value\` - Field equals value
\`field:operator:value\` - Field operator value

## Operators
- \`=\` Equals (default)
- \`!=\` Not equals
- \`>\`, \`>=\` Greater than, greater than or equal
- \`<\`, \`<=\` Less than, less than or equal
- \`contains\` Contains text
- \`~\` Fuzzy match

## Logic Operators
- \`AND\` And condition
- \`OR\` Or condition
- \`NOT\` Not condition

## Sorting and Limiting
- \`ORDER BY field ASC/DESC\` Sort
- \`LIMIT number\` Limit result count

## Time Keywords
- \`today\`, \`yesterday\`
- \`this_week\`, \`last_month\`
- \`7d\`, \`30d\` (relative time)
`;
}

/**
 * Get operators help
 */
function getOperatorsHelp() {
  return `
**Query Operators Detailed**

## Comparison Operators
- \`field:value\` - Equals (default)
- \`field:!=value\` - Not equals
- \`field:>value\` - Greater than
- \`field:>=value\` - Greater than or equal
- \`field:<value\` - Less than
- \`field:<=value\` - Less than or equal

## Text Operators
- \`field:contains:"text"\` - Contains text (case-insensitive)
- \`field:~"text"\` - Fuzzy match
- \`field:*text*\` - Wildcard match

## Array/List Operators
- \`field:in:[value1,value2,value3]\` - Field equals any value in list
  - Example: \`status:in:[New,In progress]\`
  - Example: \`tags:in:[legal,inpi]\`
- \`field:not_in:[value1,value2]\` - Field not in list

## Range Operators
- \`field:3..8\` - Between 3 and 8 (inclusive, legacy syntax)
- \`field:between:[start,end]\` - Between start and end (new syntax)
  - Example: \`points:between:[3,8]\`
  - Example: \`created:between:[2025-11-01,2025-11-30]\`

## Existence Operators
- \`field:null\` - Field is null/unassigned
- \`field:exists\` - Field exists (not null)
- \`field:empty\` - Field is empty (null, "", [], or {})
- \`field:notempty\` - Field has a value (not empty)

## Special Field Values

### Milestone (Sprint)
- \`milestone:active\` - Items in active sprints
- \`milestone:closed\` - Items in closed sprints
- \`milestone:null\` - Items without a sprint
- \`milestone:*\` - Items with any sprint assigned

### Due Date
- \`due_date:past\` - Due date in the past AND not closed
- \`due_date:upcoming\` - Due date within next 7 days
- \`due_date:null\` - No due date set

### Epic
- \`epic:null\` - Items without an epic
- \`epic:*\` - Items with any epic assigned

### User Story (for tasks)
- \`user_story:null\` - Orphan tasks (no user story)

### Boolean Fields (blocked, closed)
- \`blocked:true\` - Blocked items
- \`blocked:false\` - Non-blocked items
- \`closed:true\` - Closed items
- \`closed:false\` - Open items

## Operator Examples
\`\`\`
# List operations
status:in:[New,In progress,Ready for test]
assignee:in:[cyril,melanie]
tags:in:[legal,inpi]

# Range operations
points:between:[3,8]
created:between:[2025-11-01,2025-11-30]

# Existence checks
assignee:empty          # Unassigned items
description:notempty    # Items with descriptions
milestone:null          # Items without sprint

# Special values
due_date:past           # Overdue items
milestone:active        # Items in active sprints
blocked:true            # Blocked items
\`\`\`
`;
}

/**
 * Get query examples help
 */
function getQueryExamplesHelp() {
  return `
**Query Examples Collection**

## Basic Queries
\`\`\`
status:open
priority:high
assignee:cyril
milestone:S47-S48
\`\`\`

## Issues Queries
\`\`\`
status:open AND priority:high
type:bug AND assignee:john
created:>7d AND NOT status:closed
priority:urgent OR severity:critical
blocked:true AND comments:>0
due_date:past AND closed:false
\`\`\`

## User Stories Queries
\`\`\`
points:>=5 AND status:in-progress
assignee:team-lead AND points:between:[3,8]
milestone:S47-S48 AND closed:false
epic:"Structuration juridique" AND attachments:>0
sprint:active AND assignee:notempty
due_date:upcoming AND blocked:false
\`\`\`

## Tasks Queries
\`\`\`
assignee:developer AND status:open
user_story:178 AND closed:false
status:in-progress LIMIT 5
milestone:null AND assignee:empty
user_story:null AND created:>7d
\`\`\`

## Queries with New Operators
\`\`\`
# IN operator - multiple values
status:in:[New,In progress,Ready for test]
assignee:in:[cyril,melanie,john]
tags:in:[legal,inpi,association]

# BETWEEN operator - ranges
points:between:[3,8]
created:between:[2025-11-01,2025-11-30]

# EMPTY/NOTEMPTY operators
assignee:empty              # Unassigned items
description:notempty        # Items with description
milestone:null              # No sprint assigned

# Special milestone values
milestone:active            # Items in active sprints
milestone:closed            # Items in closed sprints
milestone:*                 # Items with any sprint

# Special due_date values
due_date:past              # Overdue items (not closed)
due_date:upcoming          # Due within 7 days
due_date:null              # No due date set

# Boolean fields
blocked:true               # Blocked items only
closed:false               # Open items only
\`\`\`

## Complex Combined Queries
\`\`\`
# US in specific sprint, assigned to cyril, open, high priority
milestone:S47-S48 AND assignee:cyril AND closed:false AND priority:high

# Overdue tasks without assignee
due_date:past AND assignee:null AND type:tasks

# Blocked issues with comments
blocked:true AND comments:>0 AND type:issues

# US of specific epic with attachments
epic:"Structuration juridique" AND attachments:>0

# Tasks of specific US that are not closed
user_story:178 AND closed:false

# Items created by cyril last week
owner:cyril AND created:>7d AND created:<1d

# US without sprint and without due date
milestone:null AND due_date:null

# Tasks with legal or inpi tags, assigned
tags:in:[legal,inpi] AND assignee:notempty

# Stories in sprint S47-S48 with 3-8 points, not blocked
milestone:S47-S48 AND points:between:[3,8] AND blocked:false

# High priority items with multiple status options
priority:high AND status:in:[New,In progress] AND closed:false
\`\`\`

## With Sorting and Pagination
\`\`\`
# Most recent open issues
status:open ORDER BY created DESC LIMIT 10

# High priority US sorted by points
priority:high ORDER BY points ASC

# Using orderBy parameter (alternative syntax)
# advancedSearch(project, "status:open", "user_stories", {
#   orderBy: "-created",  # Most recent first
#   limit: 20,
#   offset: 0
# })
\`\`\`
`;
}

/**
 * Get fields help
 */
function getFieldsHelp() {
  return `
**Queryable Fields List**

## Issues Fields
- \`subject\` - Title
- \`description\` - Description
- \`status\` - Status (supports in:[] operator)
- \`priority\` - Priority (supports in:[] operator)
- \`type\` - Type
- \`severity\` - Severity
- \`assignee\` - Assignee (username or ID)
- \`owner\` - Creator (username or ID)
- \`milestone\` - Sprint (name, ID, or special: active, closed, null, *)
- \`blocked\` - Is blocked (true/false)
- \`closed\` - Is closed (true/false)
- \`due_date\` - Due date (date or special: past, upcoming, null)
- \`finish_date\` - Completion date
- \`attachments\` - Number of attachments
- \`comments\` - Number of comments
- \`tags\` - Tags (supports in:[] operator)
- \`created\` - Created time
- \`updated\` - Updated time

## User Stories Fields
- \`subject\` - Title
- \`description\` - Description
- \`status\` - Status (supports in:[] operator)
- \`points\` - Story points (supports between:[] operator)
- \`assignee\` - Assignee (username or ID)
- \`owner\` - Creator (username or ID)
- \`milestone\` - Sprint (name, ID, or special: active, closed, null, *)
- \`epic\` - Epic (ID, name, or special: null, *)
- \`blocked\` - Is blocked (true/false)
- \`closed\` - Is closed (true/false)
- \`due_date\` - Due date (date or special: past, upcoming, null)
- \`finish_date\` - Completion date
- \`attachments\` - Number of attachments
- \`comments\` - Number of comments
- \`tags\` - Tags (supports in:[] operator)
- \`created\` - Created time
- \`updated\` - Updated time

## Tasks Fields
- \`subject\` - Title
- \`description\` - Description
- \`status\` - Status (supports in:[] operator)
- \`assignee\` - Assignee (username or ID)
- \`owner\` - Creator (username or ID)
- \`user_story\` - Related user story (ID or ref, or special: null)
- \`milestone\` - Sprint (name, ID, or special: active, closed, null, *)
- \`blocked\` - Is blocked (true/false)
- \`closed\` - Is closed (true/false)
- \`due_date\` - Due date (date or special: past, upcoming, null)
- \`finish_date\` - Completion date
- \`attachments\` - Number of attachments
- \`comments\` - Number of comments
- \`tags\` - Tags (supports in:[] operator)
- \`created\` - Created time
- \`updated\` - Updated time

## Field Aliases (more intuitive names)
- \`sprint\` → \`milestone\`
- \`assigned\` → \`assignee\`
- \`created_by\` → \`owner\`
- \`is_blocked\` → \`blocked\`
- \`is_closed\` → \`closed\`
- \`has_attachments\` → \`attachments\` (use: has_attachments:true for attachments:>0)

## Field Compatibility Matrix
✅ = Supported, ❌ = Not supported

| Field | Issues | User Stories | Tasks |
|-------|--------|--------------|-------|
| milestone | ✅ | ✅ | ✅ |
| epic | ❌ | ✅ | ❌ |
| user_story | ❌ | ❌ | ✅ |
| points | ❌ | ✅ | ❌ |
| severity | ✅ | ❌ | ❌ |
| type | ✅ | ❌ | ❌ |
`;
}

/**
 * Get general help
 */
function getGeneralHelp() {
  return `
**Advanced Query Feature Overview**

Welcome to Taiga MCP Server's advanced query feature! This powerful search engine lets you precisely find project data using SQL-like syntax.

## Main Features
- **Precise Filtering**: Use multiple operators to filter data precisely
- **Logic Combination**: Combine complex conditions using AND/OR/NOT
- **Text Search**: Fuzzy matching and wildcard search
- **Sort & Limit**: Custom sorting and result count limiting
- **Time Queries**: Flexible date and time range queries

## Available Tools
- \`advancedSearch\` - Execute advanced queries
- \`queryHelp\` - Get syntax help
- \`validateQuery\` - Validate query syntax

## Quick Start
1. Use \`queryHelp syntax\` to learn basic syntax
2. Use \`queryHelp examples\` to view examples
3. Use \`validateQuery\` to validate your query
4. Use \`advancedSearch\` to execute search

Start your advanced query journey!
`;
}

/**
 * Register advanced search tools
 */
export function registerAdvancedSearchTools(server) {
  server.tool(advancedSearchTool.name, advancedSearchTool.schema, advancedSearchTool.handler);
  server.tool(queryHelpTool.name, queryHelpTool.schema, queryHelpTool.handler);
  server.tool(validateQueryTool.name, validateQueryTool.schema, validateQueryTool.handler);
}