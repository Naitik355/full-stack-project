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
