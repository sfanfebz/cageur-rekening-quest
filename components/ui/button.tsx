"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-teal-400 to-teal-500 text-white shadow-button-teal hover:from-teal-500 hover:to-teal-600 active:from-teal-600 active:to-teal-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500 disabled:shadow-none",
  secondary:
    "bg-white text-teal-600 border-2 border-teal-500 hover:bg-teal-50 disabled:text-gray-400 disabled:border-gray-200",
  ghost: "bg-transparent text-teal-600 hover:bg-teal-50 disabled:text-gray-300",
  danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-200",
};

const SIZE_CLASSES: Record<Size, string> = {
  lg: "text-[15px] px-7 py-4 rounded-full",
  md: "text-sm px-5 py-3 rounded-full",
  sm: "text-xs px-4 py-2 rounded-full",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
  };

interface LinkButtonProps extends CommonProps {
  href: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-extrabold tracking-wide transition-all duration-150 select-none active:scale-[0.96] disabled:cursor-not-allowed disabled:active:scale-100";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

export function Button({ variant = "primary", size = "lg", fullWidth, loading, children, className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "lg", fullWidth, children, className = "", href }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
