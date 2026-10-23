import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';
import { deleteProject } from '../../api/projects';
import { useToast } from '../../context/ToastContext';

export const DeleteProjectDialog = ({
  isOpen,
  onClose,
  project,
  onDeleted,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  if (!project) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteProject(project.id);
      success('Project Deleted', `"${project.name}" has been permanently removed.`);
      onClose();
      onDeleted(project.id);
    } catch (err) {
      const msg = err?.message || 'Failed to delete project. Owner permissions required.';
      toastError('Deletion Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      maxWidth="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Delete Project
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <p className="text-slate-800 font-medium">
            Are you sure you want to delete <span className="font-semibold text-slate-900">"{project.name}"</span>?
          </p>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This will permanently delete the project and all its associated tasks and whiteboards. This action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
};
