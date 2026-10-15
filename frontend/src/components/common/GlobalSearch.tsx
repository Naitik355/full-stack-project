import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, Presentation, Code2, Video, Settings, X, ArrowRight } from 'lucide-react';
import { listProjects } from '../../api/projects';
import type { Project } from '../../types/project';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      listProjects().then(setProjects).catch(() => setProjects([]));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavItems = [
    { label: 'Dashboard', path: '/', icon: <FolderKanban className="w-4 h-4 text-indigo-500" /> },
    { label: 'All Projects', path: '/projects', icon: <FolderKanban className="w-4 h-4 text-sky-500" /> },
    { label: 'Task Management', path: '/tasks', icon: <CheckSquare className="w-4 h-4 text-emerald-500" /> },
    { label: 'Multiplayer Whiteboards', path: '/whiteboards', icon: <Presentation className="w-4 h-4 text-amber-500" /> },
    { label: 'Code Workspace (Yjs)', path: '/code', icon: <Code2 className="w-4 h-4 text-purple-500" /> },
    { label: 'Meetings & Calls', path: '/meetings', icon: <Video className="w-4 h-4 text-rose-500" /> },
    { label: 'Settings & Security', path: '/settings', icon: <Settings className="w-4 h-4 text-slate-500" /> },
  ];

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredNav = quickNavItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:p-6 sm:pt-24">
        <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, workspaces, or features..."
              className="w-full bg-transparent px-3.5 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 rounded border border-slate-300/60">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {/* Quick Navigation */}
            {filteredNav.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Navigation
                </p>
                <div className="space-y-0.5 mt-1">
                  {filteredNav.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Projects List */}
            {projects.length > 0 && (
              <div>
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Projects ({filteredProjects.length})
                </p>
                {filteredProjects.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500 italic">No matching projects found</p>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelect(`/projects/${project.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-slate-400 truncate">{project.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize shrink-0 ml-2">
                          {project.role || 'member'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredNav.length === 0 && filteredProjects.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No matching results for "{query}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
