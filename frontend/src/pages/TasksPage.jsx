import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import { getProjectTasks, updateTask, deleteTask } from '../api/tasks';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { TableRowSkeleton } from '../components/common/LoadingSkeleton';
import { CheckSquare, Search, Filter, RefreshCw, FolderKanban } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const loadAllTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectList = await listProjects();

      const allTasks = [];

      await Promise.all(
        projectList.map(async (p) => {
          try {
            const projectTasks = await getProjectTasks(p.id);
            projectTasks.forEach((t) => {
              allTasks.push({ ...t, projectName: p.name });
            });
          } catch {
            // continue
          }
        })
      );

      setTasks(allTasks);
    } catch {
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      success('Status Updated', `Task moved to ${newStatus}`);
      loadAllTasks();
    } catch (err) {
      toastError('Update Failed', err?.message || 'Could not update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      success('Task Deleted', 'Task removed.');
      loadAllTasks();
    } catch (err) {
      toastError('Delete Failed', err?.message || 'Could not delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Task Management
          </h2>
          <p className="text-xs text-slate-500">
            All active tasks across your workspaces
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAllTasks}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-7 h-7" />}
          title={search ? 'No matching tasks' : 'No tasks created yet'}
          description="Create tasks inside your project workspaces to track work and sprint items."
          actionLabel="View Projects"
          actionIcon={<FolderKanban className="w-4 h-4" />}
          onAction={() => navigate('/projects')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="relative">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 px-1 truncate flex items-center gap-1">
                <FolderKanban className="w-3 h-3 text-indigo-500" />
                <span>{task.projectName}</span>
              </div>
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onOpenDetails={(t) => setSelectedTask(t)}
                onDelete={handleDeleteTask}
              />
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        projectTasks={tasks}
        onTaskUpdated={loadAllTasks}
        onTaskDeleted={loadAllTasks}
      />
    </div>
  );
};
