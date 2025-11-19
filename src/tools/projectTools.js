/**
 * Project-related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES } from '../constants.js';
import { 
  formatProjectList,
  formatDateTime,
  createErrorResponse,
  createSuccessResponse,
  getSafeValue
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list all user projects
 */
export const listProjectsTool = {
  name: 'listProjects',
  description: 'List all projects the user has access to. Returns the complete list with automatic pagination.',
  schema: {},
  handler: async () => {
    try {
      const projects = await taigaService.listProjects();

      if (projects.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_PROJECTS);
      }

      const projectsText = `Your Taiga Projects:\n\n${formatProjectList(projects)}`;
      return createSuccessResponse(projectsText);
    } catch (error) {
      return createErrorResponse(`Failed to list projects: ${error.message}`);
    }
  }
};

/**
 * Tool to get project details
 */
export const getProjectTool = {
  name: 'getProject',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      let project;

      // Try to get project by ID first
      if (!isNaN(projectIdentifier)) {
        try {
          project = await taigaService.getProject(projectIdentifier);
        } catch (error) {
          // If that fails, try by slug
          project = await taigaService.getProjectBySlug(projectIdentifier);
        }
      } else {
        // If it's not a number, try by slug
        project = await taigaService.getProjectBySlug(projectIdentifier);
      }

      const projectDetails = `Project Details:

Name: ${project.name}
ID: ${project.id}
Slug: ${project.slug}
Description: ${getSafeValue(project.description, 'No description')}
Created: ${formatDateTime(project.created_date)}
Total Members: ${project.total_memberships}`;

      return createSuccessResponse(projectDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get project details: ${error.message}`);
    }
  }
};