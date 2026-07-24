"use client";

import { useEffect, useState } from "react";
import { isMuted, toggleMuted } from "@/lib/sound";

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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy-600 shadow-sm ring-1 ring-navy-900/5 transition hover:bg-navy-50 active:scale-95"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9v6h4l5 5V4L7 9H3z" strokeLinejoin="round" />
          <path d="M17 9l6 6M23 9l-6 6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9v6h4l5 5V4L7 9H3z" strokeLinejoin="round" />
          <path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
