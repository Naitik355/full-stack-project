import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../../src/api/projects';
import { ProjectMembersPanel } from '../components/projects/ProjectMembersPanel';
import { ProjectDocumentsPanel } from '../components/projects/ProjectDocumentsPanel';
import { getProjectTasks } from '../../src/api/tasks';
import { getProjectBoards, deleteBoard } from '../../src/api/boards';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { BoardCard } from '../components/boards/BoardCard';
import { CreateBoardModal } from '../components/boards/CreateBoardModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { DeleteProjectDialog } from '../components/projects/DeleteProjectDialog';
import { RoleBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeaderSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Presentation,
  Users,
  Settings as SettingsIcon,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Project } from '../types/project';
import type { Task } from '../types/task';
import type { Board } from '../types/board';
import { useToast } from '../context/ToastContext';

type TabType = 'tasks' | 'whiteboards' | 'docs' | 'members' | 'settings';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const idNum = parseInt(projectId || '0', 10);
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);

  const { success, error: toastError } = useToast();

  const loadProjectData = useCallback(async () => {
    if (!idNum) return;
    setIsLoading(true);
    setError(null);
    try {
      const proj = await getProject(idNum);
      setProject(proj);

      const [taskList, boardList] = await Promise.all([
        getProjectTasks(idNum).catch(() => []),
        getProjectBoards(idNum).catch(() => []),
      ]);

      setTasks(taskList);
      setBoards(boardList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const handleDeleteBoard = async (boardId: number) => {
    if (!confirm('Are you sure you want to delete this whiteboard?')) return;
    try {
      await deleteBoard(boardId);
      success('Whiteboard Deleted', 'Board removed from workspace.');
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Could not delete board.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <p className="font-semibold text-base mb-1">Project Not Found or Access Denied</p>
          <p className="text-xs text-rose-600">{error || 'Could not retrieve project data.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const canEdit = project.role !== 'viewer';
  const isOwner = project.role === 'owner';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={() => navigate('/projects')}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Projects
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{project.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h2>
            <RoleBadge role={project.role} />
          </div>

          {project.description && (
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProjectOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Details
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteProjectOpen(true)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.length },
          { id: 'whiteboards', label: 'Whiteboards', icon: Presentation, count: boards.length },
          { id: 'docs', label: 'Docs & Notes', icon: FileText },
          { id: 'members', label: 'Members & Roles', icon: Users },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'tasks' && (
        <TaskBoard
          tasks={tasks}
          projectId={project.id}
          canEdit={canEdit}
          onTasksChange={loadProjectData}
        />
      )}

      {activeTab === 'whiteboards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Whiteboards</h3>
              <p className="text-xs text-slate-500">
                Multiplayer Excalidraw whiteboards tied to this project
              </p>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => setIsCreateBoardOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Whiteboard
              </Button>
            )}
          </div>

          {boards.length === 0 ? (
            <EmptyState
              icon={<Presentation className="w-7 h-7" />}
              title="No whiteboards yet"
              description="Create a whiteboard to start drawing flowcharts, wireframes, and architecture diagrams in real-time."
              actionLabel={canEdit ? 'Create First Whiteboard' : undefined}
              actionIcon={<Plus className="w-4 h-4" />}
              onAction={() => setIsCreateBoardOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {boards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  projectId={project.id}
                  canEdit={canEdit}
                  onDelete={handleDeleteBoard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <ProjectDocumentsPanel projectId={project.id} canEdit={canEdit} />
      )}

      {activeTab === 'members' && (
        <ProjectMembersPanel projectId={project.id} isOwner={isOwner} />
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Project Settings</h3>
            <p className="text-xs text-slate-500">
              Manage project metadata and administrative settings.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60">
              <div>
                <p className="text-xs font-bold text-slate-800">Edit Project Details</p>
                <p className="text-[11px] text-slate-500">Update project name and description</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!canEdit}
                onClick={() => setIsEditProjectOpen(true)}
              >
                Edit
              </Button>
            </div>

            {isOwner && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40">
                <div>
                  <p className="text-xs font-bold text-rose-900">Danger Zone: Delete Project</p>
                  <p className="text-[11px] text-rose-600">
                    Permanently delete this project, all tasks, and associated whiteboards.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setIsDeleteProjectOpen(true)}
                >
                  Delete Project
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        projectId={project.id}
        onCreated={(newBoard) => {
          loadProjectData();
          navigate(`/projects/${project.id}/boards/${newBoard.id}`);
        }}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        project={project}
        onUpdated={() => {
          loadProjectData();
        }}
      />

      <DeleteProjectDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        project={project}
        onDeleted={() => {
          navigate('/projects');
        }}
      />
    </div>
  );
};
