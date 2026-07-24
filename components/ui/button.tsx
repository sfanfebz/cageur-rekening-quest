"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white shadow-lg shadow-teal-900/20 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300",
  secondary:
    "bg-white text-navy-700 border-2 border-navy-200 hover:border-navy-400 hover:bg-navy-50 disabled:text-navy-300 disabled:border-navy-100",
  ghost: "bg-transparent text-teal-700 hover:bg-teal-50 disabled:text-teal-200",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const SIZE_CLASSES: Record<Size, string> = {
  lg: "text-base px-7 py-4 rounded-3xl",
  md: "text-sm px-5 py-3 rounded-2xl",
  sm: "text-xs px-4 py-2 rounded-xl",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

interface LinkButtonProps extends CommonProps {
  href: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-150 select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100";

export function Button({ variant = "primary", size = "lg", fullWidth, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
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
