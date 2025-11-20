/**
 * Query Executor
 * Query Executor for Advanced Search
 */

import { OPERATORS, TIME_KEYWORDS } from './queryGrammar.js';

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

      case OPERATORS.EXISTS:
        return itemValue !== null && itemValue !== undefined;

      case OPERATORS.NULL:
        return itemValue === null || itemValue === undefined;

      case OPERATORS.EMPTY:
        return this.isEmpty(itemValue);

      default:
        console.warn(`Unsupported operator: ${operator}`);
        return true;
    }
  }

  /**
   * Get field value
   */
  getFieldValue(item, field) {
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

  /**
   * Equality comparison
   */
  compareEqual(itemValue, queryValue) {
    if (itemValue === null || itemValue === undefined) {
      return queryValue === null || queryValue === 'null';
    }

    // String comparison (case-insensitive)
    if (typeof itemValue === 'string' && typeof queryValue === 'string') {
      return itemValue.toLowerCase() === queryValue.toLowerCase();
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
      return itemValue.some(item => queryValue.includes(item));
    }

    return queryValue.includes(itemValue);
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