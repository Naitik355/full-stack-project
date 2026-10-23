import { request } from './client';

export async function getProjectTasks(projectId) {
  const data = await request(`/projects/${projectId}/tasks/`);
  return data.tasks || [];
}

export async function createTask(projectId, payload) {
  const response = await request(`/projects/${projectId}/tasks/`, {
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

export async function updateTask(taskId, payload) {
  return request(`/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(taskId) {
  return request(`/tasks/${taskId}/`, {
    method: 'DELETE',
  });
}

export async function getTaskDependencies(taskId) {
  const data = await request(`/tasks/${taskId}/dependencies/`);
  return data.dependencies || [];
}

export async function addTaskDependency(taskId, dependsOnTaskId) {
  return request(`/tasks/${taskId}/dependencies/`, {
    method: 'POST',
    body: JSON.stringify({ depends_on: dependsOnTaskId }),
  });
}

export async function deleteTaskDependency(taskId, dependencyId) {
  return request(`/tasks/${taskId}/dependencies/${dependencyId}/`, {
    method: 'DELETE',
  });
}
