import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { getCookie, API_BASE_URL } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Settings,
  Shield,
  ShieldAlert,
  Server,
  Key,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  User,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [geminiKey, setGeminiKey] = useState(() => {
    return localStorage.getItem('convergedesk_gemini_key') || '';
  });

  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [csrfCookie, setCsrfCookie] = useState<string | null>(null);

  const { success, error: toastError } = useToast();

  const runDiagnostics = async () => {
    setApiStatus('checking');
    try {
      const res = await fetch(`${API_BASE_URL}/projects/list/`, {
        credentials: 'include',
      });
      if (res.ok || res.status === 401 || res.status === 403 || res.redirected) {
        setApiStatus('connected');
      } else {
        setApiStatus('disconnected');
      }
    } catch {
      setApiStatus('disconnected');
    }

    setCsrfCookie(getCookie('csrftoken'));
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleSaveGeminiKey = () => {
    localStorage.setItem('convergedesk_gemini_key', geminiKey);
    success('AI Key Saved', 'Gemini API key stored in local browser settings.');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Settings & Diagnostics
        </h2>
        <p className="text-xs text-slate-500">
          Manage system configurations, integration endpoints, and security documentation
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">User Session & Identity</h3>
          </div>
          {isAuthenticated && (
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Authenticated Session
            </span>
          )}
        </div>

        {isAuthenticated && user ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">User ID</span>
              <span className="font-mono font-semibold text-slate-800">#{user.id}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Username</span>
              <span className="font-semibold text-slate-800">{user.username}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Email</span>
              <span className="text-slate-800 truncate block">{user.email || 'None'}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No authenticated session active.</p>
        )}

        {isAuthenticated && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Sign Out
            </Button>
          </div>
        )}
      </Card>

      {/* Diagnostics and Health */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Backend Diagnostics</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={runDiagnostics}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />}
          >
            Check Status
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          {/* API Connectivity */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">Django REST API</p>
              <p className="text-[11px] text-slate-500 font-mono">{API_BASE_URL}</p>
            </div>
            {apiStatus === 'checking' ? (
              <span className="text-slate-400 font-medium">Checking...</span>
            ) : apiStatus === 'connected' ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Reachable
              </span>
            ) : (
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <XCircle className="w-4 h-4" /> Unreachable
              </span>
            )}
          </div>

          {/* CSRF Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">CSRF Token Cookie</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {csrfCookie ? `csrftoken: ${csrfCookie.substring(0, 16)}...` : 'No csrftoken cookie detected in document'}
              </p>
            </div>
            {csrfCookie ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Active
              </span>
            ) : (
              <span className="text-amber-600 font-medium">Dev Mode (CSRF-exempt)</span>
            )}
          </div>
        </div>
      </Card>

      {/* AI Configuration */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Key className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">AI Configuration</h3>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Gemini API Key (Drawing-to-Code Generation)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button size="sm" onClick={handleSaveGeminiKey}>Save</Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Used by the AI Drawing-to-Code panel to generate React and Tailwind code from whiteboard drawings.
          </p>
        </div>
      </Card>

      {/* Security Architecture Documentation */}
      <Card className="space-y-3 bg-amber-50/50 border-amber-200/80">
        <div className="flex items-center gap-2 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold">Documented Security Architecture & Limitations</h3>
        </div>

        <div className="space-y-3 text-xs text-amber-900/90 leading-relaxed">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60">
            <p className="font-bold text-amber-950 mb-1">1. CSRF Status & Development Exemption</p>
            <p>
              The Django backend currently uses temporary <code className="bg-amber-100 px-1 rounded font-mono">@csrf_exempt</code> decorators on endpoints during development. In production:
              CORS, trusted origins (<code className="bg-amber-100 px-1 rounded font-mono">CSRF_TRUSTED_ORIGINS</code>), and CSRF token transmission via cookies and <code className="bg-amber-100 px-1 rounded font-mono">X-CSRFToken</code> headers must be fully enabled across all mutative requests. The frontend client is already programmed to extract and forward the <code className="bg-amber-100 px-1 rounded font-mono">csrftoken</code> cookie.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60">
            <p className="font-bold text-amber-950 mb-1">2. Multiplayer Whiteboard Room Authorization Limitation</p>
            <p>
              The ConvergeDesk Django API enforces authorization on board metadata via project membership checks (<code className="bg-amber-100 px-1 rounded font-mono">GET/PATCH/DELETE /api/boards/&lt;id&gt;/</code>).
              The current tldraw demo sync service is public and does not enforce this application's Django session or project-membership authorization. Anyone who knows the room ID may be able to access or modify the room. Use it only for local testing with non-sensitive data; production use requires a self-hosted sync service with authentication and authorization.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
