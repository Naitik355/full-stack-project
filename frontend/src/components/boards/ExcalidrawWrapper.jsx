import React, { useState } from 'react';
import { Copy, Check, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { TldrawCollaborativeCanvas } from './TldrawCollaborativeCanvas';

/** Whiteboard powered by tldraw's hosted demo sync for local testing only. */
export const ExcalidrawWrapper = ({
  board,
  onOpenAiAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { success } = useToast();
  const [tldrawEditor, setTldrawEditor] = useState(null);
  const tldrawRoomId = `convergedesk-${board.room_id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success('Invite Link Copied', 'Share this whiteboard URL with collaborators.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      success('Copy Failed', 'Your browser did not allow copying the invite link.');
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
      isFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[calc(100vh-140px)] w-full'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span>tldraw Multiplayer</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Board ID:</span>
            <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 text-[11px]">
              {board.id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenAiAssistant && (
            <Button size="sm" variant="primary" onClick={() => onOpenAiAssistant?.(tldrawEditor)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Draw to Code
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700">
            {copied ? 'Copied' : 'Invite Link'}
          </Button>
          <button onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title={isFullScreen ? 'Exit full screen' : 'Full screen canvas'}>
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative bg-white overflow-hidden">
        <TldrawCollaborativeCanvas roomId={tldrawRoomId} onEditorMount={setTldrawEditor}/>
      </div>
      <div className="px-4 py-2 text-xs bg-amber-950 text-amber-200">
        Local testing only: this demo room is public and may not persist. Do not use sensitive content.
      </div>
    </div>
  );
};
