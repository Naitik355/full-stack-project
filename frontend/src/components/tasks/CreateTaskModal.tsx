import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { createTask } from '../../api/tasks';
import { useToast } from '../../context/ToastContext';
import type { Task, TaskStatus, TaskPriority } from '../../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onCreated: (task: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const created = await createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
      });
      success('Task Created', `Task "${created.title}" added to project.`);
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      onClose();
      onCreated(created);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create task';
      setError(msg);
      toastError('Creation Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add an actionable work item with priority and due date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Create Task
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Implement authentication flows"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
          required
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Detailed task specifications and acceptance criteria..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
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
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>
        <Input
          label="Due Date (Optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </form>
    </Modal>
  );
};
