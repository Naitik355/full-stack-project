import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { createBoard } from '../../api/boards';
import { useToast } from '../../context/ToastContext';
import type { Board } from '../../types/board';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onCreated: (board: Board) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Board title is required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const created = await createBoard(projectId, {
        title: title.trim(),
      });
      success('Board Created', `Whiteboard "${created.title}" is ready.`);
      setTitle('');
      onClose();
      onCreated(created);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create board';
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
      title="Create New Whiteboard"
      description="Start a collaborative Excalidraw canvas for diagrams, sketches, and wireframes."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Create Whiteboard
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Title"
          placeholder="e.g. System Architecture Diagram"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
};
