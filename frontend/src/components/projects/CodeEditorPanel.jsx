import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2,
  FilePlus2,
  FolderOpen,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Terminal,
  Download,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import {
  createProjectCodeFile,
  getProjectCodeFile,
  getProjectCodeFiles,
  saveProjectCodeFile,
  renameProjectCodeFile,
  deleteProjectCodeFile,
} from '../../api/codeFiles';

function languageForPath(path) {
  const extension = path.split('.').pop()?.toLowerCase();
  const languages = {
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

const buildFileTree = (files) => {
  const root = {};

  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;

      if (isFile) {
        current[part] = {
          type: 'file',
          file,
        };
      } else {
        if (!current[part]) {
          current[part] = {
            type: 'folder',
            children: {},
          };
        }

        current = current[part].children;
      }
    });
  });

  return root;
};

export const CodeEditorPanel = ({ projectId, canEdit }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [runOutput, setRunOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const { success, error: toastError } = useToast();
  const [expandedFolders, setExpandedFolders] = useState({});

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

  const openFile = async (file) => {
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

  const handleRename = async (file) => {
    if (!canEdit) return;

    if (
      dirty &&
      selectedFile?.id === file.id &&
      !window.confirm('Discard unsaved changes before renaming this file?')
    ) {
      return;
    }

    const newPath = window.prompt('Enter the new file path:', file.path);
    if (!newPath?.trim() || newPath.trim() === file.path) return;

    try {
      const result = await renameProjectCodeFile(
        projectId,
        file.id,
        newPath.trim()
      );

      setFiles((current) =>
        current
          .map((item) => item.id === file.id ? result.file : item)
          .sort((a, b) => a.path.localeCompare(b.path))
      );

      if (selectedFile?.id === file.id) {
        setSelectedFile(result.file);
        setVersion(result.file.version);
        setSavedContent(content);
        setConflict(false);
      }

      success('File renamed', result.file.path);
    } catch (err) {
      toastError(
        'Could not rename file',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  };

  const handleDelete = async (file) => {
    if (!canEdit) return;

    if (
      selectedFile?.id === file.id &&
      dirty &&
      !window.confirm('Delete this file and discard its unsaved changes?')
    ) {
      return;
    }

    if (!window.confirm(`Permanently delete "${file.path}"?`)) return;

    try {
      await deleteProjectCodeFile(projectId, file.id);

      setFiles((current) => current.filter((item) => item.id !== file.id));

      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
        setContent('');
        setSavedContent('');
        setVersion(1);
        setConflict(false);
      }

      success('File deleted', file.path);
    } catch (err) {
      toastError(
        'Could not delete file',
        err instanceof Error ? err.message : 'Please try again.'
      );
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
    } catch (err) {
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

  const handleRun = () => {
    if (!selectedFile) return;
    if (languageForPath(selectedFile.path) !== 'javascript') {
      setRunOutput(['Run currently supports JavaScript (.js/.jsx) files only. Other languages need a configured execution service.']);
      return;
    }
    setRunning(true);
    setRunOutput([]);
    const workerSource = [
      "self.onmessage = function(event) {",
      "  var output = [];",
      "  function format(args) { return args.map(function(value) { try { return typeof value === 'string' ? value : JSON.stringify(value); } catch (e) { return String(value); } }).join(' '); }",
      "  function send(type, args) { output.push(type + ': ' + format(args)); }",
      "  console.log = function() { send('LOG', Array.from(arguments)); };",
      "  console.info = function() { send('INFO', Array.from(arguments)); };",
      "  console.warn = function() { send('WARN', Array.from(arguments)); };",
      "  console.error = function() { send('ERROR', Array.from(arguments)); };",
      "  try { (new Function(event.data))(); self.postMessage(output.length ? output : ['Program finished with no console output.']); }",
      "  catch (error) { self.postMessage(['ERROR: ' + (error && error.stack ? error.stack : String(error))]); }",
      "};"
    ].join('\n');
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const worker = new Worker(blobUrl);
    const timeout = window.setTimeout(() => { worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(['Stopped: execution exceeded 2 seconds.']); setRunning(false); }, 2000);
    worker.onmessage = (event) => { window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(event.data); setRunning(false); };
    worker.onerror = (event) => { window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(blobUrl); setRunOutput(['ERROR: ' + event.message]); setRunning(false); };
    worker.postMessage(content);
  };
  const handleExportZip = () => {
    window.location.assign(
      `/api/projects/${projectId}/code-files/export.zip`
    );
  };
  const toggleFolder = (folderPath) => {
    setExpandedFolders((previous) => ({
      ...previous,
      [folderPath]: !previous[folderPath],
    }));
  };
  const renderTree = (nodes, parentPath = '') =>
  Object.entries(nodes)
    .sort(([nameA, nodeA], [nameB, nodeB]) => {
      if (nodeA.type !== nodeB.type) {
        return nodeA.type === 'folder' ? -1 : 1;
      }

      return nameA.localeCompare(nameB);
    })
    .map(([name, node]) => {
      const nodePath = parentPath
        ? `${parentPath}/${name}`
        : name;

      if (node.type === 'folder') {
        const isExpanded = Boolean(expandedFolders[nodePath]);

        return (
          <div key={nodePath}>
            <button
              type="button"
              onClick={() => toggleFolder(nodePath)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              style={{
                paddingLeft: `${8 + nodePath.split('/').length * 8}px`,
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-all">{name}</span>
            </button>

            {isExpanded && (
              <div>{renderTree(node.children, nodePath)}</div>
            )}
          </div>
        );
      }

      const file = node.file;
      const isSelected = selectedFile?.id === file.id;

      return (
        <div
          key={file.id}
          className={`flex items-center gap-1 rounded-lg px-2 ${
            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={() => void openFile(file)}
            className={`flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1 py-2 text-left text-sm ${
              isSelected ? 'text-indigo-700' : 'text-slate-700'
            }`}
            style={{
              paddingLeft: `${8 + nodePath.split('/').length * 8}px`,
            }}
            title={file.path}
          >
            <Code2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-all">{name}</span>
          </button>

          {canEdit && (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                title={`Rename ${file.path}`}
                aria-label={`Rename ${file.path}`}
                onClick={() => void handleRename(file)}
                className="rounded p-2 text-slate-500 hover:bg-white hover:text-indigo-600"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                title={`Delete ${file.path}`}
                aria-label={`Delete ${file.path}`}
                onClick={() => void handleDelete(file)}
                className="rounded p-2 text-slate-500 hover:bg-white hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      );
    });


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
  const fileTree = useMemo(() => buildFileTree(files), [files]);
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
          <Button size="sm" variant="outline" onClick={handleExportZip} leftIcon={<Download className="h-4 w-4" />}>Download ZIP</Button>
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
          <Button size="sm" variant="outline" onClick={handleRun} disabled={!selectedFile || running}
            leftIcon={running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}>
            {running ? 'Running…' : 'Run'}
          </Button>
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
             {renderTree(fileTree)}
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
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2.5 text-xs font-semibold">
          <Terminal className="h-4 w-4" /> Run output
          <button type="button" className="ml-auto text-slate-300 hover:text-white" onClick={() => setRunOutput([])}>Clear</button>
        </div>
        <pre className="max-h-48 min-h-16 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs">{runOutput.length ? runOutput.join('\n') : 'Run a JavaScript (.js) file to see console output here.'}</pre>
      </section>
      <p className="text-[11px] leading-5 text-slate-500">
        JavaScript runs in a temporary browser worker with a 2-second timeout. This is a preview, not a secure sandbox. Python, TypeScript, and other languages need a server-side execution service. GitHub sync and real-time collaboration are not included.
      </p>
    </div>
      );
};
