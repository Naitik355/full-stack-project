import { request } from './client';

export async function getProjectDocuments(projectId) {
  const data = await request(`/projects/${projectId}/documents/`);
  return Array.isArray(data) ? data : data.documents || [];
}

export async function createProjectDocument(projectId, title) {
  return request(`/projects/${projectId}/documents/`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}
