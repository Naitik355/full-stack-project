import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listProjects } from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import { getProjectBoards } from '../api/boards';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { DeleteProjectDialog } from '../components/projects/DeleteProjectDialog';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  FolderKanban,
  CheckSquare,
  Presentation,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Aggregated summary stats
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalBoards, setTotalBoards] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectList = await listProjects();
      setProjects(projectList);

      // Fetch task and board counts for user's projects
      let taskCount = 0;
      let boardCount = 0;

      // Parallel fetch for up to 5 recent projects to aggregate metrics
      const detailPromises = projectList.slice(0, 5).map(async (p) => {
        try {
          const [tasks, boards] = await Promise.all([
            getProjectTasks(p.id).catch(() => []),
            getProjectBoards(p.id).catch(() => []),
          ]);
          taskCount += tasks.length;
          boardCount += boards.length;
        } catch {
          // ignore individual project fetch error
        }
      });

      await Promise.all(detailPromises);
      setTotalTasks(taskCount);
      setTotalBoards(boardCount);
    } catch (err) {
      if (err?.status === 401) {
        // Unauthenticated
        setError('Please log in to view your projects and dashboard.');
      } else {
        setError(err?.message || 'Failed to load projects. Ensure the Django backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setIsLoading(false);
      } else {
        fetchDashboardData();
      }
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" /> ConvergeDesk Unified Workspace
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Collaborative Project Management & Multiplayer Whiteboards
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Combine sprint tasks, real-time Excalidraw whiteboards, collaborative coding, and AI wireframe-to-code generation in a single workspace.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => navigate('/login')} size="lg">
                Sign In to Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-transparent text-white border-white/20 hover:bg-white/10"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.username || 'Collaborator'}
          </h2>
          <p className="text-sm text-slate-500">
            Here is an overview of your active projects, tasks, and collaborative boards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Projects',
            value: projects.length,
            icon: FolderKanban,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          },
          {
            label: 'Project Tasks',
            value: totalTasks,
            icon: CheckSquare,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Multiplayer Boards',
            value: totalBoards,
            icon: Presentation,
            color: 'text-violet-600 bg-violet-50 border-violet-100',
          },
          {
            label: 'Collaboration State',
            value: 'Live',
            icon: Users,
            color: 'text-sky-600 bg-sky-50 border-sky-100',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {isLoading ? '—' : stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchDashboardData}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Projects
            </h3>
            <p className="text-xs text-slate-500">
              Projects you own or participate in
            </p>
          </div>

          {projects.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Projects Grid or Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="w-7 h-7" />}
            title="No projects found"
            description="You don't have any projects yet. Create your first project to start organizing tasks and collaborating on whiteboards."
            actionLabel="Create First Project"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => setEditingProject(p)}
                onDelete={(p) => setDeletingProject(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Launchpad Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => navigate('/tasks')}
          className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Task Management
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Track kanban board items, dependencies, and priorities across your team.
          </p>
        </div>

        <div
          onClick={() => navigate('/whiteboards')}
          className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-100 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">
            <Presentation className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
            Multiplayer Whiteboards
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Draw diagrams, sketches, and wireframes in real-time with Excalidraw.
          </p>
        </div>

        <div
          onClick={() => navigate('/code')}
          className="bg-gradient-to-br from-sky-50 to-white rounded-2xl border border-sky-100 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
            AI Drawing to Code
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Turn your whiteboard wireframes directly into React & Tailwind components.
          </p>
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newProj) => {
          fetchDashboardData();
          navigate(`/projects/${newProj.id}`);
        }}
      />

      <EditProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onUpdated={() => {
          fetchDashboardData();
        }}
      />

      <DeleteProjectDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        project={deletingProject}
        onDeleted={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
