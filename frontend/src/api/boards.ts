import { request } from './client';
import type {
  Board,
  BoardCreatePayload,
  BoardUpdatePayload,
  BoardListResponse,
} from '../types/board';

export async function getProjectBoards(projectId: number): Promise<Board[]> {
  const data = await request<BoardListResponse>(`/projects/${projectId}/boards/`);
  return data.boards || [];
}

export async function getBoard(boardId: number): Promise<Board> {
  return request<Board>(`/boards/${boardId}/`);
}

export async function createBoard(
  projectId: number,
  payload: BoardCreatePayload
): Promise<Board> {
  return request<Board>(`/projects/${projectId}/boards/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBoard(
  boardId: number,
  payload: BoardUpdatePayload
): Promise<Board> {
  return request<Board>(`/boards/${boardId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteBoard(boardId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/boards/${boardId}/`, {
    method: 'DELETE',
  });
}
