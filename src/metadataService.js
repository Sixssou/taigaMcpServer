/**
 * Project Metadata Discovery Service
 * Provides consolidated access to project metadata with caching
 */

import { TaigaService } from './taigaService.js';
import { resolveProjectId } from './utils.js';

const taigaService = new TaigaService();

// Cache for metadata (expires after 5 minutes)
const metadataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Clear metadata cache for a specific project or all projects
 * @param {string|number} projectId - Project ID (optional, clears all if not provided)
 */
export function clearMetadataCache(projectId = null) {
  if (projectId) {
    metadataCache.delete(String(projectId));
  } else {
    metadataCache.clear();
  }
}

/**
 * Get cached metadata or fetch if expired/missing
 * @private
 */
async function getCachedOrFetch(projectId, key, fetchFunction) {
  const cacheKey = `${projectId}:${key}`;
  const cached = metadataCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFunction();
  metadataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}

/**
 * Get complete project metadata in a single call
 * Includes: statuses, priorities, severities, types, members, milestones
 *
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @param {boolean} options.useCache - Use cached data if available (default: true)
 * @param {Array<string>} options.include - Specific metadata types to include (default: all)
 * @returns {Promise<Object>} - Complete project metadata
 */
export async function getProjectMetadata(projectIdentifier, options = {}) {
  const { useCache = true, include = null } = options;

  // Clear cache if requested
  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  // Define all metadata types
  const metadataTypes = {
    project: () => taigaService.getProject(projectId),
    userStoryStatuses: () => taigaService.getUserStoryStatuses(projectId),
    taskStatuses: () => taigaService.getTaskStatuses(projectId),
    issueStatuses: () => taigaService.getIssueStatuses(projectId),
    priorities: () => taigaService.getIssuePriorities(projectId),
    severities: () => taigaService.getIssueSeverities(projectId),
    issueTypes: () => taigaService.getIssueTypes(projectId),
    members: () => taigaService.getProjectMembers(projectId),
    milestones: () => taigaService.listMilestones(projectId)
  };

  // Filter types if include array is provided
  const typesToFetch = include
    ? Object.keys(metadataTypes).filter(key => include.includes(key))
    : Object.keys(metadataTypes);

  // Fetch all metadata in parallel
  const metadata = {};
  const fetchPromises = typesToFetch.map(async (key) => {
    try {
      metadata[key] = await getCachedOrFetch(
        projectId,
        key,
        metadataTypes[key]
      );
    } catch (error) {
      console.error(`Failed to fetch ${key} metadata:`, error.message);
      metadata[key] = null;
    }
  });

  await Promise.all(fetchPromises);

  // Add enriched summary
  metadata.summary = {
    projectId,
    projectName: metadata.project?.name,
    projectSlug: metadata.project?.slug,
    totalMembers: metadata.members?.length || 0,
    activeMembers: metadata.members?.filter(m => m.is_active !== false).length || 0,
    totalMilestones: metadata.milestones?.length || 0,
    activeMilestones: metadata.milestones?.filter(m => !m.closed).length || 0,
    userStoryStatusCount: metadata.userStoryStatuses?.length || 0,
    taskStatusCount: metadata.taskStatuses?.length || 0,
    issueStatusCount: metadata.issueStatuses?.length || 0,
    cachedAt: Date.now()
  };

  return metadata;
}

/**
 * Get available statuses for a specific entity type
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {string} entityType - Entity type ('userStory', 'task', 'issue')
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of status objects with enriched information
 */
export async function getAvailableStatuses(projectIdentifier, entityType, options = {}) {
  const { useCache = true } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  let statuses;
  switch (entityType.toLowerCase()) {
    case 'userstory':
    case 'user_story':
    case 'story':
      statuses = await getCachedOrFetch(
        projectId,
        'userStoryStatuses',
        () => taigaService.getUserStoryStatuses(projectId)
      );
      break;

    case 'task':
      statuses = await getCachedOrFetch(
        projectId,
        'taskStatuses',
        () => taigaService.getTaskStatuses(projectId)
      );
      break;

    case 'issue':
      statuses = await getCachedOrFetch(
        projectId,
        'issueStatuses',
        () => taigaService.getIssueStatuses(projectId)
      );
      break;

    default:
      throw new Error(
        `Invalid entity type: "${entityType}". ` +
        `Supported types: "userStory", "task", "issue"`
      );
  }

  // Enrich status objects with additional metadata
  return statuses.map((status, index) => ({
    id: status.id,
    name: status.name,
    slug: status.slug,
    order: status.order !== undefined ? status.order : index,
    isClosed: status.is_closed || false,
    color: status.color || '#cccccc',
    // Helper for easy matching
    aliases: [
      status.name,
      status.name.toLowerCase(),
      status.slug
    ]
  }));
}

/**
 * Get project members with enriched information
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @param {boolean} options.useCache - Use cached data if available (default: true)
 * @param {boolean} options.activeOnly - Return only active members (default: false)
 * @returns {Promise<Array>} - Array of enriched member objects
 */
export async function getProjectMembers(projectIdentifier, options = {}) {
  const { useCache = true, activeOnly = false } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  const members = await getCachedOrFetch(
    projectId,
    'members',
    () => taigaService.getProjectMembers(projectId)
  );

  // Filter and enrich members
  let filteredMembers = members;
  if (activeOnly) {
    filteredMembers = members.filter(m => m.is_active !== false);
  }

  return filteredMembers.map(m => ({
    userId: m.user || m.id,
    username: m.username,
    fullName: m.full_name || m.full_name_display,
    email: m.email || m.user_email,
    role: m.role_name,
    roleName: m.role_name,
    isActive: m.is_active !== false,
    photo: m.photo,
    // Helper for easy matching
    identifiers: {
      id: m.user || m.id,
      username: m.username,
      email: m.email || m.user_email,
      fullName: m.full_name || m.full_name_display
    }
  }));
}

/**
 * Get project milestones (sprints) with enriched information
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @param {boolean} options.useCache - Use cached data if available (default: true)
 * @param {boolean} options.activeOnly - Return only active (not closed) milestones (default: false)
 * @returns {Promise<Array>} - Array of enriched milestone objects
 */
export async function getProjectMilestones(projectIdentifier, options = {}) {
  const { useCache = true, activeOnly = false } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  const milestones = await getCachedOrFetch(
    projectId,
    'milestones',
    () => taigaService.listMilestones(projectId)
  );

  // Filter and enrich milestones
  let filteredMilestones = milestones;
  if (activeOnly) {
    filteredMilestones = milestones.filter(m => !m.closed);
  }

  return filteredMilestones.map(m => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    isClosed: m.closed || false,
    estimatedStart: m.estimated_start,
    estimatedFinish: m.estimated_finish,
    // Helper for easy matching
    aliases: [
      m.name,
      m.name.toLowerCase(),
      m.slug,
      String(m.id)
    ]
  }));
}

/**
 * Get issue priorities for a project
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of enriched priority objects
 */
export async function getIssuePriorities(projectIdentifier, options = {}) {
  const { useCache = true } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  const priorities = await getCachedOrFetch(
    projectId,
    'priorities',
    () => taigaService.getIssuePriorities(projectId)
  );

  return priorities.map(p => ({
    id: p.id,
    name: p.name,
    order: p.order || 0,
    color: p.color || '#cccccc',
    aliases: [p.name, p.name.toLowerCase()]
  }));
}

/**
 * Get issue severities for a project
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of enriched severity objects
 */
export async function getIssueSeverities(projectIdentifier, options = {}) {
  const { useCache = true } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  const severities = await getCachedOrFetch(
    projectId,
    'severities',
    () => taigaService.getIssueSeverities(projectId)
  );

  return severities.map(s => ({
    id: s.id,
    name: s.name,
    order: s.order || 0,
    color: s.color || '#cccccc',
    aliases: [s.name, s.name.toLowerCase()]
  }));
}

/**
 * Get issue types for a project
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - Array of enriched issue type objects
 */
export async function getIssueTypes(projectIdentifier, options = {}) {
  const { useCache = true } = options;

  if (!useCache) {
    clearMetadataCache(projectIdentifier);
  }

  const projectId = await resolveProjectId(projectIdentifier);

  const types = await getCachedOrFetch(
    projectId,
    'issueTypes',
    () => taigaService.getIssueTypes(projectId)
  );

  return types.map(t => ({
    id: t.id,
    name: t.name,
    order: t.order || 0,
    color: t.color || '#cccccc',
    aliases: [t.name, t.name.toLowerCase()]
  }));
}

/**
 * Validate and resolve a status name to status ID
 * @param {string} statusName - Status name to resolve
 * @param {string|number} projectIdentifier - Project ID or slug
 * @param {string} entityType - Entity type ('userStory', 'task', 'issue')
 * @returns {Promise<Object>} - Resolved status object or error with suggestions
 */
export async function resolveStatus(statusName, projectIdentifier, entityType) {
  const statuses = await getAvailableStatuses(projectIdentifier, entityType);

  // Try exact match first
  const exactMatch = statuses.find(s => s.name === statusName);
  if (exactMatch) {
    return { status: exactMatch, matchType: 'exact' };
  }

  // Try case-insensitive match
  const caseInsensitiveMatch = statuses.find(s =>
    s.name.toLowerCase() === statusName.toLowerCase()
  );
  if (caseInsensitiveMatch) {
    return { status: caseInsensitiveMatch, matchType: 'case_insensitive' };
  }

  // No match - throw error with available options
  const availableStatuses = statuses.map(s =>
    `  - "${s.name}" (ID: ${s.id})${s.isClosed ? ' [CLOSED]' : ''}`
  ).join('\n');

  throw new Error(
    `Status "${statusName}" not found for ${entityType}.\n\n` +
    `Available statuses:\n${availableStatuses}\n\n` +
    `Note: Status names are case-sensitive. Use exact name from the list above.`
  );
}
