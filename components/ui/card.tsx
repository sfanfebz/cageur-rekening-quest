import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl bg-white shadow-e1 ring-1 ring-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
