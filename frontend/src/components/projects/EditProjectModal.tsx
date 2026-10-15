import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { updateProject } from '../../api/projects';
import { useToast } from '../../context/ToastContext';
import type { Project } from '../../types/project';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdated: (project: Project) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setError('');
    }
  }, [project]);

  if (!project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const updated = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
      });
      success('Project Updated', `Changes saved to "${updated.name}".`);
      onClose();
      onUpdated({ ...project, ...updated });
    } catch (err: any) {
      const msg = err?.message || 'Failed to update project';
      setError(msg);
      toastError('Update Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Details"
      description="Update the name or description of this project."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
};
