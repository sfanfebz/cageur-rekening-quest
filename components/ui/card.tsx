import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl bg-white shadow-sm shadow-navy-900/5 ring-1 ring-navy-900/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
