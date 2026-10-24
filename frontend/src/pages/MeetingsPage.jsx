import React, { useState } from 'react';
import { Calendar, Copy, Play, Video, Users } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';
import { useMeeting } from '../context/MeetingContext';

export const MeetingsPage = () => {
  const { startMeeting, meeting, expandMeeting } = useMeeting();
  const { success, info, error } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [meetings, setMeetings] = useState([
    { id: 'meet-1', title: 'ConvergeDesk Sprint Kickoff', roomName: 'convergedesk-sprint-kickoff', time: 'Team room', attendees: 'Anyone with room code' },
    { id: 'meet-2', title: 'Whiteboard Architecture Review', roomName: 'convergedesk-whiteboard-review', time: 'Team room', attendees: 'Anyone with room code' },
  ]);

  const createAndJoin = (title, roomName) => {
    startMeeting(title, roomName);
    info('Joining meeting', 'Allow camera and microphone access when your browser asks.');
  };

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;
    const roomName = (newRoomName.trim() || `convergedesk-${Date.now()}`)
      .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const created = {
      id: `meet-${Date.now()}`,
      title: newMeetingTitle.trim(),
      roomName,
      time: 'Created just now',
      attendees: 'Anyone with room code',
    };
    setMeetings((previous) => [...previous, created]);
    setNewMeetingTitle('');
    setNewRoomName('');
    setIsCreateModalOpen(false);
    success('Meeting room created', 'Share its room code with teammates so they can join the same room.');
    createAndJoin(created.title, created.roomName);
  };

  const copyRoom = async (roomName) => {
    try {
      await navigator.clipboard.writeText(roomName);
      success('Room code copied', roomName);
    } catch {
      error('Could not copy room code', 'Select and copy the room code manually.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Meetings & Collaboration Calls</h2>
          <p className="mt-1 text-sm text-slate-500">Meet face-to-face, then keep the call open while working on code, boards, and tasks.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Calendar className="h-4 w-4" />}>
            Create room
          </Button>
          <Button size="sm" onClick={() => createAndJoin('Instant Team Huddle', `convergedesk-huddle-${Date.now()}`)} leftIcon={<Video className="h-4 w-4" />}>
            Start instant meeting
          </Button>
        </div>
      </div>

      {meeting && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-900">You're in a meeting: {meeting.title}</p>
            <p className="mt-1 text-xs text-emerald-800">Room code: <span className="font-mono">{meeting.roomName}</span></p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copyRoom(meeting.roomName)} leftIcon={<Copy className="h-3.5 w-3.5" />}>Copy room code</Button>
            <Button size="sm" onClick={expandMeeting}>Open meeting</Button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Team rooms</h3>
          <p className="mt-1 text-xs text-slate-500">For this MVP, room cards are browser-local. Share the exact room code to meet in the same LiveKit room.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {meetings.map((item) => (
            <Card key={item.id} hoverable className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0 space-y-2">
                <h4 className="truncate text-sm font-bold text-slate-900">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />{item.attendees}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />{item.time}</div>
                <p className="break-all font-mono text-xs text-slate-400">{item.roomName}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button size="sm" onClick={() => createAndJoin(item.title, item.roomName)} leftIcon={<Play className="h-3.5 w-3.5" />}>Join</Button>
                <Button size="sm" variant="outline" onClick={() => copyRoom(item.roomName)} leftIcon={<Copy className="h-3.5 w-3.5" />}>Copy code</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
        <p className="font-semibold">Use the app while staying in the call</p>
        <p className="mt-1 text-xs leading-relaxed text-indigo-800">Minimize the meeting and move to Code Workspace, Whiteboards, Tasks, or Projects. The call remains connected in a floating panel. Real-time code/whiteboard synchronization is a separate follow-up integration.</p>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create team meeting"
        description="Choose a title and optional room code. Share the room code with your teammates."
        footer={<><Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button><Button onClick={() => document.getElementById('create-meeting-form')?.requestSubmit()}>Create & join</Button></>}
      >
        <form id="create-meeting-form" onSubmit={handleCreateMeeting} className="space-y-4">
          <Input label="Meeting topic" placeholder="e.g. Sprint retrospective" value={newMeetingTitle} onChange={(e) => setNewMeetingTitle(e.target.value)} autoFocus required />
          <Input label="Room code (optional)" placeholder="e.g. team-sprint-planning" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
};
