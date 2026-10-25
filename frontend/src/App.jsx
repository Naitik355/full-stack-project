import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { BoardViewPage } from './pages/BoardViewPage';
import { TasksPage } from './pages/TasksPage';
import { WhiteboardsPage } from './pages/WhiteboardsPage';
import { CodeWorkspacePage } from './pages/CodeWorkspacePage';
import { MeetingsPage } from './pages/MeetingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AcceptProjectInvitationPage } from './pages/AcceptProjectInvitationPage';
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/accept-project-invitation"element={<AcceptProjectInvitationPage />}/>

            {/* Persistent Shell Layout Routes */}
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route
                path="/projects/:projectId/boards/:boardId"
                element={<BoardViewPage />}
              />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/whiteboards" element={<WhiteboardsPage />} />
              <Route path="/code" element={<CodeWorkspacePage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}