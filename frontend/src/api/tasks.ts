import { request } from './client';
import type {
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  TaskListResponse,
  TaskDependency,
  TaskDependenciesResponse,
} from '../types/task';

export async function getProjectTasks(projectId: number): Promise<Task[]> {
  const data = await request<TaskListResponse>(`/projects/${projectId}/tasks/`);
  return data.tasks || [];
}

export async function createTask(
  projectId: number,
  payload: TaskCreatePayload
): Promise<Task> {
  const response = await request<{
    message: string;
    id: number;
    title: string;
    status: any;
    priority: any;
  }>(`/projects/${projectId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: response.id,
    title: response.title,
    description: payload.description || '',
    status: response.status,
    priority: response.priority,
    assigned_to: payload.assigned_to ?? null,
    created_by: 0,
    due_date: payload.due_date ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateTask(
  taskId: number,
  payload: TaskUpdatePayload
): Promise<Partial<Task>> {
  return request<Partial<Task>>(`/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/tasks/${taskId}/`, {
    method: 'DELETE',
  });
}

export async function getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
  const data = await request<TaskDependenciesResponse>(`/tasks/${taskId}/dependencies/`);
  return data.dependencies || [];
}

export async function addTaskDependency(
  taskId: number,
  dependsOnTaskId: number
): Promise<{ dependency_id: number; task_id: number; depends_on: number }> {
  return request(`/tasks/${taskId}/dependencies/`, {
    method: 'POST',
    body: JSON.stringify({ depends_on: dependsOnTaskId }),
  });
}

export async function deleteTaskDependency(
  taskId: number,
  dependencyId: number
): Promise<{ message: string }> {
  return request(`/tasks/${taskId}/dependencies/${dependencyId}/`, {
    method: 'DELETE',
  });
}
