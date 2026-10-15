export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  dependency_id: number;
  task_id: number;
  depends_on: number;
  title: string;
  status: TaskStatus;
  is_blocking: boolean;
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: number | null;
  due_date?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: number | null;
  due_date?: string | null;
}

export interface TaskListResponse {
  tasks: Task[];
}

export interface TaskDependenciesResponse {
  dependencies: TaskDependency[];
}
