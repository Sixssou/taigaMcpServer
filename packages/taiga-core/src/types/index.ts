/**
 * Core TypeScript types for Taiga API
 */

export interface TaigaConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  authToken?: string;
}

export interface AuthResponse {
  auth_token: string;
  id: number;
  username: string;
  email: string;
  full_name: string;
  full_name_display: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_date: string;
  modified_date: string;
  owner: number;
  is_private: boolean;
  total_milestones: number;
  total_story_points: number;
  is_backlog_activated: boolean;
  is_kanban_activated: boolean;
  default_issue_status: number;
  default_issue_type: number;
  default_priority: number;
  default_severity: number;
  default_us_status: number;
  members: number[];
  tags: string[];
}

export interface Milestone {
  id: number;
  name: string;
  slug: string;
  project: number;
  estimated_start: string;
  estimated_finish: string;
  created_date: string;
  modified_date: string;
  closed: boolean;
  disponibility: number;
  total_points: number;
  closed_points: number;
  user_stories: number[];
  version: number;
}

export interface UserStory {
  id: number;
  ref: number;
  project: number;
  milestone?: number;
  subject: string;
  description: string;
  status: number;
  is_closed: boolean;
  created_date: string;
  modified_date: string;
  finish_date?: string;
  assigned_to?: number;
  assigned_to_extra_info?: any;
  owner: number;
  points: Record<string, number>;
  total_points: number;
  tags: string[];
  epic?: number;
  version: number;
}

export interface Task {
  id: number;
  ref: number;
  user_story: number;
  project: number;
  subject: string;
  description: string;
  status: number;
  is_closed: boolean;
  created_date: string;
  modified_date: string;
  finished_date?: string;
  assigned_to?: number;
  assigned_to_extra_info?: any;
  owner: number;
  tags: string[];
  milestone?: number;
  version: number;
}

export interface Issue {
  id: number;
  ref: number;
  project: number;
  milestone?: number;
  subject: string;
  description: string;
  type: number;
  status: number;
  priority: number;
  severity: number;
  is_closed: boolean;
  created_date: string;
  modified_date: string;
  finished_date?: string;
  assigned_to?: number;
  assigned_to_extra_info?: any;
  owner: number;
  tags: string[];
  version: number;
}

export interface Comment {
  id: string;
  comment: string;
  created_date: string;
  user: {
    id: number;
    username: string;
    full_name: string;
  };
}

export interface Attachment {
  id: number;
  project: number;
  name: string;
  attached_file: string;
  size: number;
  created_date: string;
  modified_date: string;
  object_id: number;
  order: number;
  sha1: string;
  from_comment: boolean;
  description: string;
  is_deprecated: boolean;
  url: string;
  thumbnail_card_url?: string;
}

export interface Epic {
  id: number;
  ref: number;
  project: number;
  subject: string;
  description: string;
  color: string;
  created_date: string;
  modified_date: string;
  epics_order: number;
  client_requirement: boolean;
  team_requirement: boolean;
  assigned_to?: number;
  user_stories: number[];
  version: number;
}

export interface WikiPage {
  id: number;
  project: number;
  slug: string;
  content: string;
  owner: number;
  created_date: string;
  modified_date: string;
  last_modifier: number;
  html: string;
  is_watcher: boolean;
  watchers: number[];
  version: number;
}

export interface MilestoneStats {
  id: number;
  name: string;
  slug: string;
  total_points: number;
  closed_points: number;
  completion_percentage: number;
  estimated_start: string;
  estimated_finish: string;
  closed: boolean;
  total_userstories: number;
  completed_userstories: number;
  total_tasks: number;
  completed_tasks: number;
  iocaine_doses: number;
  days?: {
    name: string;
    open: number;
    closed: number;
  }[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  email: string;
  color: string;
  bio: string;
  lang: string;
  theme: string;
  timezone: string;
  is_active: boolean;
  photo?: string;
}

// Query types for advanced search
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'contains';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Batch operation types
export interface BatchCreateIssue {
  project_id: number;
  subject: string;
  description?: string;
  type?: number;
  status?: number;
  priority?: number;
  severity?: number;
  tags?: string[];
  milestone?: number;
}

export interface BatchCreateUserStory {
  project_id: number;
  subject: string;
  description?: string;
  status?: number;
  tags?: string[];
  milestone?: number;
}

export interface BatchCreateTask {
  user_story: number;
  subject: string;
  description?: string;
  status?: number;
  tags?: string[];
}

// Response wrapper types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
