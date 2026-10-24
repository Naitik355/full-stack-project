import { request } from './client';

export async function getProjectCodeFiles(projectId) {
  const data = await request(`/projects/${projectId}/code-files/`);
  return data.files || [];
}

export async function createProjectCodeFile(projectId, path, content = '') {
  return request(`/projects/${projectId}/code-files/`, {
    method: 'POST',
    body: JSON.stringify({ path, content }),
  });
}

export async function getProjectCodeFile(projectId, fileId) {
  return request(`/projects/${projectId}/code-files/${fileId}/`);
}

export async function saveProjectCodeFile(projectId, fileId, content, version) {
  return request(`/projects/${projectId}/code-files/${fileId}/`, {
    method: 'PUT',
    body: JSON.stringify({ content, version }),
  });
}

export async function renameProjectCodeFile(projectId, fileId, path) {
  return request(`/projects/${projectId}/code-files/${fileId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ path }),
  });
}

export async function deleteProjectCodeFile(projectId, fileId) {
  return request(`/projects/${projectId}/code-files/${fileId}/`, {
    method: 'DELETE',
  });
}

export function getProjectCodeFilesExportUrl(projectId) {
  return `/api/projects/${projectId}/code-files/export.zip`;
}