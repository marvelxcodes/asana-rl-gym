"use client";

import { useState } from "react";
import { ProjectHeader } from "./project-header";
import { ProjectSidebar } from "./project-sidebar";

type ProjectLayoutProps = {
  children: React.ReactNode;
  currentWorkspaceId?: string;
  currentProjectId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
};

export function ProjectLayout({
  children,
  currentWorkspaceId,
  currentProjectId,
  onWorkspaceChange,
}: ProjectLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background" data-testid="project-layout">
      {/* Sidebar */}
      <ProjectSidebar
        collapsed={sidebarCollapsed}
        currentProjectId={currentProjectId}
        currentWorkspaceId={currentWorkspaceId}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onWorkspaceChange={onWorkspaceChange}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Project Header */}
        <ProjectHeader
          currentProjectId={currentProjectId}
          currentWorkspaceId={currentWorkspaceId}
        />

        {/* Content */}
        <main
          className="flex-1 overflow-auto p-6"
          data-testid="project-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
