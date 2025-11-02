"use client";

import { useEffect, useState } from "react";
import { AsanaBoardView } from "@/components/asana-board-view";
import { AsanaCalendarView } from "@/components/asana-calendar-view";
import {
  type FilterType,
  type GroupType,
  type SortType,
  type ViewType,
} from "@/components/asana-header-exact";
import { AsanaLayout } from "@/components/asana-layout";
import { AsanaListViewExact } from "@/components/asana-list-view-exact";
import { AsanaQuickAddTask } from "@/components/asana-quick-add-task";
import { AsanaTaskDetailPanel } from "@/components/asana-task-detail-panel";
import { AsanaTimelineView } from "@/components/asana-timeline-view";

export default function AsanaDemoPage() {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [currentSort, setCurrentSort] = useState<SortType>("none");
  const [currentGroup, setCurrentGroup] = useState<GroupType>("section");

  // Mock project ID - in a real app, this would come from the router
  const mockProjectId = "demo-project";

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Q key - Quick add task
      if (e.key === "q" && !e.metaKey && !e.ctrlKey && !isTaskPanelOpen) {
        const target = e.target as HTMLElement;
        // Don't trigger if typing in an input
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        setShowQuickAdd(true);
      }
      // Escape key - Close panels
      if (e.key === "Escape") {
        if (isTaskPanelOpen) {
          setIsTaskPanelOpen(false);
          setSelectedTaskId(null);
        } else if (showQuickAdd) {
          setShowQuickAdd(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTaskPanelOpen, showQuickAdd]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskPanelOpen(true);
  };

  const handleCloseTaskPanel = () => {
    setIsTaskPanelOpen(false);
    setSelectedTaskId(null);
  };

  const handleNavigate = (path: string) => {
    console.log("Navigate to:", path);
    // In a real app, this would use the router
  };

  const handleCustomize = () => {
    console.log("Customize clicked");
  };

  const handleShare = () => {
    console.log("Share clicked");
  };

  return (
    <>
      <AsanaLayout
        currentView={currentView}
        onCustomize={handleCustomize}
        onFilterChange={setCurrentFilter}
        onGroupChange={setCurrentGroup}
        onNavigate={handleNavigate}
        onShare={handleShare}
        onSortChange={setCurrentSort}
        onViewChange={handleViewChange}
        title="My tasks"
      >
        {currentView === "list" && (
          <AsanaListViewExact
            filter={currentFilter}
            group={currentGroup}
            onTaskClick={handleTaskClick}
            projectId={mockProjectId}
            sort={currentSort}
          />
        )}
        {currentView === "board" && (
          <AsanaBoardView
            onTaskClick={handleTaskClick}
            projectId={mockProjectId}
          />
        )}
        {currentView === "calendar" && (
          <AsanaCalendarView
            onTaskClick={handleTaskClick}
            projectId={mockProjectId}
          />
        )}
        {currentView === "files" && (
          <AsanaTimelineView
            onTaskClick={handleTaskClick}
            projectId={mockProjectId}
          />
        )}
      </AsanaLayout>

      {/* Task Detail Panel */}
      <AsanaTaskDetailPanel
        isOpen={isTaskPanelOpen}
        onClose={handleCloseTaskPanel}
        taskId={selectedTaskId}
      />

      {/* Quick Add Modal (keyboard shortcut: Q) */}
      {showQuickAdd && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 transition-opacity"
            onClick={() => setShowQuickAdd(false)}
          />
          <div className="fixed top-1/4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg bg-white shadow-2xl">
            <AsanaQuickAddTask
              autoFocus
              onCancel={() => setShowQuickAdd(false)}
              onSuccess={() => setShowQuickAdd(false)}
              projectId={mockProjectId}
            />
          </div>
        </>
      )}
    </>
  );
}
