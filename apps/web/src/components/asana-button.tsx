"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AsanaButtonVariant =
  | "primary" // Blue button (Add task)
  | "secondary" // Gray background
  | "ghost" // White with border
  | "ghost-gray" // Gray text, no background
  | "danger"; // Red for delete actions

type AsanaButtonSize = "sm" | "md" | "lg";

type AsanaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AsanaButtonVariant;
  size?: AsanaButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  active?: boolean;
};

export function AsanaButton({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  children,
  active = false,
  className = "",
  ...props
}: AsanaButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all duration-150 whitespace-nowrap";

  // Size styles - matching exact Asana measurements
  const sizeStyles = {
    sm: "h-7 px-2 text-xs", // 28px height
    md: "h-8 px-3 text-sm", // 32px height
    lg: "h-9 px-4 text-sm", // 36px height
  };

  // Variant styles - exact Asana colors
  const variantStyles = {
    primary:
      "bg-[#4573D2] text-white hover:bg-[#3D67C4] active:bg-[#355AB6] shadow-sm",
    secondary:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    "ghost-gray":
      "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  };

  const activeStyles = active
    ? "bg-gray-100 text-gray-900 border-gray-400"
    : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${activeStyles} ${className}`}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </button>
  );
}
