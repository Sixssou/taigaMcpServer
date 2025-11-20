/**
 * Wiki management tools for Taiga MCP Server
 * Handles Wiki page creation, management, and collaboration features
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { createSuccessResponse, createErrorResponse, resolveProjectId } from '../utils.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, RESPONSE_TEMPLATES } from '../constants.js';

const taigaService = new TaigaService();

/**
 * Create Wiki Page tool
 * Creates a new Wiki page in a project
 */
export const createWikiPageTool = {
  name: 'createWikiPage',
  description: 'Create a new Wiki page in a project for documentation and knowledge sharing',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    slug: z.string().min(1, 'Wiki page slug is required').describe('URL-friendly identifier for the Wiki page'),
    content: z.string().min(1, 'Wiki page content is required').describe('Content of the Wiki page (supports Markdown)'),
    watchers: z.array(z.number()).optional().describe('Optional list of user IDs to watch this Wiki page'),
  }),
  
  handler: async ({ project, slug, content, watchers }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const wikiData = {
        project: resolvedProject.id,
        slug,
        content,
        watchers: watchers || []
      };

      const result = await taigaService.createWikiPage(wikiData);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_CREATED}\n\n` +
        `**Wiki Page Created Successfully**\n` +
        `- Wiki ID: ${result.id}\n` +
        `- Slug: ${result.slug}\n` +
        `- Project: ${resolvedProject.name}\n` +
        `- Created: ${new Date(result.created_date).toLocaleString()}\n` +
        `- Content Length: ${result.content?.length || 0} characters\n` +
        `- Watchers: ${result.watchers?.length || 0} users`
      );
    } catch (error) {
      console.error('Failed to create wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_CREATE_WIKI);
    }
  }
};

/**
 * List Wiki Pages tool
 * Lists all Wiki pages in a project
 */
export const listWikiPagesTool = {
  name: 'listWikiPages',
  description: 'List all Wiki pages in a project. Returns the complete list with automatic pagination.',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
  }),
  
  handler: async ({ project }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      const wikiPages = await taigaService.listWikiPages(resolvedProject.id);
      
      if (!wikiPages || wikiPages.length === 0) {
        return createSuccessResponse(
          `**${resolvedProject.name} - Wiki Pages**\n\n` +
          `${RESPONSE_TEMPLATES.NO_WIKI_PAGES}`
        );
      }

      const wikiList = wikiPages.map(wiki =>
        `**${wiki.slug}**\n` +
        `   - ID: ${wiki.id}\n` +
        `   - Modified: ${new Date(wiki.modified_date).toLocaleString()}\n` +
        `   - Watchers: ${wiki.watchers?.length || 0} users\n` +
        `   - Content: ${wiki.content ? `${wiki.content.substring(0, 100)}${wiki.content.length > 100 ? '...' : ''}` : 'No content'}`
      ).join('\n\n');

      return createSuccessResponse(
        `**${resolvedProject.name} - Wiki Pages** (${wikiPages.length})\n\n` +
        wikiList
      );
    } catch (error) {
      console.error('Failed to list wiki pages:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_LIST_WIKI);
    }
  }
};

/**
 * Get Wiki Page tool
 * Gets detailed information about a specific Wiki page
 */
export const getWikiPageTool = {
  name: 'getWikiPage',
  description: 'Get detailed information about a specific Wiki page by ID or slug',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
  }),
  
  handler: async ({ project, identifier }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      let wikiPage;
      
      // If identifier is a number, get by ID; if string, get by slug
      if (typeof identifier === 'number') {
        wikiPage = await taigaService.getWikiPage(identifier);
      } else {
        wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
      }
      
      return createSuccessResponse(
        `**Wiki Page Details**\n\n` +
        `**Basic Information**\n` +
        `- ID: ${wikiPage.id}\n` +
        `- Slug: ${wikiPage.slug}\n` +
        `- Project: ${resolvedProject.name}\n` +
        `- Created: ${new Date(wikiPage.created_date).toLocaleString()}\n` +
        `- Modified: ${new Date(wikiPage.modified_date).toLocaleString()}\n` +
        `- Version: ${wikiPage.version}\n\n` +
        `**Collaboration Information**\n` +
        `- Watchers: ${wikiPage.watchers?.length || 0} users\n` +
        `- Owner: ${wikiPage.owner_full_name || 'Not set'}\n\n` +
        `**Content**\n` +
        `${wikiPage.content || 'This Wiki page has no content yet'}`
      );
    } catch (error) {
      console.error('Failed to get wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }
};

/**
 * Update Wiki Page tool
 * Updates content and settings of an existing Wiki page
 */
export const updateWikiPageTool = {
  name: 'updateWikiPage',
  description: 'Update content and settings of an existing Wiki page',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
    content: z.string().optional().describe('New content for the Wiki page (supports Markdown)'),
    watchers: z.array(z.number()).optional().describe('Updated list of user IDs to watch this Wiki page'),
  }),
  
  handler: async ({ project, identifier, content, watchers }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID if identifier is a slug
      let wikiPageId;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
      }

      // Prepare update data
      const updateData = {};
      if (content !== undefined) updateData.content = content;
      if (watchers !== undefined) updateData.watchers = watchers;

      const result = await taigaService.updateWikiPage(wikiPageId, updateData);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_UPDATED}\n\n` +
        `**Wiki Page Updated Successfully**\n` +
        `- Wiki ID: ${result.id}\n` +
        `- Slug: ${result.slug}\n` +
        `- Project: ${resolvedProject.name}\n` +
        `- Updated: ${new Date(result.modified_date).toLocaleString()}\n` +
        `- Version: ${result.version}\n` +
        `- Content Length: ${result.content?.length || 0} characters\n` +
        `- Watchers: ${result.watchers?.length || 0} users`
      );
    } catch (error) {
      console.error('Failed to update wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_UPDATE_WIKI);
    }
  }
};

/**
 * Delete Wiki Page tool
 * Deletes a Wiki page from the project
 */
export const deleteWikiPageTool = {
  name: 'deleteWikiPage',
  description: 'Delete a Wiki page from the project (irreversible action)',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
  }),
  
  handler: async ({ project, identifier }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID and details if identifier is a slug
      let wikiPageId, wikiSlug;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
        const wikiPage = await taigaService.getWikiPage(identifier);
        wikiSlug = wikiPage.slug;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
        wikiSlug = wikiPage.slug;
      }

      await taigaService.deleteWikiPage(wikiPageId);
      
      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_DELETED}\n\n` +
        `**Wiki Page Deleted Successfully**\n` +
        `- Deleted Wiki: ${wikiSlug}\n` +
        `- Wiki ID: ${wikiPageId}\n` +
        `- Project: ${resolvedProject.name}\n` +
        `- Deleted: ${new Date().toLocaleString()}\n\n` +
        `Warning: This action is irreversible`
      );
    } catch (error) {
      console.error('Failed to delete wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_DELETE_WIKI);
    }
  }
};

/**
 * Watch Wiki Page tool
 * Watch or unwatch a Wiki page for notifications
 */
export const watchWikiPageTool = {
  name: 'watchWikiPage',
  description: 'Watch or unwatch a Wiki page to receive notifications about changes',
  inputSchema: z.object({
    project: z.union([z.number(), z.string()]).describe('Project ID, slug, or name'),
    identifier: z.union([z.number(), z.string()]).describe('Wiki page ID (number) or slug (string)'),
    watch: z.boolean().default(true).describe('True to watch, false to unwatch the Wiki page'),
  }),
  
  handler: async ({ project, identifier, watch }) => {
    try {
      if (!taigaService.isAuthenticated()) {
        return createErrorResponse(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }

      // Resolve project to get project ID
      const resolvedProject = await resolveProjectId(project);
      if (!resolvedProject) {
        return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
      }

      // First get the wiki page to get its ID if identifier is a slug
      let wikiPageId, wikiSlug;
      if (typeof identifier === 'number') {
        wikiPageId = identifier;
        const wikiPage = await taigaService.getWikiPage(identifier);
        wikiSlug = wikiPage.slug;
      } else {
        const wikiPage = await taigaService.getWikiPageBySlug(identifier, resolvedProject.id);
        wikiPageId = wikiPage.id;
        wikiSlug = wikiPage.slug;
      }

      await taigaService.watchWikiPage(wikiPageId, watch);

      const action = watch ? 'watched' : 'unwatched';

      return createSuccessResponse(
        `${SUCCESS_MESSAGES.WIKI_PAGE_WATCHED}\n\n` +
        `**Wiki Page ${action.charAt(0).toUpperCase() + action.slice(1)} Successfully**\n` +
        `- Wiki: ${wikiSlug}\n` +
        `- Wiki ID: ${wikiPageId}\n` +
        `- Project: ${resolvedProject.name}\n` +
        `- Action: ${action}\n` +
        `- Time: ${new Date().toLocaleString()}\n\n` +
        `${watch ? 'You will receive notifications about changes to this Wiki page' : 'You will no longer receive notifications about this Wiki page'}`
      );
    } catch (error) {
      console.error('Failed to watch/unwatch wiki page:', error);
      return createErrorResponse(error.message || ERROR_MESSAGES.FAILED_TO_WATCH_WIKI);
    }
  }
};