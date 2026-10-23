import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Trash2, Users } from 'lucide-react';
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  updateProjectMember,
} from '../../api/projects';

const roleValue = (role) => String(role).toUpperCase();

export const ProjectMembersPanel = ({
  projectId,
  isOwner,
}) => {
  const [members, setMembers] = useState([]);
  const [username, setUsername] = useState('');
  const [newRole, setNewRole] = useState('EDITOR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await getProjectMembers(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project members.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const runMemberAction = async (action, successMessage) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(successMessage);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The member action failed.');
    } finally {
      setSaving(false);
    }
  };

  const getUserId = (member) => member.user_id ?? member.id;

  return (
    <section className="max-w-3xl bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Project Members</h3>
          <p className="text-xs text-slate-500 mt-1">Manage who can access this project and what they can do.</p>
        </div>
        <button type="button" onClick={() => void loadMembers()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      {isOwner && (
        <form className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 border-b border-slate-100 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            const cleanUsername = username.trim();
            if (!cleanUsername) return;
            void runMemberAction(
              () => addProjectMember(projectId, cleanUsername, newRole),
              `Added ${cleanUsername} to the project.`
            ).then(() => setUsername(''));
          }}>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Existing username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username" autoComplete="off" required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Role</span>
            <select value={newRole} onChange={(event) => setNewRole(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white">
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading members…</p>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <Users className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No members returned</p>
          <p className="text-xs text-slate-500 mt-1">Check that the members endpoint returns a members list.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member, index) => {
            const userId = getUserId(member);
            const role = roleValue(member.role);
            const isProjectOwner = role === 'OWNER';
            return (
              <div key={userId ?? `${member.username}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{member.username}</p>
                  {member.email && <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && !isProjectOwner && userId !== undefined ? (
                    <>
                      <select aria-label={`Role for ${member.username}`}
                        value={role === 'VIEWER' ? 'VIEWER' : 'EDITOR'}
                        disabled={saving}
                        onChange={(event) => void runMemberAction(
                          () => updateProjectMember(projectId, userId, event.target.value),
                          `Updated ${member.username}'s role.`
                        )}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button type="button" title={`Remove ${member.username}`} aria-label={`Remove ${member.username}`}
                        disabled={saving}
                        onClick={() => {
                          if (window.confirm(`Remove ${member.username} from this project?`)) {
                            void runMemberAction(
                              () => removeProjectMember(projectId, userId),
                              `Removed ${member.username} from the project.`
                            );
                          }
                        }}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isProjectOwner ? 'bg-indigo-50 text-indigo-700' : role === 'VIEWER' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {isProjectOwner ? 'Owner' : role === 'VIEWER' ? 'Viewer' : 'Editor'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
