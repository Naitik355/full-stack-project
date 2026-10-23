import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Presentation, MoreVertical, Trash2, ArrowUpRight, Copy, Check, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const BoardCard = ({
  board,
  projectId,
  onDelete,
  canEdit = true,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const formattedDate = board.created_at
    ? new Date(board.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleCopyRoomId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(board.room_id);
    setCopied(true);
    success('Room ID Copied', board.room_id);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card hoverable className="relative flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-100">
              <Presentation className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <Users className="w-3 h-3" /> Multiplayer
            </span>
          </div>

          {canEdit && onDelete && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Board actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-40 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(board.id);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-left font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Board
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => navigate(`/projects/${projectId}/boards/${board.id}`)}
          className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
        >
          {board.title}
        </h3>

        {/* Room ID badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
            {board.room_id}
          </span>
          <button
            onClick={handleCopyRoomId}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Copy room ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400">
        <span>{formattedDate ? `Created ${formattedDate}` : 'Ready'}</span>
        <button
          onClick={() => navigate(`/projects/${projectId}/boards/${board.id}`)}
          className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group/btn"
        >
          <span>Open Canvas</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </Card>
  );
};
