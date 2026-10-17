import { request } from './client';
import type {
  Project,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  ProjectListResponse,
} from '../types/project';

export async function listProjects(): Promise<Project[]> {
  const data = await request<ProjectListResponse>('/projects/list/');
  return data.projects || [];
}

export async function getProject(projectId: number): Promise<Project> {
  return request<Project>(`/projects/${projectId}/`);
}

export async function createProject(payload: ProjectCreatePayload): Promise<Project> {
  return request<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  projectId: number,
  payload: ProjectUpdatePayload
): Promise<Project> {
  return request<Project>(`/projects/${projectId}/update/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(projectId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/projects/${projectId}/delete/`, {
    method: 'DELETE',
  });
}


export type ProjectMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ProjectMember {
  id?: number;
  user_id?: number;
  username: string;
  email?: string;
  role: ProjectMemberRole | 'owner' | 'editor' | 'viewer';
}

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const data = await request<{ members?: ProjectMember[] } | ProjectMember[]>(
    `/projects/${projectId}/members/`
  );
  return Array.isArray(data) ? data : data.members || [];
}

export async function addProjectMember(
  projectId: number,
  username: string,
  role: 'EDITOR' | 'VIEWER'
): Promise<unknown> {
  return request(`/projects/${projectId}/members/`, {
    method: 'POST',
    body: JSON.stringify({ username, role }),
  });
}

export async function updateProjectMember(
  projectId: number,
  userId: number,
  role: 'EDITOR' | 'VIEWER'
): Promise<unknown> {
  return request(`/projects/${projectId}/members/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeProjectMember(
  projectId: number,
  userId: number
): Promise<unknown> {
  return request(`/projects/${projectId}/members/${userId}/`, {
    method: 'DELETE',
  });
}
