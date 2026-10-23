import React, { useEffect, useMemo, useState } from 'react';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '../common/Button';
import { Plus, Search, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { updateTask, deleteTask } from '../../api/tasks';
import { getProjectMembers } from '../../api/projects';
import { useToast } from '../../context/ToastContext';

export const TaskBoard = ({ tasks = [], projectId, canEdit = true, onTasksChange }) => {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [members, setMembers] = useState([]);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    let active = true;
    getProjectMembers(projectId)
      .then((results) => { if (active) setMembers(results); })
      .catch(() => { if (active) setMembers([]); });
    return () => { active = false; };
  }, [projectId]);

  const memberNames = useMemo(() => new Map(
    members.map((member) => [member.user_id ?? member.id, member.username])
  ), [members]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      success('Status Updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
      onTasksChange();
    } catch (err) {
      toastError('Update Failed', err?.message || 'Failed to update status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      success('Task Deleted', 'Task removed successfully.');
      onTasksChange();
    } catch (err) {
      toastError('Delete Failed', err?.message || 'Failed to delete task.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const columns = [
    { id: 'todo', label: 'To Do', icon: <CircleDot className="w-4 h-4 text-slate-500" />, color: 'border-t-slate-400' },
    { id: 'in_progress', label: 'In Progress', icon: <Clock className="w-4 h-4 text-indigo-500" />, color: 'border-t-indigo-500' },
    { id: 'done', label: 'Done', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: 'border-t-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="all">All Priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        {canEdit && <Button size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Task</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`flex flex-col rounded-2xl bg-slate-100/70 border border-slate-200/80 p-3.5 border-t-4 ${col.color}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">{col.icon}<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{col.label}</span></div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-2xs border border-slate-200/60">{colTasks.length}</span>
              </div>
              <div className="space-y-2.5 min-h-[160px]">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">No {col.label.toLowerCase()} tasks</div>
                ) : colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} assigneeName={task.assigned_to == null ? undefined : memberNames.get(task.assigned_to)} canEdit={canEdit} onStatusChange={handleStatusChange} onOpenDetails={setSelectedTask} onDelete={handleDeleteTask} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} projectId={projectId} onCreated={() => onTasksChange()} />
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        projectTasks={tasks}
        members={members}
        canEdit={canEdit}
        onTaskUpdated={() => onTasksChange()}
        onTaskDeleted={() => onTasksChange()}
      />
    </div>
  );
};
