import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Plus, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import {
  createProjectDocument,
  getProjectDocuments,
  type ProjectDocument,
} from '../../api/documents';

interface ProjectDocumentsPanelProps {
  projectId: number;
  canEdit: boolean;
}

export const ProjectDocumentsPanel: React.FC<ProjectDocumentsPanelProps> = ({
  projectId,
  canEdit,
}) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { success, error: toastError } = useToast();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getProjectDocuments(projectId);
      setDocuments(items);
      setSelectedDocument((current) =>
        current ? items.find((item) => item.id === current.id) || null : null
      );
    } catch (err) {
      toastError(
        'Could not load documents',
        err instanceof Error ? err.message : 'Check that the Docs API is configured.'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, toastError]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setCreating(true);
    try {
      const document = await createProjectDocument(projectId, cleanTitle);
      setDocuments((current) => [document, ...current]);
      setSelectedDocument(document);
      setTitle('');
      setShowCreateForm(false);
      success('Document created', 'Your project document is ready to edit.');
    } catch (err) {
      toastError(
        'Could not create document',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Docs & Notes</h3>
          <p className="mt-1 text-xs text-slate-500">
            Collaborate on project notes without leaving ConvergeDesk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadDocuments()} disabled={loading}
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setShowCreateForm((current) => !current)}
              leftIcon={<Plus className="h-4 w-4" />}>
              New document
            </Button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            autoFocus
            placeholder="Document title, e.g. Project meeting notes"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <Button type="submit" size="sm" isLoading={creating} disabled={!title.trim()}>
            Create
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
            Cancel
          </Button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Project documents ({documents.length})
          </p>
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
            </div>
          ) : documents.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">
              No documents yet. {canEdit ? 'Create one to get started.' : 'A project editor can create one.'}
            </div>
          ) : (
            <div className="space-y-1">
              {documents.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setSelectedDocument(document)}
                  className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedDocument?.id === document.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{document.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {selectedDocument ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-slate-900">{selectedDocument.title}</h4>
                  <p className="text-[11px] text-slate-500">Edits are handled by Etherpad.</p>
                </div>
                <a
                  href={selectedDocument.embed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Open separately <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <iframe
                key={selectedDocument.id}
                src={selectedDocument.embed_url}
                title={`Collaborative editor: ${selectedDocument.title}`}
                className="h-[65vh] min-h-[480px] w-full bg-white"
                allow="clipboard-read; clipboard-write"
              />
            </>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                <FileText className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Your project documents</h4>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Choose a document to open the collaborative editor here.
              </p>
            </div>
          )}
        </section>
      </div>
      <p className="text-[11px] leading-5 text-slate-500">
        Access to this panel is checked by ConvergeDesk. The backend must also enforce project membership
        and Etherpad pad permissions; hiding this UI alone is not a security boundary.
      </p>
    </div>
  );
};
