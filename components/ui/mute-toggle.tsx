"use client";

import { useEffect, useState } from "react";
import { isMuted, toggleMuted } from "@/lib/sound";
import { IconSpeaker, IconSpeakerOff } from "@/components/ui/icons";

export function MuteToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMutedState(toggleMuted())}
      aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
      aria-pressed={muted}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-navy-700 transition hover:bg-teal-50 hover:text-teal-600 active:scale-95"
    >
      {muted ? <IconSpeakerOff size={18} /> : <IconSpeaker size={18} />}
    </button>
  );
}
