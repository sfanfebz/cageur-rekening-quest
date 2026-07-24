"use client";

export function TimerRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const urgent = secondsLeft <= Math.max(5, Math.round(totalSeconds * 0.2));
  return (
    <div
      className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-4 text-lg font-extrabold ${
        urgent ? "animate-timer-pulse border-red-400 text-red-600" : "border-teal-400 text-teal-700"
      }`}
      role="timer"
      aria-live="polite"
    >
      {secondsLeft}
    </div>
  );
}
