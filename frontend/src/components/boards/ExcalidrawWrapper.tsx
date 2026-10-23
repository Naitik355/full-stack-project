import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import type { Board } from '../../types/board';
import { TldrawCollaborativeCanvas } from './TldrawCollaborativeCanvas';

interface ExcalidrawWrapperProps {
  board: Board;
  onOpenAiAssistant?: () => void;
}

export const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
  board,
  onOpenAiAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const [collabServerUrl, setCollabServerUrl] = useState<string>(() => {
    return localStorage.getItem('convergedesk_collab_server_url') || 'http://127.0.0.1:80';
  });
  const [isCollabSettingsOpen, setIsCollabSettingsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { success } = useToast();

  // Enable only for disposable testing: tldraw's hosted demo rooms are public
  // and their contents may be deleted. Use a private sync server for production.
  const useTldrawDemoSync = import.meta.env.VITE_TLDRAW_DEMO_SYNC === 'true';

  const roomId = useMemo(() => board.room_id.replace(/-/g, '').slice(0, 20), [board.room_id]);
  const roomKey = useMemo(() => {
    const cleanUuid = board.room_id.replace(/-/g, '');
    const uuidBytes = cleanUuid.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [];
    const binaryKey = String.fromCharCode(...uuidBytes);
    return btoa(binaryKey)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }, [board.room_id]);

  const roomHash = `#room=${roomId},${roomKey}`;
  const fullCollabUrl = useTldrawDemoSync
    ? window.location.href
    : `${collabServerUrl.replace(/\/+$/, '')}/${roomHash}`;
  const tldrawRoomId = `convergedesk-${board.room_id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullCollabUrl);
      setCopied(true);
      success('Invite Link Copied', 'Share the ConvergeDesk board URL with authorized project members.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      success('Copy Failed', 'Your browser did not allow copying the invite link.');
    }
  };

  const handleSaveCollabServer = (newUrl: string) => {
    setCollabServerUrl(newUrl);
    localStorage.setItem('convergedesk_collab_server_url', newUrl);
    setIsCollabSettingsOpen(false);
    success('Settings Saved', `Collaboration server set to ${newUrl}`);
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
      isFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[calc(100vh-140px)] w-full'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            useTldrawDemoSync
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-700/40 border-slate-600 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${useTldrawDemoSync ? 'bg-amber-400' : 'bg-slate-400'}`} />
            <span>{useTldrawDemoSync ? 'Tldraw Test Room (Public)' : 'Excalidraw Room'}</span>
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
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenAiAssistant}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Draw to Code
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            {copied ? 'Copied' : 'Invite Link'}
          </Button>

          {!useTldrawDemoSync && (
            <button
              onClick={() => setIsCollabSettingsOpen(true)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Excalidraw collaboration server settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title={isFullScreen ? 'Exit full screen' : 'Full screen canvas'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative bg-[#121212] overflow-hidden">
        {useTldrawDemoSync ? (
          <TldrawCollaborativeCanvas roomId={tldrawRoomId} />
        ) : (
          <iframe
            src={fullCollabUrl}
            title={board.title}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write; camera; microphone"
          />
        )}
      </div>

      {!useTldrawDemoSync && (
        <Modal
          isOpen={isCollabSettingsOpen}
          onClose={() => setIsCollabSettingsOpen(false)}
          title="Multiplayer Collaboration & Security"
          description="Configure the local Excalidraw collaboration service."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Room authorization boundary</p>
                <p className="leading-relaxed">
                  The community Excalidraw room service does not validate Django session cookies directly.
                  Anyone possessing the room URL and encryption key can join that room. Share links only with authorized project members.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block font-semibold uppercase tracking-wider text-slate-700">
                Collaboration Service Endpoint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={collabServerUrl}
                  onChange={(e) => setCollabServerUrl(e.target.value)}
                  placeholder="http://127.0.0.1:80"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button size="sm" onClick={() => handleSaveCollabServer(collabServerUrl)}>
                  Save
                </Button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <p className="font-semibold text-slate-700">Current Room Parameters:</p>
              <p className="font-mono text-[11px] text-slate-600">Django UUID: {board.room_id}</p>
              <p className="font-mono text-[11px] text-slate-600">Excalidraw Room ID: {roomId}</p>
              <p className="font-mono text-[11px] text-slate-600 truncate">Target Room URL: {fullCollabUrl}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
