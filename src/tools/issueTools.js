/**
 * Issue-related MCP tools
 */

import { z } from 'zod';
import { TaigaService } from '../taigaService.js';
import { RESPONSE_TEMPLATES, SUCCESS_MESSAGES, STATUS_LABELS } from '../constants.js';
import { 
  resolveProjectId,
  resolveIssue,
  findIdByName,
  formatIssueList,
  formatDateTime,
  getSafeValue,
  createErrorResponse,
  createSuccessResponse
} from '../utils.js';

const taigaService = new TaigaService();

/**
 * Tool to list issues in a project
 */
export const listIssuesTool = {
  name: 'listIssues',
  description: 'List all issues in a project. Returns the complete list with automatic pagination.',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
  },
  handler: async ({ projectIdentifier }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);
      const issues = await taigaService.listIssues(projectId);

      if (issues.length === 0) {
        return createErrorResponse(RESPONSE_TEMPLATES.NO_ISSUES);
      }

      const issuesText = `Issues in Project:\n\n${formatIssueList(issues)}`;
      return createSuccessResponse(issuesText);
    } catch (error) {
      return createErrorResponse(`Failed to list issues: ${error.message}`);
    }
  }
};

/**
 * Tool to update the status of an issue
 */
export const updateIssueStatusTool = {
  name: 'updateIssueStatus',
  schema: {
    issueIdentifier: z.string().describe('Issue ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    status: z.string().describe('Name of the target status (e.g., "In Progress", "Done")'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ issueIdentifier, status, projectIdentifier }) => {
    try {
      const issue = await resolveIssue(issueIdentifier, projectIdentifier);
      const projectId = issue.project; // Get project ID from the resolved issue

      const statuses = await taigaService.getIssueStatuses(projectId);
      const statusId = findIdByName(statuses, status);

      if (!statusId) {
        const availableStatuses = statuses.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');
        return createErrorResponse(
          `Invalid status name: "${status}". Available statuses for project "${issue.project_extra_info?.name}":\n${availableStatuses}`
        );
      }

      const updatedIssue = await taigaService.updateIssue(issue.id, { status: statusId });

      const successMessage = `Successfully updated status for issue #${updatedIssue.ref} to "${updatedIssue.status_extra_info?.name}".

Issue Details:
- Subject: ${updatedIssue.subject}
- Project: ${getSafeValue(updatedIssue.project_extra_info?.name)}
- New Status: ${getSafeValue(updatedIssue.status_extra_info?.name)}
- Assigned to: ${getSafeValue(updatedIssue.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}
- Sprint: ${getSafeValue(updatedIssue.milestone_extra_info?.name, STATUS_LABELS.NO_SPRINT)}`;

      return createSuccessResponse(successMessage);
    } catch (error) {
      return createErrorResponse(`Failed to update issue status: ${error.message}`);
    }
  }
};

/**
 * Tool to get single issue details
 */
export const getIssueTool = {
  name: 'getIssue',
  schema: {
    issueIdentifier: z.string().describe('Issue ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ issueIdentifier, projectIdentifier }) => {
    try {
      const issue = await resolveIssue(issueIdentifier, projectIdentifier);

      const issueDetails = `Issue Details: #${issue.ref} - ${issue.subject}

Basic Information:
- Project: ${getSafeValue(issue.project_extra_info?.name)}
- Status: ${getSafeValue(issue.status_extra_info?.name)}
- Priority: ${getSafeValue(issue.priority_extra_info?.name)}
- Severity: ${getSafeValue(issue.severity_extra_info?.name)}
- Type: ${getSafeValue(issue.type_extra_info?.name)}

Assignment:
- Assigned to: ${getSafeValue(issue.assigned_to_extra_info?.full_name, STATUS_LABELS.UNASSIGNED)}
- Sprint: ${getSafeValue(issue.milestone_extra_info?.name, STATUS_LABELS.NO_SPRINT)}

Timeline:
- Created: ${formatDateTime(issue.created_date)}
- Modified: ${formatDateTime(issue.modified_date)}

Description:
${getSafeValue(issue.description, STATUS_LABELS.NO_DESCRIPTION)}

Tags: ${getSafeValue(issue.tags?.join(', '), STATUS_LABELS.NO_TAGS)}`;

      return createSuccessResponse(issueDetails);
    } catch (error) {
      return createErrorResponse(`Failed to get issue details: ${error.message}`);
    }
  }
};

/**
 * Tool to create a new issue
 */
export const createIssueTool = {
  name: 'createIssue',
  schema: {
    projectIdentifier: z.string().describe('Project ID or slug'),
    subject: z.string().describe('Issue title/subject'),
    description: z.string().optional().describe('Issue description'),
    status: z.string().optional().describe('Status name (e.g., "New", "In progress")'),
    priority: z.string().optional().describe('Priority name (e.g., "Low", "High")'),
    severity: z.string().optional().describe('Severity name (e.g., "Minor", "Critical")'),
    type: z.string().optional().describe('Issue type name (e.g., "Bug", "Enhancement")'),
    tags: z.array(z.string()).optional().describe('Array of tags'),
  },
  handler: async ({ projectIdentifier, subject, description, status, priority, severity, type, tags }) => {
    try {
      const projectId = await resolveProjectId(projectIdentifier);

      // Get status ID if a status name was provided
      let statusId = undefined;
      if (status) {
        const statuses = await taigaService.getIssueStatuses(projectId);
        statusId = findIdByName(statuses, status);
      }

      // Get priority ID if a priority name was provided
      let priorityId = undefined;
      if (priority) {
        const priorities = await taigaService.getIssuePriorities(projectId);
        priorityId = findIdByName(priorities, priority);
      }

      // Get severity ID if a severity name was provided
      let severityId = undefined;
      if (severity) {
        const severities = await taigaService.getIssueSeverities(projectId);
        severityId = findIdByName(severities, severity);
      }

      // Get type ID if a type name was provided
      let typeId = undefined;
      if (type) {
        const types = await taigaService.getIssueTypes(projectId);
        typeId = findIdByName(types, type);
      }

      // Create the issue
      const issueData = {
        project: projectId,
        subject,
        description,
        status: statusId,
        priority: priorityId,
        severity: severityId,
        type: typeId,
        tags,
      };

      const createdIssue = await taigaService.createIssue(issueData);

      const creationDetails = `${SUCCESS_MESSAGES.ISSUE_CREATED}

Subject: ${createdIssue.subject}
Reference: #${createdIssue.ref}
Status: ${getSafeValue(createdIssue.status_extra_info?.name, 'Default status')}
Priority: ${getSafeValue(createdIssue.priority_extra_info?.name, 'Default priority')}
Severity: ${getSafeValue(createdIssue.severity_extra_info?.name, 'Default severity')}
Type: ${getSafeValue(createdIssue.type_extra_info?.name, 'Default type')}
Project: ${getSafeValue(createdIssue.project_extra_info?.name)}`;

      return createSuccessResponse(creationDetails);
    } catch (error) {
      return createErrorResponse(`Failed to create issue: ${error.message}`);
    }
  }
};

/**
 * Tool to add issue to a sprint (milestone)
 */
export const addIssueToSprintTool = {
  name: 'addIssueToSprint',
  schema: {
    issueIdentifier: z.string().describe('Issue ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    sprintIdentifier: z.string().describe('Sprint ID or name (or "remove" to remove from sprint)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ issueIdentifier, sprintIdentifier, projectIdentifier }) => {
    try {
      // Resolve the issue first
      const issue = await resolveIssue(issueIdentifier, projectIdentifier);
      
      let milestoneId = null;
      
      // Handle sprint removal
      if (sprintIdentifier.toLowerCase() === 'remove' || sprintIdentifier.toLowerCase() === 'none') {
        milestoneId = null;
      } else {
        // Get project ID for sprint lookup
        const projectId = issue.project || (projectIdentifier ? await resolveProjectId(projectIdentifier) : null);
        if (!projectId) {
          return createErrorResponse('Could not determine project ID for sprint lookup');
        }
        
        // Try to find sprint by ID first, then by name
        let sprint = null;
        
        // If it's a number, try to get sprint by ID
        if (!isNaN(sprintIdentifier)) {
          try {
            sprint = await taigaService.getMilestone(sprintIdentifier);
          } catch (error) {
            // If getting by ID fails, we'll try by name below
          }
        }
        
        // If not found by ID or not a number, search by name
        if (!sprint) {
          const sprints = await taigaService.listMilestones(projectId);
          sprint = sprints.find(s => 
            s.name === sprintIdentifier || 
            s.name.toLowerCase() === sprintIdentifier.toLowerCase()
          );
        }
        
        if (!sprint) {
          const sprints = await taigaService.listMilestones(projectId);
          const availableSprints = sprints.map(s => 
            `- ${s.name} (ID: ${s.id})`
          ).join('\n');
          
          return createErrorResponse(
            `Sprint "${sprintIdentifier}" not found in project. Available sprints:\n${availableSprints}`
          );
        }
        
        milestoneId = sprint.id;
      }
      
      // Update the issue with the new milestone
      const updateData = {
        milestone: milestoneId
      };
      
      const updatedIssue = await taigaService.updateIssue(issue.id, updateData);
      
      const sprintDetails = `${SUCCESS_MESSAGES.ISSUE_CREATED.replace('created', 'sprint assignment updated')}

Issue: #${updatedIssue.ref} - ${updatedIssue.subject}
Sprint: ${milestoneId ? 
  (updatedIssue.milestone_extra_info?.name || 'Unknown sprint') : 
  'Removed from sprint'
}
Project: ${getSafeValue(updatedIssue.project_extra_info?.name)}
Status: ${getSafeValue(updatedIssue.status_extra_info?.name)}`;

      return createSuccessResponse(sprintDetails);
    } catch (error) {
      return createErrorResponse(`Failed to add issue to sprint: ${error.message}`);
    }
  }
};

/**
 * Tool to assign issue to a user
 */
export const assignIssueTool = {
  name: 'assignIssue',
  schema: {
    issueIdentifier: z.string().describe('Issue ID or reference number (e.g., "123", "#45", or "45" - auto-detects format)'),
    assignee: z.string().describe('Username or user ID to assign the issue to (or "unassign" to remove assignment)'),
    projectIdentifier: z.string().optional().describe('Project ID or slug (required if using reference number)'),
  },
  handler: async ({ issueIdentifier, assignee, projectIdentifier }) => {
    try {
      // Resolve the issue first
      const issue = await resolveIssue(issueIdentifier, projectIdentifier);
      
      let assignedToId = null;
      
      // Handle unassignment
      if (assignee.toLowerCase() === 'unassign' || assignee.toLowerCase() === 'none') {
        assignedToId = null;
      } else {
        // Get project members to find the assignee
        const projectId = issue.project || (projectIdentifier ? await resolveProjectId(projectIdentifier) : null);
        if (!projectId) {
          return createErrorResponse('Could not determine project ID for member lookup');
        }
        
        const members = await taigaService.getProjectMembers(projectId);
        
        // Try to find user by full name, email, or user ID
        const member = members.find(m => 
          m.full_name === assignee || 
          m.user === parseInt(assignee) ||
          m.email === assignee ||
          m.user_email === assignee ||
          m.full_name?.toLowerCase() === assignee.toLowerCase()
        );
        
        if (!member) {
          const availableMembers = members.map(m => 
            `- ${m.full_name} (${m.user_email || m.email}) - ID: ${m.user}`
          ).join('\n');
          
          return createErrorResponse(
            `User "${assignee}" not found in project. Available members:\n${availableMembers}`
          );
        }
        
        assignedToId = member.user;
      }
      
      // Update the issue
      const updateData = {
        assigned_to: assignedToId
      };
      
      const updatedIssue = await taigaService.updateIssue(issue.id, updateData);
      
      const assignmentDetails = `${SUCCESS_MESSAGES.ISSUE_CREATED.replace('created', 'assignment updated')}

Issue: #${updatedIssue.ref} - ${updatedIssue.subject}
Assigned to: ${assignedToId ? 
  (updatedIssue.assigned_to_extra_info?.full_name || updatedIssue.assigned_to_extra_info?.username || 'Unknown user') : 
  'Unassigned'
}
Project: ${getSafeValue(updatedIssue.project_extra_info?.name)}
Status: ${getSafeValue(updatedIssue.status_extra_info?.name)}`;

      return createSuccessResponse(assignmentDetails);
    } catch (error) {
      return createErrorResponse(`Failed to assign issue: ${error.message}`);
    }
  }
};