"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type AsanaCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function AsanaCheckbox({
  checked = false,
  onCheckedChange,
  className = "",
  ...props
}: AsanaCheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
    props.onChange?.(e);
  };

  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        {...props}
        checked={checked}
        className="peer sr-only"
        onChange={handleChange}
        type="checkbox"
      />
      <div
        className={`
        flex h-5 w-5 items-center justify-center rounded-full border-2
        transition-all duration-150
        ${
          checked
            ? "border-green-500 bg-green-500"
            : "border-gray-400 bg-white hover:border-gray-500"
        }
        ${className}
      `}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </div>
    </label>
  );
}
