import React, { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { Minimize2, Maximize2, PhoneOff, Video } from 'lucide-react';
import '@livekit/components-styles';
import { useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';

export function LiveMeetingLayer() {
  const { meeting, minimized, minimizeMeeting, expandMeeting, endMeeting } = useMeeting();
  const location = useLocation();
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function connect() {
      if (!meeting) {
        setCredentials(null);
        setError('');
        return;
      }
      const tokenServerId = import.meta.env.VITE_LIVEKIT_TOKEN_SERVER_ID;
      if (!tokenServerId) {
        setError('Missing VITE_LIVEKIT_TOKEN_SERVER_ID in frontend/.env.local');
        setCredentials(null);
        return;
      }
      setLoading(true);
      setError('');
      setCredentials(null);
      try {
        const source = TokenSource.developmentTokenServer(tokenServerId);
        const result = await source.fetch({ roomName: meeting.roomName });
        if (!cancelled) setCredentials({
          serverUrl: result.serverUrl,
          token: result.participantToken,
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not get meeting access token.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    connect();
    return () => { cancelled = true; };
  }, [meeting]);

  if (!meeting) return null;

  const onMeetingsPage = location.pathname === '/meetings';
  const showFull = onMeetingsPage && !minimized;

  const header = (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-700">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Video className="w-4 h-4 text-emerald-400" />
          <span className="truncate">{meeting.title}</span>
        </div>
        <p className="text-[11px] text-slate-400">Room code: {meeting.roomName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showFull ? (
          <button onClick={minimizeMeeting} title="Minimize and keep working" className="rounded-lg p-2 hover:bg-slate-700">
            <Minimize2 className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={expandMeeting} title="Expand meeting" className="rounded-lg p-2 hover:bg-slate-700">
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        <button onClick={endMeeting} title="Leave meeting" className="rounded-lg bg-rose-600 p-2 hover:bg-rose-700">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const body = loading ? (
    <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-300">
      Connecting to meeting…
    </div>
  ) : error ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center text-sm text-white">
      <p className="font-semibold">Could not start video meeting</p>
      <p className="max-w-lg text-slate-300">{error}</p>
      <p className="text-xs text-slate-400">Check the LiveKit development token server ID and restart Vite after editing .env.local.</p>
    </div>
  ) : credentials ? (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      video
      audio
      onError={(e) => setError(e?.message || 'LiveKit connection failed.')}
      onDisconnected={() => {
        // Keep the shell mounted until the user explicitly leaves.
      }}
      data-lk-theme="default"
      className="h-full min-h-0"
    >
      <VideoConference />
    </LiveKitRoom>
  ) : null;

  if (showFull) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-slate-950 text-white">
        {header}
        <div className="min-h-0 flex-1">{body}</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex h-[300px] w-[min(94vw,420px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
      {header}
      <div className="min-h-0 flex-1">{body}</div>
    </div>
  );
}
