import React from 'react';
import { PriorityBadge } from '../common/Badge';
import { Calendar, CheckCircle2, Clock, MoreVertical, Link as LinkIcon, Trash2, Edit2 } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onOpenDetails: (task: Task) => void;
  onDelete: (taskId: number) => void;
  canEdit?: boolean;
  hasBlockingDependencies?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onOpenDetails,
  onDelete,
  canEdit = true,
  hasBlockingDependencies = false,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => onOpenDetails(task)}
      className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group relative"
    >
      {/* Top Header: Priority & Action Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />

        {canEdit && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="Task options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-40 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDetails(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Dependency Warning */}
      {hasBlockingDependencies && task.status !== 'done' && (
        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-800">
          <LinkIcon className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Blocked by prerequisites</span>
        </div>
      )}

      {/* Bottom Footer: Due Date & Status Selector */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          {formattedDueDate ? (
            <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDueDate}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No due date</span>
          )}
        </div>

        {/* Quick status cycle button */}
        {canEdit && (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
