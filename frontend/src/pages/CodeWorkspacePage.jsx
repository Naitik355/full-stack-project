import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import {
  Code2, FileCode, Plus, Copy, Check, Users, Wifi, WifiOff, Terminal, Folder, Play, Link2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

const initialFiles = [
  { name: 'App.jsx', language: 'javascript', content: `import React from 'react';
import { ConvergeWorkspace } from './ConvergeDesk';

export default function App() {
  return (
    <ConvergeWorkspace
      theme="modern-slate"
      features={['whiteboards', 'tasks', 'code', 'meetings']}
    />
  );
}` },
  { name: 'models.py', language: 'python', content: `from django.db import models
from django.conf import settings

class CollaborativeDocument(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
` },
  { name: 'schema.sql', language: 'sql', content: `CREATE TABLE IF NOT EXISTS collaborative_sessions (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(120) NOT NULL UNIQUE,
    document_state BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);` },
];

const STORAGE_KEY = 'convergedesk-code-workspace-files-v1';
const WS_URL = import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';

function loadSavedFiles() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.every((f) => f && typeof f.name === 'string' && typeof f.language === 'string' && typeof f.content === 'string')) return parsed;
  } catch { /* Use starter files when storage is unavailable or invalid. */ }
  return initialFiles;
}

function getLanguage(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ({ js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', sql: 'sql', json: 'json', css: 'css', html: 'html', md: 'markdown' })[ext] || 'plaintext';
}

function CollaborativeMonacoEditor({ roomName, file, onContentChange, onStatus, onPeers }) {
  const [editor, setEditor] = useState(null);
  const [monaco, setMonaco] = useState(null);

  useEffect(() => {
    if (!editor || !monaco) return undefined;
    const doc = new Y.Doc();
    const sharedText = doc.getText('monaco');
    const provider = new WebsocketProvider(WS_URL, roomName, doc, { connect: true });
    const binding = new MonacoBinding(sharedText, editor.getModel(), new Set([editor]), provider.awareness);
    const user = {
      name: window.localStorage.getItem('convergedesk-display-name') || 'Collaborator',
      color: '#' + ['6366f1', '8b5cf6', '0d9488', 'ea580c'][Math.floor(Math.random() * 4)],
    };
    provider.awareness.setLocalStateField('user', user);

    const updateStatus = ({ status }) => onStatus(status);
    const updatePeers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      onPeers(states.filter((state) => state.user).map((state) => state.user));
    };
    const seedWhenSynced = (synced) => {
      if (synced && sharedText.length === 0 && file.content) {
        doc.transact(() => sharedText.insert(0, file.content), 'initial-document-content');
      }
    };

    provider.on('status', updateStatus);
    provider.on('sync', seedWhenSynced);
    provider.awareness.on('change', updatePeers);
    onStatus('connecting');

    return () => {
      provider.off('status', updateStatus);
      provider.off('sync', seedWhenSynced);
      provider.awareness.off('change', updatePeers);
      binding.destroy();
      provider.destroy();
      doc.destroy();
      onStatus('disconnected');
      onPeers([]);
    };
  }, [editor, monaco, roomName, onStatus, onPeers]);

  return (
    <Editor
      height="100%"
      language={file.language}
      theme="vs-dark"
      defaultValue={file.content}
      onMount={(instance, monacoInstance) => {
        setEditor(instance);
        setMonaco(monacoInstance);
      }}
      onChange={(value) => { if (typeof value === 'string') onContentChange(value); }}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 14, bottom: 14 },
      }}
    />
  );
}

export const CodeWorkspacePage = () => {
  const [files, setFiles] = useState(loadSavedFiles);
  const [runOutput, setRunOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [peers, setPeers] = useState([]);
  const [roomId, setRoomId] = useState(() => new URLSearchParams(window.location.search).get('room') || 'team-demo');
  const { success } = useToast();
  const currentFile = files[activeFileIndex] || files[0];
  const roomName = useMemo(() => `convergedesk-code-${roomId.trim().replace(/[^a-zA-Z0-9_-]/g, '-')}-${currentFile?.name || 'untitled'}`, [roomId, currentFile?.name]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(files)); } catch { /* Browser storage may be unavailable. */ }
  }, [files]);

  const handleContentChange = (newContent) => {
    setFiles((prev) => prev.map((f, i) => (i === activeFileIndex ? { ...f, content: newContent } : f)));
  };
  const handleRunCode = () => {
    if (!currentFile) return;
    const extension = currentFile.name.split('.').pop()?.toLowerCase();
    if (!['js', 'jsx'].includes(extension || '')) {
      setRunOutput(['Run supports .js/.jsx files only. TypeScript/TSX and Python require a configured execution or preview service.']);
      return;
    }
    setIsRunning(true);
    setRunOutput([]);
    const workerSource = "self.onmessage=function(event){var output=[];function fmt(args){return args.map(function(v){try{return typeof v==='string'?v:JSON.stringify(v)}catch(e){return String(v)}}).join(' ')};['log','info','warn','error'].forEach(function(t){console[t]=function(){output.push(t.toUpperCase()+': '+fmt(Array.from(arguments)))}});try{(new Function(event.data))();self.postMessage(output.length?output:['Program finished with no console output.'])}catch(e){self.postMessage(['ERROR: '+(e&&e.stack?e.stack:String(e))])}}";
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const worker = new Worker(blobUrl);
    const timeout = window.setTimeout(() => { worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(['Stopped: execution exceeded 2 seconds.']); setIsRunning(false); }, 2000);
    worker.onmessage = (event) => { window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(event.data); setIsRunning(false); };
    worker.onerror = (event) => { window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(['ERROR: ' + event.message]); setIsRunning(false); };
    worker.postMessage(currentFile.content);
  };
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      success('Copied to Clipboard', `Contents of ${currentFile.name} copied.`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { success('Copy failed', 'Clipboard access was not available in this browser.'); }
  };
  const handleCopyInvite = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId.trim() || 'team-demo');
    try {
      await navigator.clipboard.writeText(url.toString());
      success('Invite link copied', 'Share this link with collaborators who should join the same room.');
    } catch { success('Copy failed', 'Copy the room code from the address bar manually.'); }
  };
  const handleAddFile = () => {
    const filename = prompt('Enter new file name (e.g. index.js)');
    if (!filename || !filename.trim() || files.some((f) => f.name === filename.trim())) return;
    const newFile = { name: filename.trim(), language: getLanguage(filename.trim()), content: `// ${filename.trim()}\n` };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileIndex(files.length);
    success('File Added', filename.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider"><Code2 className="w-4 h-4" /><span>Collaborative Code Workspace</span></div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
            {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{connectionStatus === 'connected' ? 'Live sync connected' : connectionStatus === 'connecting' ? 'Connecting…' : 'Sync server unavailable'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300"><Users className="w-3.5 h-3.5 text-slate-400" /><span>{peers.length} online</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRunCode} disabled={isRunning || !currentFile} leftIcon={<Play className="w-3.5 h-3.5" />} className="text-slate-300 hover:text-white h-8 text-xs bg-slate-800 hover:bg-slate-700">{isRunning ? 'Running…' : 'Run'}</Button>
          <Button size="sm" variant="ghost" onClick={handleCopyCode} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} className="text-slate-300 hover:text-white h-8 text-xs bg-slate-800 hover:bg-slate-700">{copied ? 'Copied' : 'Copy'}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 text-xs text-indigo-200">
        <label className="flex items-center gap-2">Room code
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-36 rounded border border-indigo-800 bg-slate-900 px-2 py-1 text-slate-100 outline-none" aria-label="Collaboration room code" />
        </label>
        <button type="button" onClick={handleCopyInvite} className="inline-flex items-center gap-1 underline hover:text-white"><Link2 className="h-3.5 w-3.5" />Copy invite link</button>
        <span className="text-amber-300">Prototype rooms are not access-controlled. Do not put secrets or private code here.</span>
      </div>

      <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-2">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-300"><Terminal className="h-3.5 w-3.5" /> Run Output <button type="button" onClick={() => setRunOutput([])} className="ml-auto text-slate-500 hover:text-white">Clear</button></div>
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-300">{runOutput.length ? runOutput.join('\n') : 'Run a .js or .jsx file to see output here.'}</pre>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 bg-slate-900/80 border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <span className="flex items-center gap-1.5"><Folder className="w-3.5 h-3.5 text-indigo-400" /> Workspace Files</span>
            <button onClick={handleAddFile} className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors" title="Add file"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
            {files.map((file, idx) => (
              <button key={file.name} onClick={() => setActiveFileIndex(idx)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${idx === activeFileIndex ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <FileCode className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0">
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/40 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300"><span className="text-indigo-400 font-semibold">{currentFile.name}</span><span className="text-slate-500 text-[10px]">({currentFile.language})</span></div>
          </div>
          <div className="flex-1 overflow-hidden">
            {currentFile && <CollaborativeMonacoEditor key={roomName} roomName={roomName} file={currentFile} onContentChange={handleContentChange} onStatus={setConnectionStatus} onPeers={setPeers} />}
          </div>
        </div>
      </div>
    </div>
  );
};
