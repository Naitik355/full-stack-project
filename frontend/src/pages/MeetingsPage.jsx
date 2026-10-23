import React, { useState } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  PhoneOff,
  Users,
  Calendar,
  Play,
  Terminal,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export const MeetingsPage = () => {
  const [inCall, setInCall] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('Product Design Sync');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');

  const [meetings, setMeetings] = useState([
    {
      id: 'meet-1',
      title: 'ConvergeDesk Sprint Kickoff',
      time: 'Today, 2:00 PM',
      attendees: 4,
    },
    {
      id: 'meet-2',
      title: 'Whiteboard Architecture Review',
      time: 'Tomorrow, 10:00 AM',
      attendees: 3,
    },
  ]);

  const { success, info } = useToast();

  const handleStartCall = (title) => {
    if (title) setMeetingTitle(title);
    setInCall(true);
    info(
      'Meeting Room Opened',
      'Integration boundary: WebRTC SFU infrastructure is pending backend connection.'
    );
  };

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;
    const newMeet = {
      id: `meet-${Date.now()}`,
      title: newMeetingTitle.trim(),
      time: 'Scheduled',
      attendees: 1,
    };
    setMeetings([...meetings, newMeet]);
    setNewMeetingTitle('');
    setIsCreateModalOpen(false);
    success('Meeting Created', newMeet.title);
  };

  if (inCall) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{meetingTitle}</h3>
              <p className="text-[11px] text-slate-400">ConvergeDesk Audio/Video Room</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> 3 Participants
            </span>
          </div>
        </div>

        {/* Integration Notice */}
        <div className="px-6 py-2 bg-indigo-950/50 border-b border-indigo-900/50 text-xs text-indigo-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Integration Notice: Live media tracks require WebRTC signaling and SFU deployment (e.g. LiveKit or Daily.co). The UI structure and call controls below are fully prepared for service connection.
          </span>
        </div>

        {/* Video Tiles Grid */}
        <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center justify-center overflow-y-auto">
          {/* Tile 1 (You) */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden group shadow-lg">
            {isVideoOn ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500 flex items-center justify-center font-bold text-lg text-indigo-200">
                  You
                </div>
                <span className="text-xs text-slate-400">Camera Active (Local Stream)</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg">
                Off
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5">
              <span>You (Host)</span>
              {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
            </div>
          </div>

          {/* Tile 2 (Peer) */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-violet-600/30 border border-violet-500 flex items-center justify-center font-bold text-lg text-violet-200">
                JD
              </div>
              <span className="text-xs text-slate-400">Jane Doe</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5">
              <span>Jane Doe</span>
              <Mic className="w-3 h-3 text-emerald-400" />
            </div>
          </div>

          {/* Tile 3 (Peer) */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-sky-600/30 border border-sky-500 flex items-center justify-center font-bold text-lg text-sky-200">
                AS
              </div>
              <span className="text-xs text-slate-400">Alex Smith</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5">
              <span>Alex Smith</span>
              <Mic className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Call Controls Bar */}
        <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 px-6 shrink-0">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3.5 rounded-2xl border transition-colors ${
              isMicOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-rose-600/20 text-rose-400 border-rose-500/50'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-3.5 rounded-2xl border transition-colors ${
              isVideoOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-rose-600/20 text-rose-400 border-rose-500/50'
            }`}
            title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => info('Screen Sharing', 'Screen capture stream triggers when WebRTC peer connection initializes.')}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Share Screen"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setInCall(false)}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-colors ml-4"
            title="Leave Meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Meetings & Collaboration Calls
          </h2>
          <p className="text-xs text-slate-500">
            Audio/video rooms, screen sharing, and interactive huddles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Schedule Call
          </Button>
          <Button
            size="sm"
            onClick={() => handleStartCall('Instant Team Huddle')}
            leftIcon={<Video className="w-4 h-4" />}
          >
            Start Instant Meeting
          </Button>
        </div>
      </div>

      {/* Infrastructure Boundary Status Box */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 text-xs">
        <Terminal className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">WebRTC & Media Service Architecture</p>
          <p className="leading-relaxed text-indigo-800">
            ConvergeDesk is designed to support WebRTC mesh and Selective Forwarding Units (SFUs) for HD audio/video and screen sharing.
            The frontend layout, controls, and participant areas are ready for LiveKit/Daily.co integration.
          </p>
        </div>
      </div>

      {/* Scheduled Meetings */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Upcoming Team Huddles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meet) => (
            <Card key={meet.id} hoverable className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{meet.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {meet.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {meet.attendees} Invites
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleStartCall(meet.title)}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                Join
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Team Meeting"
        description="Create a meeting lobby for team syncs or whiteboard reviews."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMeeting}>Schedule</Button>
          </>
        }
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <Input
            label="Meeting Topic"
            placeholder="e.g. Sprint Retrospective"
            value={newMeetingTitle}
            onChange={(e) => setNewMeetingTitle(e.target.value)}
            autoFocus
            required
          />
        </form>
      </Modal>
    </div>
  );
};
