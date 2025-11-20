import { AxiosInstance } from 'axios';
import { TaigaAuth } from './auth/TaigaAuth.js';
import type {
  TaigaConfig,
  Project,
  UserStory,
  Task,
  Issue,
  Milestone,
  Comment,
  Attachment,
  Epic,
  WikiPage,
  User,
  MilestoneStats,
  BatchCreateIssue,
  BatchCreateUserStory,
  BatchCreateTask,
} from './types/index.js';
import { API_ENDPOINTS, ERROR_MESSAGES } from './constants.js';

/**
 * Main Taiga API Client
 * Provides complete access to Taiga API functionality
 */
export class TaigaClient {
  private auth: TaigaAuth;

  constructor(config: TaigaConfig) {
    this.auth = new TaigaAuth(config);
  }

  /**
   * Authenticate with credentials
   */
  async authenticate(username?: string, password?: string): Promise<string> {
    return this.auth.authenticate(username, password);
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Get authenticated client
   */
  private async getClient(): Promise<AxiosInstance> {
    return this.auth.createAuthenticatedClient();
  }

  /**
   * Fetch all pages from a paginated endpoint
   */
  private async fetchAllPages<T>(
    client: AxiosInstance,
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const allResults: T[] = [];
    let currentPage = 1;
    const pageSize = 100;

    while (true) {
      const response = await client.get<T[]>(endpoint, {
        params: {
          ...params,
          page: currentPage,
          page_size: pageSize,
        },
      });

      const results = response.data;

      if (!results || results.length === 0) {
        break;
      }

      allResults.push(...results);

      if (results.length < pageSize) {
        break;
      }

      const totalCount = response.headers['x-pagination-count'];
      if (totalCount && allResults.length >= parseInt(totalCount)) {
        break;
      }

      currentPage++;
    }

    return allResults;
  }

  // ========================= USER MANAGEMENT =========================

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    try {
      const client = await this.getClient();
      const response = await client.get<User>(API_ENDPOINTS.USERS_ME);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get current user:', error.message);
      throw new Error('Failed to get user information from Taiga');
    }
  }

  // ========================= PROJECT MANAGEMENT =========================

  /**
   * List all projects
   */
  async listProjects(): Promise<Project[]> {
    try {
      const client = await this.getClient();
      const currentUser = await this.getCurrentUser();
      return await this.fetchAllPages<Project>(client, API_ENDPOINTS.PROJECTS, {
        member: currentUser.id,
      });
    } catch (error: any) {
      console.error('Failed to list projects:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_PROJECTS);
    }
  }

  /**
   * Get project by ID or slug
   */
  async getProject(projectId: string | number): Promise<Project> {
    try {
      const client = await this.getClient();
      const response = await client.get<Project>(`${API_ENDPOINTS.PROJECTS}/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get project ${projectId}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_PROJECT);
    }
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(slug: string): Promise<Project> {
    try {
      const client = await this.getClient();
      const response = await client.get<Project>(`${API_ENDPOINTS.PROJECTS}/by_slug`, {
        params: { slug },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get project by slug ${slug}:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_PROJECT);
    }
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.MEMBERSHIPS, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get project members:`, error.message);
      throw new Error('Failed to get project members from Taiga');
    }
  }

  // ========================= MILESTONE/SPRINT MANAGEMENT =========================

  /**
   * List milestones (sprints) for a project
   */
  async listMilestones(projectId: string | number): Promise<Milestone[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<Milestone>(client, API_ENDPOINTS.MILESTONES, {
        project: projectId,
      });
    } catch (error: any) {
      console.error(`Failed to list milestones:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_SPRINTS);
    }
  }

  /**
   * Get milestone details
   */
  async getMilestone(milestoneId: string | number): Promise<Milestone> {
    try {
      const client = await this.getClient();
      const response = await client.get<Milestone>(
        `${API_ENDPOINTS.MILESTONES}/${milestoneId}`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get milestone:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_SPRINT);
    }
  }

  /**
   * Get milestone statistics
   */
  async getMilestoneStats(milestoneId: string | number): Promise<MilestoneStats> {
    try {
      const client = await this.getClient();
      const response = await client.get<MilestoneStats>(
        `${API_ENDPOINTS.MILESTONES}/${milestoneId}/stats`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get milestone stats:`, error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_SPRINT_STATS);
    }
  }

  /**
   * Create milestone
   */
  async createMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
    try {
      const client = await this.getClient();
      const response = await client.post<Milestone>(API_ENDPOINTS.MILESTONES, milestoneData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create milestone:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_SPRINT);
    }
  }

  /**
   * Update milestone
   */
  async updateMilestone(
    milestoneId: string | number,
    updateData: Partial<Milestone>
  ): Promise<Milestone> {
    try {
      const client = await this.getClient();
      const currentMilestone = await this.getMilestone(milestoneId);

      const response = await client.patch<Milestone>(
        `${API_ENDPOINTS.MILESTONES}/${milestoneId}`,
        {
          ...updateData,
          version: currentMilestone.version,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update milestone:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_SPRINT);
    }
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(milestoneId: string | number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.delete(`${API_ENDPOINTS.MILESTONES}/${milestoneId}`);
    } catch (error: any) {
      console.error('Failed to delete milestone:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE_SPRINT);
    }
  }

  // ========================= USER STORY MANAGEMENT =========================

  /**
   * List user stories
   */
  async listUserStories(projectId: string | number): Promise<UserStory[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<UserStory>(client, API_ENDPOINTS.USER_STORIES, {
        project: projectId,
      });
    } catch (error: any) {
      console.error('Failed to list user stories:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_USER_STORIES);
    }
  }

  /**
   * Get user story
   */
  async getUserStory(userStoryId: string | number): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const response = await client.get<UserStory>(
        `${API_ENDPOINTS.USER_STORIES}/${userStoryId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user story:', error.message);
      throw new Error(ERROR_MESSAGES.USER_STORY_NOT_FOUND);
    }
  }

  /**
   * Get user story by reference
   */
  async getUserStoryByRef(ref: string | number, projectId: string | number): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const response = await client.get<UserStory>(`${API_ENDPOINTS.USER_STORIES}/by_ref`, {
        params: { ref, project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user story by ref:', error.message);
      throw new Error(ERROR_MESSAGES.USER_STORY_NOT_FOUND);
    }
  }

  /**
   * Create user story
   */
  async createUserStory(userStoryData: Partial<UserStory>): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const response = await client.post<UserStory>(
        API_ENDPOINTS.USER_STORIES,
        userStoryData
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user story:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_USER_STORY);
    }
  }

  /**
   * Update user story
   */
  async updateUserStory(
    userStoryId: string | number,
    updateData: Partial<UserStory>
  ): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const currentStory = await this.getUserStory(userStoryId);

      const response = await client.patch<UserStory>(
        `${API_ENDPOINTS.USER_STORIES}/${userStoryId}`,
        {
          ...updateData,
          version: currentStory.version,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user story:', error.message);
      throw new Error('Failed to update user story in Taiga');
    }
  }

  /**
   * Delete user story
   */
  async deleteUserStory(userStoryId: string | number): Promise<void> {
    try {
      const client = await this.getClient();
      const currentStory = await this.getUserStory(userStoryId);

      await client.delete(`${API_ENDPOINTS.USER_STORIES}/${userStoryId}`, {
        data: { version: currentStory.version },
      });
    } catch (error: any) {
      console.error('Failed to delete user story:', error.message);
      throw new Error('Failed to delete user story from Taiga');
    }
  }

  /**
   * Get user story statuses
   */
  async getUserStoryStatuses(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.USER_STORY_STATUSES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user story statuses:', error.message);
      throw new Error('Failed to get user story statuses from Taiga');
    }
  }

  // ========================= TASK MANAGEMENT =========================

  /**
   * Create task
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const client = await this.getClient();
      const response = await client.post<Task>(API_ENDPOINTS.TASKS, taskData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create task:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_TASK);
    }
  }

  /**
   * Get task
   */
  async getTask(taskId: string | number): Promise<Task> {
    try {
      const client = await this.getClient();
      const response = await client.get<Task>(`${API_ENDPOINTS.TASKS}/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get task:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_TASK);
    }
  }

  /**
   * Get task by reference
   */
  async getTaskByRef(ref: string | number, projectId: string | number): Promise<Task> {
    try {
      const client = await this.getClient();
      const response = await client.get<Task>(`${API_ENDPOINTS.TASKS}/by_ref`, {
        params: { ref, project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get task by ref:', error.message);
      throw new Error(ERROR_MESSAGES.TASK_NOT_FOUND);
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId: string | number, updateData: Partial<Task>): Promise<Task> {
    try {
      const client = await this.getClient();
      const currentTask = await this.getTask(taskId);

      const response = await client.patch<Task>(`${API_ENDPOINTS.TASKS}/${taskId}`, {
        ...updateData,
        version: currentTask.version,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update task:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_TASK);
    }
  }

  /**
   * Get task statuses
   */
  async getTaskStatuses(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.TASK_STATUSES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get task statuses:', error.message);
      throw new Error('Failed to get task statuses from Taiga');
    }
  }

  // ========================= ISSUE MANAGEMENT =========================

  /**
   * List issues
   */
  async listIssues(projectId: string | number): Promise<Issue[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<Issue>(client, API_ENDPOINTS.ISSUES, {
        project: projectId,
      });
    } catch (error: any) {
      console.error('Failed to list issues:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_ISSUES);
    }
  }

  /**
   * Get issue
   */
  async getIssue(issueId: string | number): Promise<Issue> {
    try {
      const client = await this.getClient();
      const response = await client.get<Issue>(`${API_ENDPOINTS.ISSUES}/${issueId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_ISSUE);
    }
  }

  /**
   * Get issue by reference
   */
  async getIssueByRef(ref: string | number, projectId: string | number): Promise<Issue> {
    try {
      const client = await this.getClient();
      const response = await client.get<Issue>(`${API_ENDPOINTS.ISSUES}/by_ref`, {
        params: { ref, project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue by ref:', error.message);
      throw new Error(ERROR_MESSAGES.ISSUE_NOT_FOUND);
    }
  }

  /**
   * Create issue
   */
  async createIssue(issueData: Partial<Issue>): Promise<Issue> {
    try {
      const client = await this.getClient();
      const response = await client.post<Issue>(API_ENDPOINTS.ISSUES, issueData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create issue:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_ISSUE);
    }
  }

  /**
   * Update issue
   */
  async updateIssue(issueId: string | number, updateData: Partial<Issue>): Promise<Issue> {
    try {
      const client = await this.getClient();
      const currentIssue = await this.getIssue(issueId);

      const response = await client.patch<Issue>(`${API_ENDPOINTS.ISSUES}/${issueId}`, {
        ...updateData,
        version: currentIssue.version,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update issue:', error.message);
      throw new Error('Failed to update issue in Taiga');
    }
  }

  /**
   * Get issues by milestone
   */
  async getIssuesByMilestone(
    projectId: string | number,
    milestoneId: string | number
  ): Promise<Issue[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<Issue>(client, API_ENDPOINTS.ISSUES, {
        project: projectId,
        milestone: milestoneId,
      });
    } catch (error: any) {
      console.error('Failed to get issues by milestone:', error.message);
      throw new Error('Failed to get issues by milestone from Taiga');
    }
  }

  /**
   * Get issue statuses
   */
  async getIssueStatuses(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.ISSUE_STATUSES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue statuses:', error.message);
      throw new Error('Failed to get issue statuses from Taiga');
    }
  }

  /**
   * Get issue priorities
   */
  async getIssuePriorities(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.PRIORITIES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue priorities:', error.message);
      throw new Error('Failed to get issue priorities from Taiga');
    }
  }

  /**
   * Get issue severities
   */
  async getIssueSeverities(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.SEVERITIES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue severities:', error.message);
      throw new Error('Failed to get issue severities from Taiga');
    }
  }

  /**
   * Get issue types
   */
  async getIssueTypes(projectId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const response = await client.get(API_ENDPOINTS.ISSUE_TYPES, {
        params: { project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get issue types:', error.message);
      throw new Error('Failed to get issue types from Taiga');
    }
  }

  // ========================= BATCH OPERATIONS =========================

  /**
   * Batch create issues
   */
  async batchCreateIssues(issues: BatchCreateIssue[]): Promise<Issue[]> {
    const results: Issue[] = [];
    for (const issueData of issues) {
      const issue = await this.createIssue(issueData);
      results.push(issue);
    }
    return results;
  }

  /**
   * Batch create user stories
   */
  async batchCreateUserStories(stories: BatchCreateUserStory[]): Promise<UserStory[]> {
    const results: UserStory[] = [];
    for (const storyData of stories) {
      const story = await this.createUserStory(storyData);
      results.push(story);
    }
    return results;
  }

  /**
   * Batch create tasks
   */
  async batchCreateTasks(tasks: BatchCreateTask[]): Promise<Task[]> {
    const results: Task[] = [];
    for (const taskData of tasks) {
      const task = await this.createTask(taskData);
      results.push(task);
    }
    return results;
  }

  // ========================= COMMENT MANAGEMENT =========================

  /**
   * Get item endpoint based on type
   */
  private getItemEndpoint(itemType: string): string {
    const endpoints: Record<string, string> = {
      issue: API_ENDPOINTS.ISSUES,
      user_story: API_ENDPOINTS.USER_STORIES,
      task: API_ENDPOINTS.TASKS,
    };
    return endpoints[itemType] || API_ENDPOINTS.ISSUES;
  }

  /**
   * Get history object type
   */
  private getHistoryObjectType(itemType: string): string {
    const types: Record<string, string> = {
      issue: 'issue',
      user_story: 'userstory',
      task: 'task',
    };
    return types[itemType] || 'issue';
  }

  /**
   * Get item version
   */
  private async getItemVersion(itemType: string, itemId: string | number): Promise<number> {
    const client = await this.getClient();
    const endpoint = this.getItemEndpoint(itemType);
    const response = await client.get(`${endpoint}/${itemId}`);
    return response.data.version || 1;
  }

  /**
   * Add comment to an item
   */
  async addComment(
    itemType: string,
    itemId: string | number,
    comment: string
  ): Promise<any> {
    try {
      const client = await this.getClient();
      const currentVersion = await this.getItemVersion(itemType, itemId);
      const endpoint = this.getItemEndpoint(itemType);

      const response = await client.patch(`${endpoint}/${itemId}`, {
        comment,
        version: currentVersion,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to add comment:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_ADD_COMMENT);
    }
  }

  /**
   * Get item history (comments)
   */
  async getItemHistory(itemType: string, itemId: string | number): Promise<any[]> {
    try {
      const client = await this.getClient();
      const objectType = this.getHistoryObjectType(itemType);
      return await this.fetchAllPages(client, `${API_ENDPOINTS.HISTORY}/${objectType}/${itemId}`, {});
    } catch (error: any) {
      console.error('Failed to get item history:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_COMMENTS);
    }
  }

  /**
   * Edit comment
   */
  async editComment(commentId: string | number, newComment: string): Promise<any> {
    try {
      const client = await this.getClient();
      const response = await client.patch(`${API_ENDPOINTS.HISTORY}/edit-comment`, {
        id: commentId,
        comment: newComment,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to edit comment:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_EDIT_COMMENT);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string | number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.delete(`${API_ENDPOINTS.HISTORY}/delete-comment`, {
        data: { id: commentId },
      });
    } catch (error: any) {
      console.error('Failed to delete comment:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE_COMMENT);
    }
  }

  // ========================= ATTACHMENT MANAGEMENT =========================

  /**
   * Get attachment endpoint
   */
  private getAttachmentEndpoint(itemType: string): string {
    const endpoints: Record<string, string> = {
      issue: API_ENDPOINTS.ISSUE_ATTACHMENTS,
      user_story: API_ENDPOINTS.USERSTORY_ATTACHMENTS,
      task: API_ENDPOINTS.TASK_ATTACHMENTS,
    };
    return endpoints[itemType] || API_ENDPOINTS.ISSUE_ATTACHMENTS;
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(
    itemType: string,
    itemId: string | number,
    fileData: string,
    fileName: string,
    mimeType?: string,
    description?: string
  ): Promise<Attachment> {
    try {
      const FormData = (await import('form-data')).default;
      const client = await this.getClient();
      const endpoint = this.getAttachmentEndpoint(itemType);

      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const fileBuffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      formData.append('object_id', itemId.toString());
      formData.append('attached_file', fileBuffer, fileName);

      if (description) {
        formData.append('description', description);
      }

      const response = await client.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to upload attachment:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPLOAD_ATTACHMENT);
    }
  }

  /**
   * List attachments
   */
  async listAttachments(itemType: string, itemId: string | number): Promise<Attachment[]> {
    try {
      const client = await this.getClient();
      const endpoint = this.getAttachmentEndpoint(itemType);
      return await this.fetchAllPages<Attachment>(client, endpoint, { object_id: itemId });
    } catch (error: any) {
      console.error('Failed to list attachments:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_ATTACHMENTS);
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string | number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.delete(`${API_ENDPOINTS.ISSUE_ATTACHMENTS}/${attachmentId}`);
    } catch (error: any) {
      console.error('Failed to delete attachment:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE_ATTACHMENT);
    }
  }

  // ========================= EPIC MANAGEMENT =========================

  /**
   * Create epic
   */
  async createEpic(epicData: Partial<Epic>): Promise<Epic> {
    try {
      const client = await this.getClient();
      const response = await client.post<Epic>(API_ENDPOINTS.EPICS, epicData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create epic:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_EPIC);
    }
  }

  /**
   * List epics
   */
  async listEpics(projectId: string | number): Promise<Epic[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<Epic>(client, API_ENDPOINTS.EPICS, {
        project: projectId,
      });
    } catch (error: any) {
      console.error('Failed to list epics:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_EPICS);
    }
  }

  /**
   * Get epic
   */
  async getEpic(epicId: string | number): Promise<Epic> {
    try {
      const client = await this.getClient();
      const response = await client.get<Epic>(`${API_ENDPOINTS.EPICS}/${epicId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get epic:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_EPIC);
    }
  }

  /**
   * Update epic
   */
  async updateEpic(epicId: string | number, updateData: Partial<Epic>): Promise<Epic> {
    try {
      const client = await this.getClient();
      const currentEpic = await this.getEpic(epicId);

      const response = await client.patch<Epic>(`${API_ENDPOINTS.EPICS}/${epicId}`, {
        ...updateData,
        version: currentEpic.version,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update epic:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_EPIC);
    }
  }

  /**
   * Link story to epic
   */
  async linkStoryToEpic(userStoryId: string | number, epicId: string | number): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const endpoint = API_ENDPOINTS.EPIC_RELATED_USERSTORIES(Number(epicId));

      await client.post(endpoint, {
        epic: epicId,
        user_story: userStoryId,
      });

      const updatedStory = await this.getUserStory(userStoryId);
      return updatedStory;
    } catch (error: any) {
      console.error('Failed to link story to epic:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LINK_STORY);
    }
  }

  /**
   * Unlink story from epic
   */
  async unlinkStoryFromEpic(userStoryId: string | number): Promise<UserStory> {
    try {
      const client = await this.getClient();
      const currentStory = await this.getUserStory(userStoryId);

      if (!currentStory.epic) {
        return currentStory;
      }

      const epicId = currentStory.epic;
      const endpoint = API_ENDPOINTS.EPIC_RELATED_USERSTORIES(epicId);
      const relatedStories = await client.get(endpoint);

      const relationship = relatedStories.data.find(
        (rs: any) => rs.user_story === Number(userStoryId)
      );

      if (relationship) {
        await client.delete(`${endpoint}/${relationship.id}`);
      }

      const updatedStory = await this.getUserStory(userStoryId);
      return updatedStory;
    } catch (error: any) {
      console.error('Failed to unlink story from epic:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UNLINK_STORY);
    }
  }

  // ========================= WIKI MANAGEMENT =========================

  /**
   * Create wiki page
   */
  async createWikiPage(wikiData: Partial<WikiPage>): Promise<WikiPage> {
    try {
      const client = await this.getClient();
      const response = await client.post<WikiPage>(API_ENDPOINTS.WIKI, wikiData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_CREATE_WIKI);
    }
  }

  /**
   * List wiki pages
   */
  async listWikiPages(projectId: string | number): Promise<WikiPage[]> {
    try {
      const client = await this.getClient();
      return await this.fetchAllPages<WikiPage>(client, API_ENDPOINTS.WIKI, {
        project: projectId,
      });
    } catch (error: any) {
      console.error('Failed to list wiki pages:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_LIST_WIKI);
    }
  }

  /**
   * Get wiki page
   */
  async getWikiPage(wikiPageId: string | number): Promise<WikiPage> {
    try {
      const client = await this.getClient();
      const response = await client.get<WikiPage>(`${API_ENDPOINTS.WIKI}/${wikiPageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }

  /**
   * Get wiki page by slug
   */
  async getWikiPageBySlug(slug: string, projectId: string | number): Promise<WikiPage> {
    try {
      const client = await this.getClient();
      const response = await client.get<WikiPage>(`${API_ENDPOINTS.WIKI}/by_slug`, {
        params: { slug, project: projectId },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get wiki page by slug:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_GET_WIKI);
    }
  }

  /**
   * Update wiki page
   */
  async updateWikiPage(
    wikiPageId: string | number,
    updateData: Partial<WikiPage>
  ): Promise<WikiPage> {
    try {
      const client = await this.getClient();
      const currentWiki = await this.getWikiPage(wikiPageId);

      const response = await client.patch<WikiPage>(`${API_ENDPOINTS.WIKI}/${wikiPageId}`, {
        ...updateData,
        version: currentWiki.version,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_WIKI);
    }
  }

  /**
   * Delete wiki page
   */
  async deleteWikiPage(wikiPageId: string | number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.delete(`${API_ENDPOINTS.WIKI}/${wikiPageId}`);
    } catch (error: any) {
      console.error('Failed to delete wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_DELETE_WIKI);
    }
  }

  /**
   * Watch/unwatch wiki page
   */
  async watchWikiPage(wikiPageId: string | number, watch = true): Promise<any> {
    try {
      const client = await this.getClient();
      const endpoint = watch
        ? `${API_ENDPOINTS.WIKI}/${wikiPageId}/watch`
        : `${API_ENDPOINTS.WIKI}/${wikiPageId}/unwatch`;

      const response = await client.post(endpoint);
      return response.data;
    } catch (error: any) {
      console.error('Failed to watch/unwatch wiki page:', error.message);
      throw new Error(ERROR_MESSAGES.FAILED_TO_WATCH_WIKI);
    }
  }
}
