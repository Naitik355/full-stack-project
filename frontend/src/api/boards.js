import { request } from './client';

export async function getProjectBoards(projectId) {
  const data = await request(`/projects/${projectId}/boards/`);
  return data.boards || [];
}

export async function getBoard(boardId) {
  return request(`/boards/${boardId}/`);
}

export async function createBoard(projectId, payload) {
  return request(`/projects/${projectId}/boards/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBoard(boardId, payload) {
  return request(`/boards/${boardId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteBoard(boardId) {
  return request(`/boards/${boardId}/`, {
    method: 'DELETE',
  });
}
