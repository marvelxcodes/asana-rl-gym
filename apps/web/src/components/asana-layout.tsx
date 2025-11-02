"use client";

import { useState } from "react";
import {
  AsanaHeaderExact,
  type FilterType,
  type GroupType,
  type SortType,
  type ViewType,
} from "./asana-header-exact";
import { AsanaSidebar } from "./asana-sidebar";

type AsanaLayoutProps = {
  children: React.ReactNode;
  title: string;
  currentView?: ViewType;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  onViewChange?: (view: ViewType) => void;
  onNavigate?: (path: string) => void;
  onCustomize?: () => void;
  onShare?: () => void;
  onFilterChange?: (filter: FilterType) => void;
  onSortChange?: (sort: SortType) => void;
  onGroupChange?: (group: GroupType) => void;
};

export function AsanaLayout({
  children,
  title,
  currentView = "list",
  currentWorkspaceId,
  currentProjectId,
  onViewChange,
  onNavigate,
  onCustomize,
  onShare,
  onFilterChange,
  onSortChange,
  onGroupChange,
}: AsanaLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F7F8]">
      {/* Sidebar */}
      <AsanaSidebar
        currentProjectId={currentProjectId}
        currentWorkspaceId={currentWorkspaceId}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AsanaHeaderExact
          currentView={currentView}
          onCustomize={onCustomize}
          onFilterChange={onFilterChange}
          onGroupChange={onGroupChange}
          onShare={onShare}
          onSortChange={onSortChange}
          onViewChange={onViewChange}
          title={title}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto" data-testid="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
