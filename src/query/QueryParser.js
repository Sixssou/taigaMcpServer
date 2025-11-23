/**
 * Advanced Query Syntax Parser
 * Advanced Query Parser for Taiga MCP Server
 */

import {
  OPERATORS,
  LOGIC_OPERATORS,
  SORT_DIRECTIONS,
  TIME_KEYWORDS,
  VALIDATION_RULES,
  FIELD_TYPES,
  FIELD_ALIASES,
  SPECIAL_VALUES
} from './queryGrammar.js';

export class QueryParser {
  constructor() {
    this.tokens = [];
    this.position = 0;
  }

  /**
   * Parse query string
   * @param {string} queryString - Query string
   * @param {string} type - Data type (ISSUE, USER_STORY, TASK)
   * @returns {Object} Parsed query object
   */
  parse(queryString, type = 'ISSUE') {
    if (!queryString || typeof queryString !== 'string') {
      throw new Error('Query string cannot be empty');
    }

    this.tokens = this.tokenize(queryString);
    this.position = 0;
    this.dataType = type;

    const query = {
      filters: [],
      logic: 'AND',
      orderBy: null,
      limit: null,
      groupBy: null,
      type: type
    };

    try {
      this.parseExpression(query);
      return query;
    } catch (error) {
      throw new Error(`Query parsing error: ${error.message}`);
    }
  }

  /**
   * Tokenizer - Break query string into tokens
   */
  tokenize(queryString) {
    const tokens = [];
    // Enhanced regex to handle in:[], between:[], and other new operators
    const regex = /([A-Za-z_][A-Za-z0-9_]*):([><=!~]*)([a-zA-Z_]+)?:?(\[[^\]]+\]|[^:\s()]+|\([^)]+\)|"[^"]*")|(\bAND\b|\bOR\b|\bNOT\b|\bORDER\s+BY\b|\bLIMIT\b|\bGROUP\s+BY\b)|([()])|(\S+)/gi;

    let match;
    while ((match = regex.exec(queryString)) !== null) {
      if (match[1]) {
        // Field query: field:operator:value or field:value
        const field = match[1].toLowerCase();
        let operator = match[2] || '';
        let operatorName = match[3] ? match[3].toLowerCase() : '';
        let value = match[4] || match[3];

        // Handle special operators like in:[], between:[], empty, notempty
        if (operatorName === 'in' || operatorName === 'between') {
          operator = operatorName;
          value = match[4];
        } else if (operatorName === 'empty' || operatorName === 'notempty') {
          operator = operatorName;
          value = true;
        } else if (operatorName && !match[4]) {
          // Single word after colon (could be a value)
          value = operatorName;
          operator = operator || '=';
        }

        tokens.push({
          type: 'FIELD_QUERY',
          field: field,
          operator: operator || '=',
          value: this.parseValue(value)
        });
      } else if (match[5]) {
        // Logical operators or keywords
        const keyword = match[5].toUpperCase().replace(/\s+/g, '_');
        if (keyword === 'ORDER_BY') {
          tokens.push({ type: 'ORDER_BY' });
        } else if (keyword === 'GROUP_BY') {
          tokens.push({ type: 'GROUP_BY' });
        } else if (keyword === 'LIMIT') {
          tokens.push({ type: 'LIMIT' });
        } else {
          tokens.push({ type: 'LOGIC', operator: keyword });
        }
      } else if (match[6]) {
        // Parentheses
        tokens.push({ type: 'PAREN', value: match[6] });
      } else if (match[7]) {
        // Other tokens
        tokens.push({ type: 'VALUE', value: match[7] });
      }
    }

    return tokens;
  }

  /**
   * Parse value and handle special formats
   */
  parseValue(valueString) {
    if (!valueString || valueString === true) {
      return valueString;
    }

    // Remove quotes
    if ((valueString.startsWith('"') && valueString.endsWith('"')) ||
        (valueString.startsWith("'") && valueString.endsWith("'"))) {
      return valueString.slice(1, -1);
    }

    // Handle arrays in brackets [item1,item2,item3] for in:[] and between:[]
    if (valueString.startsWith('[') && valueString.endsWith(']')) {
      const arrayContent = valueString.slice(1, -1);
      return arrayContent.split(',').map(item => {
        const trimmed = item.trim();
        // Remove quotes if present
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
    }

    // Handle arrays in parentheses (item1,item2,item3) - legacy support
    if (valueString.startsWith('(') && valueString.endsWith(')')) {
      const arrayContent = valueString.slice(1, -1);
      return arrayContent.split(',').map(item => item.trim());
    }

    // Handle range query 3..8
    if (valueString.includes('..')) {
      const [start, end] = valueString.split('..');
      return { range: [this.parseNumericValue(start), this.parseNumericValue(end)] };
    }

    // Handle numeric values
    if (!isNaN(valueString)) {
      return this.parseNumericValue(valueString);
    }

    // Handle time keywords
    if (TIME_KEYWORDS[valueString]) {
      return TIME_KEYWORDS[valueString]();
    }

    // Handle relative time <7d, >30d
    const timeMatch = valueString.match(/^([<>]=?)(\d+)([dwmy])$/);
    if (timeMatch) {
      const operator = timeMatch[1];
      const value = parseInt(timeMatch[2]);
      const unit = timeMatch[3];

      let milliseconds;
      switch (unit) {
        case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
        case 'w': milliseconds = value * 7 * 24 * 60 * 60 * 1000; break;
        case 'm': milliseconds = value * 30 * 24 * 60 * 60 * 1000; break;
        case 'y': milliseconds = value * 365 * 24 * 60 * 60 * 1000; break;
      }

      const targetDate = new Date(Date.now() - milliseconds);
      return { relativeTime: operator, date: targetDate };
    }

    return valueString;
  }

  /**
   * Parse numeric value
   */
  parseNumericValue(value) {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }

  /**
   * Parse expression
   */
  parseExpression(query) {
    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];

      switch (token.type) {
        case 'FIELD_QUERY':
          this.parseFieldQuery(query, token);
          break;
        case 'LOGIC':
          this.parseLogicOperator(query, token);
          break;
        case 'ORDER_BY':
          this.parseOrderBy(query);
          break;
        case 'LIMIT':
          this.parseLimit(query);
          break;
        case 'GROUP_BY':
          this.parseGroupBy(query);
          break;
        case 'PAREN':
          this.parseParentheses(query, token);
          break;
        default:
          this.position++;
          break;
      }
    }
  }

  /**
   * Parse field query
   */
  parseFieldQuery(query, token) {
    let { field, operator, value } = token;

    // Resolve field aliases
    if (FIELD_ALIASES[field]) {
      field = FIELD_ALIASES[field];
    }

    // Validate field
    if (!VALIDATION_RULES.isValidField(field, this.dataType)) {
      throw new Error(`Invalid field '${field}' for type ${this.dataType}. Use queryHelp for valid fields.`);
    }

    // Normalize operator
    let normalizedOperator = this.normalizeOperator(operator);

    // Validate operator
    if (!VALIDATION_RULES.isValidOperator(normalizedOperator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    // Validate value (skip for empty/notempty operators)
    if (normalizedOperator !== OPERATORS.EMPTY && normalizedOperator !== OPERATORS.NOT_EMPTY) {
      if (!VALIDATION_RULES.isValidValue(field, value, this.dataType)) {
        console.warn(`Value for field ${field} may be invalid: ${value}`);
      }
    }

    query.filters.push({
      field,
      operator: normalizedOperator,
      value,
      originalOperator: operator
    });

    this.position++;
  }

  /**
   * Normalize operator
   */
  normalizeOperator(operator) {
    switch (operator) {
      case '':
      case '=':
        return OPERATORS.EQUAL;
      case '!=':
        return OPERATORS.NOT_EQUAL;
      case '>':
        return OPERATORS.GREATER_THAN;
      case '>=':
        return OPERATORS.GREATER_EQUAL;
      case '<':
        return OPERATORS.LESS_THAN;
      case '<=':
        return OPERATORS.LESS_EQUAL;
      case '~':
        return OPERATORS.FUZZY;
      case 'in':
        return OPERATORS.IN;
      case 'between':
        return OPERATORS.BETWEEN;
      case 'empty':
        return OPERATORS.EMPTY;
      case 'notempty':
        return OPERATORS.NOT_EMPTY;
      case 'contains':
        return OPERATORS.CONTAINS;
      default:
        return operator;
    }
  }

  /**
   * Parse logical operator
   */
  parseLogicOperator(query, token) {
    if (token.operator === 'AND' || token.operator === 'OR') {
      query.logic = token.operator;
    }
    this.position++;
  }

  /**
   * Parse ORDER BY clause
   */
  parseOrderBy(query) {
    this.position++; // Skip ORDER BY

    if (this.position < this.tokens.length) {
      const fieldToken = this.tokens[this.position];
      const field = fieldToken.value || fieldToken.field;

      let direction = SORT_DIRECTIONS.ASC;
      if (this.position + 1 < this.tokens.length) {
        const directionToken = this.tokens[this.position + 1];
        if (directionToken.value &&
            (directionToken.value.toUpperCase() === 'DESC' ||
             directionToken.value.toUpperCase() === 'ASC')) {
          direction = directionToken.value.toUpperCase();
          this.position++;
        }
      }

      query.orderBy = { field, direction };
      this.position++;
    }
  }

  /**
   * Parse LIMIT clause
   */
  parseLimit(query) {
    this.position++; // Skip LIMIT

    if (this.position < this.tokens.length) {
      const limitToken = this.tokens[this.position];
      const limit = parseInt(limitToken.value);

      if (!isNaN(limit) && limit > 0) {
        query.limit = limit;
      }

      this.position++;
    }
  }

  /**
   * Parse GROUP BY clause
   */
  parseGroupBy(query) {
    this.position++; // Skip GROUP BY

    if (this.position < this.tokens.length) {
      const fieldToken = this.tokens[this.position];
      query.groupBy = fieldToken.value || fieldToken.field;
      this.position++;
    }
  }

  /**
   * Parse parentheses (for logical grouping)
   */
  parseParentheses(query, token) {
    // Simplified handling, temporarily skip parentheses
    // Full implementation needs to handle nested logical expressions
    this.position++;
  }

  /**
   * Validate query object
   */
  validateQuery(query) {
    if (!query.filters || query.filters.length === 0) {
      throw new Error('Query must contain at least one filter condition');
    }

    // Validate each filter condition
    for (const filter of query.filters) {
      if (!filter.field || !filter.operator) {
        throw new Error('Filter condition must contain field and operator');
      }
    }

    return true;
  }

  /**
   * Get query statistics
   */
  getQueryStats(query) {
    return {
      filterCount: query.filters.length,
      hasOrderBy: !!query.orderBy,
      hasLimit: !!query.limit,
      hasGroupBy: !!query.groupBy,
      complexity: this.calculateComplexity(query)
    };
  }

  /**
   * Calculate query complexity
   */
  calculateComplexity(query) {
    let complexity = query.filters.length;

    if (query.orderBy) complexity += 1;
    if (query.limit) complexity += 0.5;
    if (query.groupBy) complexity += 2;

    return Math.round(complexity * 10) / 10;
  }
}

export default QueryParser;