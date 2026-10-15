import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Plus,
  Copy,
  Check,
  Users,
  Wifi,
  WifiOff,
  Terminal,
  Folder,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

interface WorkspaceFile {
  name: string;
  language: string;
  content: string;
}

const initialFiles: WorkspaceFile[] = [
  {
    name: 'App.tsx',
    language: 'typescript',
    content: `import React from 'react';
import { ConvergeWorkspace } from './ConvergeDesk';

export default function App() {
  return (
    <ConvergeWorkspace
      theme="modern-slate"
      features={['whiteboards', 'tasks', 'code', 'meetings']}
    />
  );
}`,
  },
  {
    name: 'models.py',
    language: 'python',
    content: `from django.db import models
from django.conf import settings

class CollaborativeDocument(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
`,
  },
  {
    name: 'schema.sql',
    language: 'sql',
    content: `CREATE TABLE IF NOT EXISTS collaborative_sessions (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(120) NOT NULL UNIQUE,
    document_state BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
  },
];

export const CodeWorkspacePage: React.FC = () => {
  const [files, setFiles] = useState<WorkspaceFile[]>(initialFiles);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const { success } = useToast();
  const currentFile = files[activeFileIndex] || files[0];

  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIndex ? { ...f, content: newContent } : f))
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    success('Copied to Clipboard', `Contents of ${currentFile.name} copied.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFile = () => {
    const filename = prompt('Enter new file name (e.g. index.ts):');
    if (!filename || !filename.trim()) return;
    const ext = filename.split('.').pop() || '';
    const lang = ext === 'py' ? 'python' : ext === 'sql' ? 'sql' : 'typescript';
    const newFile: WorkspaceFile = {
      name: filename.trim(),
      language: lang,
      content: `// ${filename.trim()}\n`,
    };
    setFiles([...files, newFile]);
    setActiveFileIndex(files.length);
    success('File Added', filename);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      {/* Top Workspace Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Code2 className="w-4 h-4" />
            <span>Collaborative Code Workspace</span>
          </div>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? 'Yjs Connected' : 'Local Edit Mode (Ready for Yjs)'}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators Presence Mockup */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-[10px] text-white">
              U1
            </span>
            <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center font-bold text-[10px] text-white -ml-2">
              U2
            </span>
            <span className="text-[11px] text-slate-300 ml-1">2 Peers</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-slate-300 hover:text-white h-8 text-xs bg-slate-800 hover:bg-slate-700"
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Integration Boundary Banner */}
      <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 text-[11px] text-indigo-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Integration Boundary: Real-time multi-cursor synchronization is designed for <code className="bg-indigo-900/60 px-1 py-0.5 rounded font-mono">y-websocket</code> and Monaco Editor. You can view, add, and test code documents interactively below.
          </span>
        </div>
        <button
          onClick={() => setIsConnected(!isConnected)}
          className="text-[10px] font-semibold underline text-indigo-200 hover:text-white"
        >
          {isConnected ? 'Simulate Disconnect' : 'Simulate Yjs Sync'}
        </button>
      </div>

      {/* Main Workspace Body: File Tree + Code Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Explorer */}
        <div className="w-56 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" /> Workspace Files
            </span>
            <button
              onClick={handleAddFile}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Add file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
            {files.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                  idx === activeFileIndex
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Editor Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/40 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <span className="text-indigo-400 font-semibold">{currentFile.name}</span>
              <span className="text-slate-500 text-[10px]">({currentFile.language})</span>
            </div>
          </div>

          {/* Code Textarea / Line Number Grid */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className="p-4 select-none text-slate-600 font-mono text-xs border-r border-slate-800/60 text-right w-12 shrink-0 bg-slate-950">
              {currentFile.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={currentFile.content}
              onChange={(e) => handleContentChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full h-full bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed resize-none focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
