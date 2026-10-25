
import { request } from './client';

export async function getProjectMeetings(projectId) {
  const data = await request(`/projects/${projectId}/meetings/`);
  return data.meetings || [];
}

export async function createProjectMeeting(projectId, title) {
  return request(`/projects/${projectId}/meetings/`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function inviteMeetingMembers(projectId, meetingId, memberIds) {
  return request(`/projects/${projectId}/meetings/${meetingId}/invite/`, {
    method: 'POST',
    body: JSON.stringify({ member_ids: memberIds }),
  });
}
