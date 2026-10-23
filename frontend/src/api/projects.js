import { request } from './client';

export async function listProjects() {
  const data = await request('/projects/list/');
  return data.projects || [];
}

export async function getProject(projectId) {
  return request(`/projects/${projectId}/`);
}

export async function createProject(payload) {
  return request('/projects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(projectId, payload) {
  return request(`/projects/${projectId}/update/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(projectId) {
  return request(`/projects/${projectId}/delete/`, {
    method: 'DELETE',
  });
}

export async function getProjectMembers(projectId) {
  const data = await request(`/projects/${projectId}/members/`);
  return Array.isArray(data) ? data : data.members || [];
}

export async function addProjectMember(projectId, username, role) {
  return request(`/projects/${projectId}/members/`, {
    method: 'POST',
    body: JSON.stringify({ username, role: role.toLowerCase() }),
  });
}

export async function updateProjectMember(projectId, userId, role) {
  return request(`/projects/${projectId}/members/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ role: role.toLowerCase() }),
  });
}

export async function removeProjectMember(projectId, userId) {
  return request(`/projects/${projectId}/members/${userId}/`, {
    method: 'DELETE',
  });
}
