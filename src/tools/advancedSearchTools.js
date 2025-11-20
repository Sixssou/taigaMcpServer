/**
 * 高級搜索MCP工具
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
 * 高級搜索工具
 */
export const advancedSearchTool = {
  name: 'advancedSearch',
  schema: {
    projectIdentifier: z.string().describe('Project ID, slug, or name'),
    query: z.string().describe('Advanced search query using special syntax'),
    type: z.enum(['issues', 'user_stories', 'tasks']).optional().default('issues').describe('Type of items to search')
  },
  handler: async ({ projectIdentifier, query, type = 'issues' }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const parser = new QueryParser();
      const executor = new QueryExecutor(taigaService);
      
      // 映射類型
      const dataType = type === 'issues' ? 'ISSUE' : 
                       type === 'user_stories' ? 'USER_STORY' : 'TASK';
      
      // 解析查詢
      const parsedQuery = parser.parse(query, dataType);
      
      // 執行查詢
      const startTime = Date.now();
      const result = await executor.execute(parsedQuery, projectId);
      const endTime = Date.now();
      
      // 格式化結果
      const formattedResults = formatAdvancedSearchResults(
        result.results, 
        type, 
        query, 
        endTime - startTime
      );
      
      return createSuccessResponse(formattedResults);
      
    } catch (error) {
      if (error.message.includes('查詢解析錯誤') || error.message.includes('查詢執行失敗')) {
        return createErrorResponse(`${error.message}\n\n💡 查詢語法示例:\n${getQueryExamples()}`);
      }
      return createErrorResponse(`${ERROR_MESSAGES.FAILED_TO_LIST_ISSUES}: ${error.message}`);
    }
  }
};

/**
 * 查詢語法幫助工具
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
      return createErrorResponse(`無法獲取幫助信息: ${error.message}`);
    }
  }
};

/**
 * 查詢語法驗證工具
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
      
      // 解析查詢（這會驗證語法）
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
 * 格式化高級搜索結果
 */
function formatAdvancedSearchResults(results, type, query, executionTime) {
  if (!results || results.length === 0) {
    return `**Advanced Search Results**\n\nQuery: \`${query}\`\nType: ${type}\n\nNo matching results found`;
  }

  let output = `**Advanced Search Results**\n\n`;
  output += `Query: \`${query}\`\n`;
  output += `Type: ${type}\n`;
  output += `Execution Time: ${executionTime}ms\n`;
  output += `Found ${results.length} results\n\n`;
  
  // 根據類型格式化結果
  results.forEach((item, index) => {
    output += formatSearchItem(item, type, index + 1);
    output += '\n';
  });
  
  // 如果結果太多，提示使用限制
  if (results.length > 20) {
    output += `\nTip: Many results found. Consider using LIMIT clause to restrict result count, e.g.: \`${query} LIMIT 10\``;
  }
  
  return output;
}

/**
 * 格式化單個搜索結果項
 */
function formatSearchItem(item, type, index) {
  const ref = getSafeValue(item, 'ref', index);
  const subject = getSafeValue(item, 'subject', '無標題');
  const status = getSafeValue(item, 'status_extra_info.name', item.status || '未知');
  const created = formatDateTime(item.created_date);
  
  let output = `**${index}. #${ref}: ${subject}**\n`;
  output += `   Status: ${status}\n`;

  if (type === 'issues') {
    const priority = getSafeValue(item, 'priority_extra_info.name', item.priority || 'Normal');
    const type_name = getSafeValue(item, 'type_extra_info.name', item.type || 'Issue');
    const assignee = getSafeValue(item, 'assigned_to_extra_info.full_name', 'Unassigned');

    output += `   Type: ${type_name} | Priority: ${priority}\n`;
    output += `   Assignee: ${assignee}\n`;
  } else if (type === 'user_stories') {
    const points = getSafeValue(item, 'total_points', 0);
    const assignee = getSafeValue(item, 'assigned_to_extra_info.full_name', 'Unassigned');

    output += `   Points: ${points} | Assignee: ${assignee}\n`;
  } else if (type === 'tasks') {
    const assignee = getSafeValue(item, 'assigned_to_extra_info.full_name', 'Unassigned');
    const userStory = getSafeValue(item, 'user_story_extra_info.subject', 'No related story');

    output += `   Assignee: ${assignee}\n`;
    output += `   User Story: ${userStory}\n`;
  }

  output += `   Created: ${created}`;
  
  return output;
}

/**
 * 獲取查詢示例
 */
function getQueryExamples() {
  return `
基礎查詢:
- status:open
- priority:high  
- assignee:john

比較查詢:
- points:>=5
- created:>2024-01-01
- updated:<7d

文本搜索:
- subject:contains:"登入"
- description:*API*
- tags:frontend

邏輯組合:
- status:open AND priority:high
- type:bug OR type:feature
- NOT status:closed
`;
}

/**
 * 獲取查詢語法幫助
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
 * 獲取操作符幫助
 */
function getOperatorsHelp() {
  return `
**Query Operators Detailed**

## Comparison Operators
- \`field:value\` - Equals
- \`field:!=value\` - Not equals
- \`field:>value\` - Greater than
- \`field:>=value\` - Greater than or equal
- \`field:<value\` - Less than
- \`field:<=value\` - Less than or equal

## Text Operators
- \`field:contains:"text"\` - Contains text
- \`field:~"text"\` - Fuzzy match
- \`field:*text*\` - Wildcard match

## Special Operators
- \`field:null\` - Field is null
- \`field:exists\` - Field exists
- \`field:empty\` - Field is empty

## Range Queries
- \`points:3..8\` - Points between 3 and 8
- \`created:2024-01-01..2024-12-31\` - Date range
`;
}

/**
 * 獲取查詢示例幫助
 */
function getQueryExamplesHelp() {
  return `
**Query Examples Collection**

## Issues Queries
\`\`\`
status:open AND priority:high
type:bug AND assignee:john
created:>7d AND NOT status:closed
priority:urgent OR severity:critical
\`\`\`

## User Stories Queries
\`\`\`
points:>=5 AND status:in-progress
assignee:team-lead AND points:3..8
milestone:"Sprint 3" AND status:!=done
\`\`\`

## Tasks Queries
\`\`\`
assignee:developer AND status:open
user_story:contains:"API" ORDER BY created DESC
status:in-progress LIMIT 5
\`\`\`

## Complex Queries
\`\`\`
(status:open OR status:in-progress) AND priority:high AND updated:this_week
assignee:john AND (type:bug OR priority:urgent) ORDER BY created ASC LIMIT 10
\`\`\`
`;
}

/**
 * 獲取字段幫助  
 */
function getFieldsHelp() {
  return `
**Queryable Fields List**

## Issues Fields
- \`subject\` - Title
- \`description\` - Description
- \`status\` - Status
- \`priority\` - Priority
- \`type\` - Type
- \`assignee\` - Assignee
- \`tags\` - Tags
- \`created\` - Created time
- \`updated\` - Updated time

## User Stories Fields
- \`subject\` - Title
- \`status\` - Status
- \`points\` - Story points
- \`assignee\` - Assignee
- \`milestone\` - Milestone
- \`tags\` - Tags

## Tasks Fields
- \`subject\` - Title
- \`status\` - Status
- \`assignee\` - Assignee
- \`user_story\` - Related user story
- \`tags\` - Tags
`;
}

/**
 * 獲取通用幫助
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
 * 註冊高級搜索工具
 */
export function registerAdvancedSearchTools(server) {
  server.tool(advancedSearchTool.name, advancedSearchTool.schema, advancedSearchTool.handler);
  server.tool(queryHelpTool.name, queryHelpTool.schema, queryHelpTool.handler);
  server.tool(validateQueryTool.name, validateQueryTool.schema, validateQueryTool.handler);
}