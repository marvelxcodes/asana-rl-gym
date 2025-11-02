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
    <div
      className={`rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.06)] ${className}`}
      data-testid="widget-card"
    >
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
