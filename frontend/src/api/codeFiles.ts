import { request } from './client';

export interface ProjectCodeFile {
  id: number;
  name: string;
  path: string;
  version: number;
  updated_at: string;
}

export interface ProjectCodeFileDetail {
  file: ProjectCodeFile;
  content: string;
}

export async function getProjectCodeFiles(projectId: number): Promise<ProjectCodeFile[]> {
  const data = await request<{ files?: ProjectCodeFile[] }>(
    `/projects/${projectId}/code-files/`
  );
  return data.files || [];
}

export async function createProjectCodeFile(
  projectId: number,
  path: string,
  content = ''
): Promise<ProjectCodeFileDetail> {
  return request<ProjectCodeFileDetail>(`/projects/${projectId}/code-files/`, {
    method: 'POST',
    body: JSON.stringify({ path, content }),
  });
}

export async function getProjectCodeFile(
  projectId: number,
  fileId: number
): Promise<ProjectCodeFileDetail> {
  return request<ProjectCodeFileDetail>(
    `/projects/${projectId}/code-files/${fileId}/`
  );
}

export async function saveProjectCodeFile(
  projectId: number,
  fileId: number,
  content: string,
  version: number
): Promise<ProjectCodeFileDetail> {
  return request<ProjectCodeFileDetail>(
    `/projects/${projectId}/code-files/${fileId}/`,
    {
      method: 'PUT',
      body: JSON.stringify({ content, version }),
    }
  );
}
