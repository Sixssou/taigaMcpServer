/**
 * Enhanced User Resolution Utility
 * Resolves user identifiers to Taiga user IDs with multiple format support
 */

import { TaigaService } from './taigaService.js';

const taigaService = new TaigaService();

/**
 * Calculate Levenshtein distance between two strings (for fuzzy matching)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-100)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-100)
 */
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

/**
 * Resolve user identifier to user ID with comprehensive format support
 *
 * Supported formats:
 * - User ID (numeric)
 * - Username (exact match)
 * - Email address (exact match)
 * - Full name (exact or fuzzy match)
 *
 * @param {string|number} userIdentifier - User identifier (ID, username, email, or full name)
 * @param {string|number} projectId - Project ID (required for getting project members)
 * @param {Object} options - Resolution options
 * @param {boolean} options.fuzzyMatch - Enable fuzzy matching for names (default: true)
 * @param {number} options.fuzzyThreshold - Minimum similarity score for fuzzy match (default: 70)
 * @returns {Promise<Object>} - Resolved user object with detailed information
 * @throws {Error} - Detailed error with available users if resolution fails
 */
export async function resolveUser(userIdentifier, projectId, options = {}) {
  const { fuzzyMatch = true, fuzzyThreshold = 70 } = options;

  // Handle null/undefined/empty
  if (!userIdentifier) {
    throw new Error('User identifier cannot be null or empty');
  }

  // Convert to string for consistent handling
  const identifier = String(userIdentifier).trim();

  // Get project members
  const members = await taigaService.getProjectMembers(projectId);

  if (!members || members.length === 0) {
    throw new Error(`No members found in project ${projectId}`);
  }

  // Strategy 1: Try numeric ID match
  if (/^\d+$/.test(identifier)) {
    const userId = parseInt(identifier, 10);
    const member = members.find(m => m.user === userId || m.id === userId);
    if (member) {
      return formatUserResult(member, 'user_id');
    }
  }

  // Strategy 2: Try exact username match
  const usernameMatch = members.find(m => m.username === identifier);
  if (usernameMatch) {
    return formatUserResult(usernameMatch, 'username');
  }

  // Strategy 3: Try exact email match
  const emailMatch = members.find(m =>
    m.email === identifier || m.user_email === identifier
  );
  if (emailMatch) {
    return formatUserResult(emailMatch, 'email');
  }

  // Strategy 4: Try exact full name match (case-sensitive)
  const exactNameMatch = members.find(m =>
    m.full_name === identifier || m.full_name_display === identifier
  );
  if (exactNameMatch) {
    return formatUserResult(exactNameMatch, 'full_name_exact');
  }

  // Strategy 5: Try case-insensitive full name match
  const caseInsensitiveMatch = members.find(m =>
    m.full_name?.toLowerCase() === identifier.toLowerCase() ||
    m.full_name_display?.toLowerCase() === identifier.toLowerCase()
  );
  if (caseInsensitiveMatch) {
    return formatUserResult(caseInsensitiveMatch, 'full_name_case_insensitive');
  }

  // Strategy 6: Try fuzzy matching on full names
  if (fuzzyMatch) {
    const fuzzyMatches = members
      .map(m => ({
        member: m,
        score: Math.max(
          similarityScore(identifier, m.full_name || ''),
          similarityScore(identifier, m.full_name_display || ''),
          similarityScore(identifier, m.username || '')
        )
      }))
      .filter(match => match.score >= fuzzyThreshold)
      .sort((a, b) => b.score - a.score);

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];

      // If there are multiple similar matches, suggest them
      if (fuzzyMatches.length > 1 && fuzzyMatches[1].score >= fuzzyThreshold) {
        const suggestions = fuzzyMatches.slice(0, 3).map(m =>
          `  - ${m.member.full_name || m.member.username} (${m.member.user_email || m.member.email}) - Similarity: ${m.score}%`
        ).join('\n');

        throw new Error(
          `Multiple similar users found for "${identifier}". Please be more specific:\n${suggestions}\n\n` +
          formatAvailableUsers(members)
        );
      }

      return {
        ...formatUserResult(bestMatch.member, 'fuzzy_match'),
        matchScore: bestMatch.score,
        matchType: 'fuzzy'
      };
    }
  }

  // No match found - provide detailed error with all available users
  throw new Error(
    `User "${identifier}" not found in project.\n\n` +
    formatAvailableUsers(members) +
    `\n\nSupported formats:\n` +
    `  - User ID (numeric): e.g., "12345"\n` +
    `  - Username: e.g., "john.doe"\n` +
    `  - Email: e.g., "john@example.com"\n` +
    `  - Full name: e.g., "John Doe" (supports fuzzy matching)\n` +
    `  - Special: "unassign" or "none" to remove assignment`
  );
}

/**
 * Format user result object with complete information
 * @private
 */
function formatUserResult(member, matchType) {
  return {
    userId: member.user || member.id,
    username: member.username,
    fullName: member.full_name || member.full_name_display,
    email: member.email || member.user_email,
    role: member.role_name,
    isActive: member.is_active !== false,
    matchType: matchType,
    // Include raw member data for reference
    _raw: member
  };
}

/**
 * Format available users list for error messages
 * @private
 */
function formatAvailableUsers(members) {
  const activeMembers = members.filter(m => m.is_active !== false);
  const inactiveMembers = members.filter(m => m.is_active === false);

  let result = `Available project members (${activeMembers.length} active):\n`;

  activeMembers.forEach(m => {
    result += `  - ${m.full_name || m.username || 'Unknown'}\n`;
    result += `    Username: ${m.username || 'N/A'}\n`;
    result += `    Email: ${m.user_email || m.email || 'N/A'}\n`;
    result += `    User ID: ${m.user || m.id}\n`;
    if (m.role_name) {
      result += `    Role: ${m.role_name}\n`;
    }
    result += `\n`;
  });

  if (inactiveMembers.length > 0) {
    result += `\nInactive members (${inactiveMembers.length}):\n`;
    inactiveMembers.forEach(m => {
      result += `  - ${m.full_name || m.username} (${m.user_email || m.email})\n`;
    });
  }

  return result;
}

/**
 * Resolve multiple users at once (for batch operations)
 * @param {Array<string|number>} userIdentifiers - Array of user identifiers
 * @param {string|number} projectId - Project ID
 * @param {Object} options - Resolution options
 * @returns {Promise<Array>} - Array of resolved user objects with status
 */
export async function resolveUsers(userIdentifiers, projectId, options = {}) {
  const results = [];

  for (const identifier of userIdentifiers) {
    try {
      const user = await resolveUser(identifier, projectId, options);
      results.push({
        identifier,
        status: 'success',
        user
      });
    } catch (error) {
      results.push({
        identifier,
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get list of all project members with full details
 * Useful for displaying available users before assignment
 * @param {string|number} projectId - Project ID
 * @returns {Promise<Array>} - Array of formatted user objects
 */
export async function listProjectMembers(projectId) {
  const members = await taigaService.getProjectMembers(projectId);

  return members.map(m => formatUserResult(m, 'listed')).sort((a, b) => {
    // Sort by active status, then by full name
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return (a.fullName || '').localeCompare(b.fullName || '');
  });
}
