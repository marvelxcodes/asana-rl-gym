"use client";

import type { ReactNode } from "react";

type AsanaWidgetCardProps = {
  title?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AsanaWidgetCard({
  title,
  headerActions,
  children,
  className = "",
}: AsanaWidgetCardProps) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
          {headerActions}
        </div>
      )}
      {children}
    </div>
  );
}
