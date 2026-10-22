import React, { useState, useMemo } from 'react';
import {
  Users,
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

  // Deterministic 128-bit key derived from board room_id for community Excalidraw crypto
  const roomKey = useMemo(() => {
    const cleanUuid = board.room_id.replace(/-/g, '');
    return btoa(cleanUuid).substring(0, 22).replace(/\+/g, '-').replace(/\//g, '_');
  }, [board.room_id]);

  // Clean room id (alphanumeric 20 chars or standard uuid)
  const roomHash = `#room=${board.room_id},${roomKey}`;
  const fullCollabUrl = `${collabServerUrl}/${roomHash}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullCollabUrl);
    setCopied(true);
    success('Multiplayer Link Copied', 'Share this link with project members to collaborate.');
    setTimeout(() => setCopied(false), 2500);
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
      {/* Collaborative Canvas Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 z-10 shrink-0">
        {/* Left: Status & Room ID */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Room Active</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Room ID:</span>
            <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 text-[11px]">
              {board.room_id}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Drawing to Code Trigger */}
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

          {/* Copy Collaboration URL */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            {copied ? 'Copied' : 'Invite Link'}
          </Button>


          {/* Collab Settings / Security Info */}
          <button
            onClick={() => setIsCollabSettingsOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Collaboration Server Settings & Security Info"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title={isFullScreen ? 'Exit full screen' : 'Full screen canvas'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative bg-[#121212] overflow-hidden">
        <iframe
          src={fullCollabUrl}
          title={board.title}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write; camera; microphone"
        />
      </div>

      {/* Collaboration Settings & Security Modal */}
      <Modal
        isOpen={isCollabSettingsOpen}
        onClose={() => setIsCollabSettingsOpen(false)}
        title="Multiplayer Collaboration & Security"
        description="Configure local collaboration services and review authorization boundaries."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-600">
          {/* Security alert box */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Room Authorization Boundary Notice</p>
              <p className="leading-relaxed">
                Board access in ConvergeDesk is authorized via Django project membership (Owners, Editors, and Viewers).
                However, the community Excalidraw room service (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">excalidraw-room-go</code>) does not validate Django session cookies directly.
                Anyone who possesses the room URL with the encryption key can synchronize on that room ID. Do not share the link outside authorized project members.
              </p>
            </div>
          </div>

          {/* Server URL Input */}
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
              <Button
                size="sm"
                onClick={() => handleSaveCollabServer(collabServerUrl)}
              >
                Save
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Default is <code className="bg-slate-100 px-1 rounded">http://127.0.0.1:80</code> (running via <code className="bg-slate-100 px-1 rounded">excalidraw-collaboration/basic/docker-compose.yaml</code>).
            </p>
          </div>

          {/* Details on Current Room */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <p className="font-semibold text-slate-700">Current Room Parameters:</p>
            <p className="font-mono text-[11px] text-slate-600">Django UUID: {board.room_id}</p>
            <p className="font-mono text-[11px] text-slate-600">Derived Key: {roomKey}</p>
            <p className="font-mono text-[11px] text-slate-600 truncate">Target Room URL: {fullCollabUrl}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
