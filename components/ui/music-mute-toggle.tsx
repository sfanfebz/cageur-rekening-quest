"use client";

import { useEffect, useState } from "react";
import { isMusicMuted, toggleMusicMuted } from "@/lib/music";
import { IconMusicNote, IconMusicNoteOff } from "@/components/ui/icons";

export function MusicMuteToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMusicMuted());
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMutedState(toggleMusicMuted())}
      aria-label={muted ? "Nyalakan musik" : "Matikan musik"}
      aria-pressed={muted}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-navy-700 transition hover:bg-teal-50 hover:text-teal-600 active:scale-95"
    >
      {muted ? <IconMusicNoteOff size={18} /> : <IconMusicNote size={18} />}
    </button>
  );
}
