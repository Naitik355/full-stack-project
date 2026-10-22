import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, FilePlus2, FolderOpen, Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import {
  createProjectCodeFile,
  getProjectCodeFile,
  getProjectCodeFiles,
  saveProjectCodeFile,
  type ProjectCodeFile,
} from '../../api/codeFiles';

interface CodeEditorPanelProps {
  projectId: number;
  canEdit: boolean;
}

function languageForPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
  };
  return (extension && languages[extension]) || 'plaintext';
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ projectId, canEdit }) => {
  const [files, setFiles] = useState<ProjectCodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectCodeFile | null>(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [conflict, setConflict] = useState(false);
  const { success, error: toastError } = useToast();

  const dirty = content !== savedContent;

  const loadFiles = useCallback(async (keepSelection = true) => {
    setLoading(true);
    try {
      const items = await getProjectCodeFiles(projectId);
      setFiles(items);
      const current = keepSelection && selectedFile
        ? items.find((file) => file.id === selectedFile.id) || null
        : null;
      if (!current) {
        setSelectedFile(null);
        setContent('');
        setSavedContent('');
        setConflict(false);
      }
    } catch (err) {
      toastError('Could not load code files', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFile, toastError]);

  useEffect(() => {
    void loadFiles(false);
    // Load once for each project.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openFile = async (file: ProjectCodeFile) => {
    if (dirty && !window.confirm('Discard your unsaved changes and open another file?')) return;
    setOpening(true);
    try {
      const result = await getProjectCodeFile(projectId, file.id);
      setSelectedFile(result.file);
      setContent(result.content);
      setSavedContent(result.content);
      setVersion(result.file.version);
      setConflict(false);
    } catch (err) {
      toastError('Could not open file', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  const handleCreate = async () => {
    if (dirty && !window.confirm('Discard your unsaved changes and create a file?')) return;
    const path = window.prompt('File path (example: src/main.py):');
    if (!path?.trim()) return;
    setCreating(true);
    try {
      const result = await createProjectCodeFile(projectId, path.trim(), '');
      setFiles((current) => [...current, result.file].sort((a, b) => a.path.localeCompare(b.path)));
      setSelectedFile(result.file);
      setContent(result.content);
      setSavedContent(result.content);
      setVersion(result.file.version);
      setConflict(false);
      success('File created', result.file.path);
    } catch (err) {
      toastError('Could not create file', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !dirty || !canEdit) return;
    setSaving(true);
    try {
      const result = await saveProjectCodeFile(projectId, selectedFile.id, content, version);
      setSelectedFile(result.file);
      setVersion(result.file.version);
      setSavedContent(result.content);
      setConflict(false);
      setFiles((current) => current.map((file) => file.id === result.file.id ? result.file : file));
      success('File saved', result.file.path);
    } catch (err: any) {
      if (err?.status === 409) {
        setConflict(true);
        toastError('Save conflict', 'This file changed on the server. Reload it before saving your edits.');
      } else {
        toastError('Could not save file', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedFile) return;
    if (dirty && !window.confirm('Reload this file and discard your unsaved changes?')) return;
    setOpening(true);
    try {
      const result = await getProjectCodeFile(projectId, selectedFile.id);
      setSelectedFile(result.file);
      setContent(result.content);
      setSavedContent(result.content);
      setVersion(result.file.version);
      setConflict(false);
    } catch (err) {
      toastError('Could not reload file', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  const language = useMemo(
    () => selectedFile ? languageForPath(selectedFile.path) : 'plaintext',
    [selectedFile]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Code Editor</h3>
          <p className="mt-1 text-xs text-slate-500">
            Edit project code files in the browser. Changes are saved explicitly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadFiles()} disabled={loading}
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}>
            Refresh files
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => void handleCreate()} disabled={creating}
              leftIcon={creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}>
              New file
            </Button>
          )}
          <Button size="sm" onClick={() => void handleSave()} disabled={!canEdit || !selectedFile || !dirty || saving || conflict}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            Save
          </Button>
        </div>
      </div>

      {conflict && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The server has a newer version of this file. Reload it before making further saves.
          <button type="button" onClick={() => void refreshSelected()} className="ml-2 font-semibold underline">
            Reload file
          </button>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            <FolderOpen className="h-4 w-4" /> Files ({files.length})
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading files…</div>
          ) : files.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No code files yet. {canEdit ? 'Create a file to begin.' : 'An editor can create files.'}</p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto p-2">
              {files.map((file) => (
                <button key={file.id} type="button" onClick={() => void openFile(file)}
                  className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm ${selectedFile?.id === file.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Code2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-all">{file.path}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0 truncate text-sm font-semibold text-slate-800">
              {selectedFile?.path || 'Select a file'}
              {dirty && <span className="ml-2 text-amber-600">● Unsaved</span>}
            </div>
            {selectedFile && <span className="shrink-0 text-[11px] text-slate-500">{canEdit ? 'Editable' : 'Read only'}</span>}
          </div>
          {selectedFile ? (
            <div className="relative">
              {opening && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>}
              <Editor
                height="62vh"
                language={language}
                theme="vs"
                value={content}
                onChange={(value) => setContent(value ?? '')}
                options={{
                  readOnly: !canEdit,
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                }}
              />
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <Code2 className="mb-3 h-8 w-8 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-800">Choose a code file</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Select a file from the explorer or create a new one to start editing.</p>
            </div>
          )}
        </section>
      </div>
      <p className="text-[11px] leading-5 text-slate-500">
        Access is enforced by the API as well as this interface. GitHub synchronization and real-time collaboration are not included in this first version.
      </p>
    </div>
  );
};
