import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { createProject } from '../../api/projects';
import { useToast } from '../../context/ToastContext';

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const created = await createProject({
        name: name.trim(),
        description: description.trim(),
      });
      success('Project Created', `Project "${created.name}" is ready.`);
      setName('');
      setDescription('');
      onClose();
      onCreated(created);
    } catch (err) {
      const msg = err?.message || 'Failed to create project';
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
      title="Create New Project"
      description="Start a collaborative workspace for tasks, whiteboards, and code."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Next-Gen Mobile App"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          required
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Summarize project goals, scope, and key deliverables..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
};
