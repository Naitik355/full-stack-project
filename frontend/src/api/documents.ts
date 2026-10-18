import { request } from './client';

export interface ProjectDocument {
  id: number;
  title: string;
  pad_id: string;
  embed_url: string;
  created_at?: string;
}

export async function getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
  const data = await request<{ documents?: ProjectDocument[] } | ProjectDocument[]>(
    `/projects/${projectId}/documents/`
  );
  return Array.isArray(data) ? data : data.documents || [];
}

export async function createProjectDocument(
  projectId: number,
  title: string
): Promise<ProjectDocument> {
  return request<ProjectDocument>(`/projects/${projectId}/documents/`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}
