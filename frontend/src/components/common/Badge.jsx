import React from 'react';

export const Badge = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/60',
  }[variant];

  const dotStyles = {
    slate: 'bg-slate-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    sky: 'bg-sky-500',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      <span>{children}</span>
    </span>
  );
};

export const RoleBadge = ({ role = 'editor' }) => {
  const normalized = role.toLowerCase();
  if (normalized === 'owner') {
    return <Badge variant="purple" dot>Owner</Badge>;
  }
  if (normalized === 'editor') {
    return <Badge variant="indigo" dot>Editor</Badge>;
  }
  return <Badge variant="slate" dot>Viewer</Badge>;
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'done':
      return <Badge variant="emerald" dot>Done</Badge>;
    case 'in_progress':
      return <Badge variant="indigo" dot>In Progress</Badge>;
    case 'todo':
    default:
      return <Badge variant="slate" dot>To Do</Badge>;
  }
};

export const PriorityBadge = ({ priority }) => {
  switch (priority) {
    case 'high':
      return <Badge variant="rose" size="sm">High Priority</Badge>;
    case 'medium':
      return <Badge variant="amber" size="sm">Medium</Badge>;
    case 'low':
    default:
      return <Badge variant="slate" size="sm">Low</Badge>;
  }
};
