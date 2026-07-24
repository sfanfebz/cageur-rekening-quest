"use client";

export function TimerRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const urgent = secondsLeft <= Math.max(5, Math.round(totalSeconds * 0.2));
  const display = `0:${String(Math.max(0, secondsLeft)).padStart(2, "0")}`;
  return (
    <div
      className={`inline-flex h-[76px] w-[76px] items-center justify-center rounded-full border-[6px] font-display text-lg font-extrabold ${
        urgent ? "animate-timer-pulse border-red-500 text-red-500" : "border-teal-500 text-teal-500"
      }`}
      role="timer"
      aria-live="polite"
    >
      {display}
    </div>
  );
}
