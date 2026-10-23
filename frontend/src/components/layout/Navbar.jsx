import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
  User as UserIcon,
  LogOut,
  Settings,
  FolderPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { GlobalSearch } from '../common/GlobalSearch';
import { CreateProjectModal } from '../projects/CreateProjectModal';

export const Navbar = ({ onOpenMobileMenu }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // Derive dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects/') && path.includes('/boards/')) return 'Whiteboard Canvas';
    if (path.startsWith('/projects/')) return 'Project Workspace';
    if (path === '/projects') return 'Projects';
    if (path === '/tasks') return 'Task Management';
    if (path === '/whiteboards') return 'Multiplayer Whiteboards';
    if (path === '/code') return 'Code Workspace';
    if (path === '/meetings') return 'Meetings & Calls';
    if (path === '/settings') return 'Settings & Diagnostics';
    if (path === '/login') return 'Sign In';
    if (path === '/signup') return 'Create Account';
    return 'ConvergeDesk';
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-xs border-b border-slate-200/80">
        {/* Left: Mobile hamburger & breadcrumb / title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl md:hidden"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors sm:w-56 justify-between group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="hidden sm:inline">Search anything...</span>
              <span className="sm:hidden">Search</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Quick Create Project */}
          {isAuthenticated && (
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateProjectOpen(true)}
              className="hidden sm:inline-flex"
            >
              New Project
            </Button>
          )}

          {/* Notifications Placeholder */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Notifications
                  </h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="py-6 text-center text-xs text-slate-500">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">No new notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time project events will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Menu / Avatar */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 text-sm rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60"
              >
                <span className="font-semibold text-xs text-slate-700 hidden md:inline">
                  {user.username}
                </span>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.username}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email || 'Session active'}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings & Overview
                    </button>
                    <button
                      onClick={() => {
                        navigate('/projects');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                    >
                      <FolderPlus className="w-4 h-4 text-slate-400" />
                      My Projects
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<UserIcon className="w-3.5 h-3.5" />}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={(newProj) => {
          navigate(`/projects/${newProj.id}`);
        }}
      />
    </>
  );
};
