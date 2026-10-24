import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MeetingContext = createContext(null);

export function MeetingProvider({ children }) {
  const [meeting, setMeeting] = useState(null);
  const [minimized, setMinimized] = useState(false);

  const startMeeting = useCallback((title, roomName) => {
    const safeRoom = (roomName || `convergedesk-${Date.now()}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    setMeeting({
      title: (title || 'Team Meeting').trim(),
      roomName: safeRoom,
    });
    setMinimized(false);
  }, []);

  const endMeeting = useCallback(() => {
    setMeeting(null);
    setMinimized(false);
  }, []);

  const value = useMemo(() => ({
    meeting,
    minimized,
    startMeeting,
    endMeeting,
    minimizeMeeting: () => setMinimized(true),
    expandMeeting: () => setMinimized(false),
  }), [meeting, minimized, startMeeting, endMeeting]);

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}

export function useMeeting() {
  const value = useContext(MeetingContext);
  if (!value) throw new Error('useMeeting must be used inside MeetingProvider');
  return value;
}
