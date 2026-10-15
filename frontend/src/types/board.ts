export interface Board {
  id: number;
  project_id?: number;
  title: string;
  room_id: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BoardListResponse {
  boards: Board[];
}

export interface BoardCreatePayload {
  title: string;
}

export interface BoardUpdatePayload {
  title: string;
}
