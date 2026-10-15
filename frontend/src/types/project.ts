export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface Project {
  id: number;
  name: string;
  description: string;
  role?: ProjectRole;
  created_by?: number;
  created_at?: string;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string;
}

export interface ProjectListResponse {
  projects: Project[];
}
