"use client";

import { usePathname } from "next/navigation";
import { CalendarView } from "./calendar-view";
import { KanbanBoardView } from "./kanban-board-view";
import { TaskListView } from "./task-list-view";
import { TimelineView } from "./timeline-view";

type ViewContainerProps = {
  projectId: string;
  children?: React.ReactNode;
};

export function ViewContainer({ projectId }: ViewContainerProps) {
  const pathname = usePathname();

  // Determine current view based on pathname
  const getCurrentView = () => {
    if (pathname.includes("/list")) {
      return "list";
    }
    if (pathname.includes("/board")) {
      return "board";
    }
    if (pathname.includes("/timeline")) {
      return "timeline";
    }
    if (pathname.includes("/calendar")) {
      return "calendar";
    }
    return "overview";
  };

  const currentView = getCurrentView();

  // Render appropriate view component
  switch (currentView) {
    case "list":
      return <TaskListView projectId={projectId} />;

    case "board":
      return <KanbanBoardView projectId={projectId} />;

    case "timeline":
      return <TimelineView projectId={projectId} />;

    case "calendar":
      return <CalendarView projectId={projectId} />;

    default:
      return (
        <div className="h-full p-8 text-center" data-testid="view-container">
          <h3 className="mb-4 font-medium text-lg">Project Overview</h3>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Navigate to List, Board, Timeline, or Calendar view to manage tasks
          </p>
        </div>
      );
  }
}
