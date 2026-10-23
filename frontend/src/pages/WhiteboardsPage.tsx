import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import { getProjectBoards, deleteBoard } from '../api/boards';
import { BoardCard } from '../components/boards/BoardCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { Presentation, Search, RefreshCw, FolderKanban } from 'lucide-react';
import type { Board } from '../types/board';
import type { Project } from '../types/project';
import { useToast } from '../context/ToastContext';

interface BoardWithProject extends Board {
  projectName: string;
}

export const WhiteboardsPage: React.FC = () => {
  const [boards, setBoards] = useState<BoardWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const loadAllBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectList = await listProjects();
      setProjects(projectList);

      const allBoards: BoardWithProject[] = [];

      await Promise.all(
        projectList.map(async (p) => {
          try {
            const projectBoards = await getProjectBoards(p.id);
            projectBoards.forEach((b) => {
              allBoards.push({ ...b, project_id: p.id, projectName: p.name });
            });
          } catch {
            // continue
          }
        })
      );

      setBoards(allBoards);
    } catch {
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllBoards();
  }, [loadAllBoards]);

  const handleDeleteBoard = async (boardId: number) => {
    if (!confirm('Are you sure you want to delete this whiteboard?')) return;
    try {
      await deleteBoard(boardId);
      success('Board Deleted', 'Whiteboard removed.');
      loadAllBoards();
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Could not delete board.');
    }
  };

  const filteredBoards = boards.filter((b) => {
    return (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.projectName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Multiplayer Whiteboards
          </h2>
          <p className="text-xs text-slate-500">
            Real-time collaborative tldraw whiteboards across your team projects
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAllBoards}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search whiteboards by title or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredBoards.length === 0 ? (
        <EmptyState
          icon={<Presentation className="w-7 h-7" />}
          title={search ? 'No matching whiteboards' : 'No whiteboards created yet'}
          description="Open any of your projects to launch a collaborative tldraw whiteboard."
          actionLabel="View Projects"
          actionIcon={<FolderKanban className="w-4 h-4" />}
          onAction={() => navigate('/projects')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBoards.map((board) => (
            <div key={board.id} className="relative">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 px-1 truncate flex items-center gap-1">
                <FolderKanban className="w-3 h-3 text-violet-500" />
                <span>{board.projectName}</span>
              </div>
              <BoardCard
                board={board}
                projectId={board.project_id || 0}
                onDelete={handleDeleteBoard}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
