import React from 'react';
import { Tldraw } from 'tldraw';
import { useSyncDemo } from '@tldraw/sync';
import 'tldraw/tldraw.css';

/**
 * Experimental multiplayer proof of concept.
 *
 * useSyncDemo connects to tldraw's public demo service. Rooms are not private
 * and demo data may be deleted, so only enable this for disposable test boards.
 * Replace with a self-hosted authenticated sync server before production use.
 */
export const TldrawCollaborativeCanvas = ({ roomId }) => {
  const remote = useSyncDemo({ roomId });

  return (
    <div className="relative h-full min-h-[480px] w-full bg-white">
      <div className="absolute left-3 top-3 z-10 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm">
        Experimental tldraw demo sync — room is public; do not use private board content.
      </div>
      <Tldraw store={remote} />
    </div>
  );
};
