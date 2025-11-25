/**
 * Query Executor
 * Query Executor for Advanced Search
 */

import { OPERATORS, TIME_KEYWORDS, SPECIAL_VALUES } from './queryGrammar.js';

export class QueryExecutor {
  constructor(taigaService) {
    this.taigaService = taigaService;
  }

  /**
   * Execute query
   * @param {Object} query - Parsed query object
   * @param {string} projectId - Project ID
   * @returns {Array} Filtered results
   */
  async execute(query, projectId) {
    try {
      // Fetch data based on query type
      let data = await this.fetchData(query.type, projectId);

      // Apply filters
      if (query.filters && query.filters.length > 0) {
        data = this.applyFilters(data, query.filters, query.logic);
      }

      // Apply sorting
      if (query.orderBy) {
        data = this.applySorting(data, query.orderBy);
      }

      // Apply grouping
      if (query.groupBy) {
        data = this.applyGrouping(data, query.groupBy);
      }

      // Apply limit
      if (query.limit) {
        data = data.slice(0, query.limit);
      }

      return {
        results: data,
        total: data.length,
        query: query,
        executionTime: Date.now()
      };

    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Fetch data based on type
   */
  async fetchData(type, projectId) {
    switch (type) {
      case 'ISSUE':
        return await this.taigaService.listIssues(projectId);
      case 'USER_STORY':
        return await this.taigaService.listUserStories(projectId);
      case 'TASK':
        // Fetch all tasks (need to iterate through user stories)
        return await this.fetchAllTasks(projectId);
      default:
        throw new Error(`Unsupported data type: ${type}`);
    }
  }

  /**
   * Fetch all tasks
   */
  async fetchAllTasks(projectId) {
    const userStories = await this.taigaService.listUserStories(projectId);
    const allTasks = [];

    for (const story of userStories) {
      try {
        const tasks = await this.taigaService.listTasks(story.id);
        allTasks.push(...tasks);
      } catch (error) {
        console.warn(`Unable to fetch tasks for user story ${story.id}:`, error.message);
      }
    }

    return allTasks;
  }

  /**
   * Apply filters
   */
  applyFilters(data, filters, logic = 'AND') {
    return data.filter(item => {
      if (logic === 'OR') {
        return filters.some(filter => this.evaluateFilter(item, filter));
      } else {
        return filters.every(filter => this.evaluateFilter(item, filter));
      }
    });
  }

  /**
   * Evaluate single filter condition
   */
  evaluateFilter(item, filter) {
    const { field, operator, value } = filter;
    const itemValue = this.getFieldValue(item, field);

    // Handle special field values before comparing
    if (this.isSpecialFieldValue(field, value)) {
      return this.evaluateSpecialFieldValue(item, field, value);
    }

    switch (operator) {
      case OPERATORS.EQUAL:
        return this.compareEqual(itemValue, value);

      case OPERATORS.NOT_EQUAL:
        return !this.compareEqual(itemValue, value);

      case OPERATORS.GREATER_THAN:
        return this.compareGreater(itemValue, value, false);

      case OPERATORS.GREATER_EQUAL:
        return this.compareGreater(itemValue, value, true);

      case OPERATORS.LESS_THAN:
        return this.compareLess(itemValue, value, false);

      case OPERATORS.LESS_EQUAL:
        return this.compareLess(itemValue, value, true);

      case OPERATORS.CONTAINS:
        return this.compareContains(itemValue, value);

      case OPERATORS.STARTS_WITH:
        return this.compareStartsWith(itemValue, value);

      case OPERATORS.ENDS_WITH:
        return this.compareEndsWith(itemValue, value);

      case OPERATORS.FUZZY:
        return this.compareFuzzy(itemValue, value);

      case OPERATORS.IN:
        return this.compareIn(itemValue, value);

      case OPERATORS.NOT_IN:
        return !this.compareIn(itemValue, value);

      case OPERATORS.BETWEEN:
        return this.compareBetween(itemValue, value);

      case OPERATORS.EXISTS:
        return itemValue !== null && itemValue !== undefined;

      case OPERATORS.NULL:
        return itemValue === null || itemValue === undefined;

      case OPERATORS.EMPTY:
        return this.isEmpty(itemValue);

      case OPERATORS.NOT_EMPTY:
        return !this.isEmpty(itemValue);

      default:
        console.warn(`Unsupported operator: ${operator}`);
        return true;
    }
  }

  /**
   * Get field value
   */
  getFieldValue(item, field) {
    // Handle special field mappings for Taiga API structure
    switch (field) {
      case 'milestone':
        // Return milestone slug for string matching, or ID for numeric matching
        // Priority: slug (for names like S47-S48), then ID, then extra_info
        if (item.milestone_slug) return item.milestone_slug;
        if (item.milestone_extra_info?.slug) return item.milestone_extra_info.slug;
        if (item.milestone_extra_info?.name) return item.milestone_extra_info.name;
        if (item.milestone_id) return item.milestone_id;
        if (item.milestone) return item.milestone;
        return null;

      case 'epic':
        // Return epic ID for matching
        if (item.epic_id) return item.epic_id;
        if (item.epic_extra_info?.id) return item.epic_extra_info.id;
        if (item.epic) return item.epic;
        return null;

      case 'user_story':
        // For tasks, get the associated user story ID or ref
        if (item.user_story_id) return item.user_story_id;
        if (item.user_story_extra_info?.id) return item.user_story_extra_info.id;
        if (item.user_story) return item.user_story;
        return null;

      case 'assignee':
        // Return username for string matching, ID for numeric matching
        // Priority: username, then ID
        if (item.assigned_to_extra_info?.username) return item.assigned_to_extra_info.username;
        if (item.assigned_to_extra_info?.id) return item.assigned_to_extra_info.id;
        if (item.assigned_to) return item.assigned_to;
        return null;

      case 'owner':
        // Return username for string matching, ID for numeric matching
        if (item.owner_extra_info?.username) return item.owner_extra_info.username;
        if (item.owner_extra_info?.id) return item.owner_extra_info.id;
        if (item.owner) return item.owner;
        return null;

      case 'blocked':
        return item.is_blocked === true;

      case 'closed':
        return item.is_closed === true;

      case 'due_date':
        return item.due_date || null;

      case 'finish_date':
        return item.finish_date || null;

      case 'attachments':
        return item.attachments?.length || 0;

      case 'comments':
        return item.total_comments || 0;

      case 'status':
        // Return status name for string matching, ID for numeric matching
        if (item.status_extra_info?.name) return item.status_extra_info.name;
        if (item.status_extra_info?.id) return item.status_extra_info.id;
        if (item.status) return item.status;
        return null;

      case 'priority':
        // Return priority name for string matching, ID for numeric matching
        if (item.priority_extra_info?.name) return item.priority_extra_info.name;
        if (item.priority_extra_info?.id) return item.priority_extra_info.id;
        if (item.priority) return item.priority;
        return null;

      case 'created':
        return item.created_date || null;

      case 'updated':
        return item.modified_date || null;

      default:
        // Handle nested field access
        const fieldPath = field.split('.');
        let value = item;

        for (const path of fieldPath) {
          if (value && typeof value === 'object') {
            value = value[path];
          } else {
            return undefined;
          }
        }

        return value;
    }
  }

  /**
   * Check if field has special value
   */
  isSpecialFieldValue(field, value) {
    if (typeof value !== 'string') return false;

    const specialValues = SPECIAL_VALUES[field];
    return specialValues && specialValues.includes(value);
  }

  /**
   * Evaluate special field values
   */
  evaluateSpecialFieldValue(item, field, value) {
    const itemValue = this.getFieldValue(item, field);

    switch (field) {
      case 'milestone':
        if (value === 'null') return itemValue === null;
        if (value === '*') return itemValue !== null;
        if (value === 'active') {
          // Need to check milestone status - would require API call
          // For now, treat as having a milestone assigned
          return itemValue !== null;
        }
        if (value === 'closed') {
          // Need to check milestone status - would require API call
          return itemValue !== null;
        }
        break;

      case 'due_date':
        if (value === 'null') return itemValue === null;
        if (value === 'past') {
          // Due date is in the past AND item is not closed
          if (!itemValue) return false;
          const dueDate = this.toDate(itemValue);
          const isClosed = item.is_closed || false;
          return dueDate && dueDate < new Date() && !isClosed;
        }
        if (value === 'upcoming') {
          // Due date within the next 7 days
          if (!itemValue) return false;
          const dueDate = this.toDate(itemValue);
          const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return dueDate && dueDate <= sevenDaysFromNow && dueDate >= new Date();
        }
        break;

      case 'epic':
        if (value === 'null') return itemValue === null;
        if (value === '*') return itemValue !== null;
        break;

      case 'user_story':
        if (value === 'null') return itemValue === null;
        break;

      case 'blocked':
      case 'closed':
        if (value === 'true') return itemValue === true;
        if (value === 'false') return itemValue === false;
        break;
    }

    return false;
  }

  /**
   * Between comparison (for ranges)
   */
  compareBetween(itemValue, queryValue) {
    if (!Array.isArray(queryValue) || queryValue.length !== 2) {
      console.warn('BETWEEN operator requires array with 2 values');
      return false;
    }

    const [start, end] = queryValue;

    // Numeric comparison
    const numericItem = this.toNumeric(itemValue);
    const numericStart = this.toNumeric(start);
    const numericEnd = this.toNumeric(end);

    if (numericItem !== null && numericStart !== null && numericEnd !== null) {
      return numericItem >= numericStart && numericItem <= numericEnd;
    }

    // Date comparison
    const dateItem = this.toDate(itemValue);
    const dateStart = this.toDate(start);
    const dateEnd = this.toDate(end);

    if (dateItem && dateStart && dateEnd) {
      return dateItem >= dateStart && dateItem <= dateEnd;
    }

    return false;
  }

  /**
   * Equality comparison
   */
  compareEqual(itemValue, queryValue) {
    if (itemValue === null || itemValue === undefined) {
      return queryValue === null || queryValue === 'null';
    }

    // Handle numeric comparisons (also handles string numbers)
    const numericItem = this.toNumeric(itemValue);
    const numericQuery = this.toNumeric(queryValue);
    if (numericItem !== null && numericQuery !== null) {
      return numericItem === numericQuery;
    }

    // String comparison (case-insensitive and trimmed)
    if (typeof itemValue === 'string' || typeof queryValue === 'string') {
      const itemStr = String(itemValue).trim().toLowerCase();
      const queryStr = String(queryValue).trim().toLowerCase();
      return itemStr === queryStr;
    }

    // Boolean comparison
    if (typeof itemValue === 'boolean') {
      if (queryValue === 'true') return itemValue === true;
      if (queryValue === 'false') return itemValue === false;
      return itemValue === queryValue;
    }

    return itemValue === queryValue;
  }

  /**
   * Greater than comparison
   */
  compareGreater(itemValue, queryValue, orEqual = false) {
    const numericItem = this.toNumeric(itemValue);
    const numericQuery = this.toNumeric(queryValue);

    if (numericItem !== null && numericQuery !== null) {
      return orEqual ? numericItem >= numericQuery : numericItem > numericQuery;
    }

    // Date comparison
    const dateItem = this.toDate(itemValue);
    const dateQuery = this.toDate(queryValue);

    if (dateItem && dateQuery) {
      return orEqual ? dateItem >= dateQuery : dateItem > dateQuery;
    }

    // String comparison
    return orEqual ? itemValue >= queryValue : itemValue > queryValue;
  }

  /**
   * Less than comparison
   */
  compareLess(itemValue, queryValue, orEqual = false) {
    const numericItem = this.toNumeric(itemValue);
    const numericQuery = this.toNumeric(queryValue);

    if (numericItem !== null && numericQuery !== null) {
      return orEqual ? numericItem <= numericQuery : numericItem < numericQuery;
    }

    // Date comparison
    const dateItem = this.toDate(itemValue);
    const dateQuery = this.toDate(queryValue);

    if (dateItem && dateQuery) {
      return orEqual ? dateItem <= dateQuery : dateItem < dateQuery;
    }

    // String comparison
    return orEqual ? itemValue <= queryValue : itemValue < queryValue;
  }

  /**
   * Contains comparison
   */
  compareContains(itemValue, queryValue) {
    if (!itemValue || !queryValue) return false;

    const itemStr = String(itemValue).toLowerCase();
    const queryStr = String(queryValue).toLowerCase();

    return itemStr.includes(queryStr);
  }

  /**
   * Starts with match
   */
  compareStartsWith(itemValue, queryValue) {
    if (!itemValue || !queryValue) return false;

    const itemStr = String(itemValue).toLowerCase();
    const queryStr = String(queryValue).toLowerCase();

    return itemStr.startsWith(queryStr);
  }

  /**
   * Ends with match
   */
  compareEndsWith(itemValue, queryValue) {
    if (!itemValue || !queryValue) return false;

    const itemStr = String(itemValue).toLowerCase();
    const queryStr = String(queryValue).toLowerCase();

    return itemStr.endsWith(queryStr);
  }

  /**
   * Fuzzy match
   */
  compareFuzzy(itemValue, queryValue) {
    if (!itemValue || !queryValue) return false;

    const itemStr = String(itemValue).toLowerCase();
    const queryStr = String(queryValue).toLowerCase();

    // Simple fuzzy match implementation
    const words = queryStr.split(/\s+/);
    return words.every(word => itemStr.includes(word));
  }

  /**
   * Contained in array
   */
  compareIn(itemValue, queryValue) {
    if (!Array.isArray(queryValue)) return false;

    if (Array.isArray(itemValue)) {
      // For arrays (like tags), check if any item value is in the query array
      return itemValue.some(item =>
        queryValue.some(qv =>
          String(item).toLowerCase() === String(qv).toLowerCase()
        )
      );
    }

    // For single values, check if it matches any query value (case-insensitive)
    return queryValue.some(qv => {
      if (itemValue === null || itemValue === undefined) {
        return qv === 'null' || qv === null;
      }
      return String(itemValue).toLowerCase() === String(qv).toLowerCase();
    });
  }

  /**
   * Check if empty
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Convert to numeric
   */
  toNumeric(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Convert to date
   */
  toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    return null;
  }

  /**
   * Apply sorting
   */
  applySorting(data, orderBy) {
    const { field, direction } = orderBy;

    return data.sort((a, b) => {
      const valueA = this.getFieldValue(a, field);
      const valueB = this.getFieldValue(b, field);

      let comparison = 0;

      // Handle null/undefined values
      if (valueA === null || valueA === undefined) {
        comparison = valueB === null || valueB === undefined ? 0 : -1;
      } else if (valueB === null || valueB === undefined) {
        comparison = 1;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA).localeCompare(String(valueB));
      }

      return direction === 'DESC' ? -comparison : comparison;
    });
  }

  /**
   * Apply grouping
   */
  applyGrouping(data, groupByField) {
    const grouped = {};

    data.forEach(item => {
      const groupValue = this.getFieldValue(item, groupByField) || 'undefined';
      const groupKey = String(groupValue);

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }

      grouped[groupKey].push(item);
    });

    // Convert to array format with statistics
    return Object.entries(grouped).map(([key, items]) => ({
      groupValue: key,
      count: items.length,
      items: items
    }));
  }

  /**
   * Get query execution statistics
   */
  getExecutionStats(startTime, endTime, originalCount, filteredCount) {
    return {
      executionTime: endTime - startTime,
      originalCount,
      filteredCount,
      reductionPercentage: Math.round((1 - filteredCount / originalCount) * 100)
    };
  }
}

export default QueryExecutor;