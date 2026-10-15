import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Presentation,
  Code2,
  Video,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user, logout, isAuthenticated } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Whiteboards', href: '/whiteboards', icon: Presentation },
    { name: 'Code Workspace', href: '/code', icon: Code2 },
    { name: 'Meetings', href: '/meetings', icon: Video },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-3 overflow-hidden group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white leading-tight">
                ConvergeDesk
              </span>
              <span className="text-[10px] font-medium text-indigo-400 tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Workspace
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
        {isAuthenticated && user ? (
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email || 'Session active'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className={`p-2 ${isCollapsed ? 'text-center' : ''}`}>
            <NavLink
              to="/login"
              onClick={onCloseMobile}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 rounded-xl transition-all"
            >
              {!isCollapsed && <span>Sign In</span>}
              <LogOut className="w-4 h-4 rotate-180" />
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};
