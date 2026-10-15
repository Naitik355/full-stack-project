import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/Badge';
import {
  updateTask,
  deleteTask,
  getTaskDependencies,
  addTaskDependency,
  deleteTaskDependency,
} from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import { Link2, Plus, Trash2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, TaskDependency } from '../../types/task';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectTasks: Task[];
  onTaskUpdated: (updated: Task) => void;
  onTaskDeleted: (taskId: number) => void;
  canEdit?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  projectTasks,
  onTaskUpdated,
  onTaskDeleted,
  canEdit = true,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [selectedPrereqId, setSelectedPrereqId] = useState<string>('');
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error: toastError } = useToast();

  const loadDependencies = useCallback(async (taskId: number) => {
    setIsLoadingDeps(true);
    try {
      const deps = await getTaskDependencies(taskId);
      setDependencies(deps);
    } catch {
      setDependencies([]);
    } finally {
      setIsLoadingDeps(false);
    }
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date || '');
      loadDependencies(task.id);
    }
  }, [task, loadDependencies]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const updatedFields = await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
      });

      const fullUpdated: Task = {
        ...task,
        ...updatedFields,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
      };

      success('Task Updated', `Changes saved.`);
      onTaskUpdated(fullUpdated);
      onClose();
    } catch (err: any) {
      toastError('Save Failed', err?.message || 'Could not update task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      success('Task Deleted', 'Task removed successfully.');
      onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Could not delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedPrereqId) return;
    const prereqId = parseInt(selectedPrereqId, 10);
    try {
      await addTaskDependency(task.id, prereqId);
      success('Dependency Added', 'Prerequisite task linked.');
      setSelectedPrereqId('');
      loadDependencies(task.id);
    } catch (err: any) {
      toastError('Dependency Error', err?.message || 'Failed to add dependency.');
    }
  };

  const handleRemoveDependency = async (depId: number) => {
    try {
      await deleteTaskDependency(task.id, depId);
      success('Dependency Removed', 'Link removed.');
      loadDependencies(task.id);
    } catch (err: any) {
      toastError('Error', err?.message || 'Failed to remove dependency.');
    }
  };

  // Potential prerequisites: tasks in this project except this task itself and already linked
  const currentDepIds = new Set(dependencies.map((d) => d.depends_on));
  const availablePrereqs = projectTasks.filter(
    (t) => t.id !== task.id && !currentDepIds.has(t.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      description={`Task #${task.id} in workspace`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {canEdit ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            {canEdit && (
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />

        {/* Status, Priority, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={!canEdit}
            options={[
              { value: 'todo', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={!canEdit}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          placeholder="Detailed task description..."
        />

        {/* Dependencies Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Task Dependencies & Prerequisites
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              {dependencies.length} {dependencies.length === 1 ? 'Prerequisite' : 'Prerequisites'}
            </span>
          </div>

          {/* Current Dependencies List */}
          {isLoadingDeps ? (
            <p className="text-xs text-slate-400 py-2">Loading dependencies...</p>
          ) : dependencies.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No dependencies. This task can be started immediately.
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {dependencies.map((dep) => (
                <div
                  key={dep.dependency_id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {dep.is_blocking ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Blocking" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Completed" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">
                      #{dep.depends_on}: {dep.title}
                    </span>
                    <StatusBadge status={dep.status} />
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveDependency(dep.dependency_id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remove prerequisite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Dependency Control */}
          {canEdit && availablePrereqs.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <select
                value={selectedPrereqId}
                onChange={(e) => setSelectedPrereqId(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select prerequisite task...</option>
                {availablePrereqs.map((prereq) => (
                  <option key={prereq.id} value={prereq.id}>
                    #{prereq.id} - {prereq.title} ({prereq.status})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={!selectedPrereqId}
                onClick={handleAddDependency}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Link
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
