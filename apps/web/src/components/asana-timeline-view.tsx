"use client";

import type { TaskStatus } from "@asana/api/schemas/task";
import { ChevronLeft, ChevronRight, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

type AsanaTimelineViewProps = {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
};

type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: number | null;
  createdAt: number;
};

export function AsanaTimelineView({
  projectId,
  onTaskClick,
}: AsanaTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch tasks
  const { data: tasksData = [] } = trpc.task.getByProject.useQuery({
    projectId,
  });

  // Filter tasks with due dates for timeline
  const tasks: TaskItem[] = useMemo(
    () =>
      tasksData
        .filter((t) => t.dueDate)
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status ?? "todo",
          dueDate: t.dueDate,
          createdAt: t.createdAt,
        })),
    [tasksData]
  );

  // Generate months for timeline
  const months = [];
  for (let i = -2; i <= 6; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    months.push({
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear(),
      timestamp: date.getTime(),
    });
  }

  // Calculate task bar position and width
  const getTaskBarStyle = (task: TaskItem) => {
    if (!task.dueDate) return { left: 0, width: 0 };

    const startDate = task.createdAt;
    const endDate = task.dueDate;
    const timelineStart = months[0].timestamp;
    const timelineEnd = new Date(
      months[months.length - 1].year,
      new Date(months[months.length - 1].timestamp).getMonth() + 1,
      0
    ).getTime();

    const totalDuration = timelineEnd - timelineStart;
    const taskStart = Math.max(startDate, timelineStart);
    const taskEnd = Math.min(endDate, timelineEnd);
    const taskDuration = taskEnd - taskStart;

    const leftPercent = ((taskStart - timelineStart) / totalDuration) * 100;
    const widthPercent = (taskDuration / totalDuration) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    };
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-900 hover:bg-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-900 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-900 hover:bg-gray-200";
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-white"
      data-testid="asana-timeline-view"
    >
      {/* Timeline Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900 text-xl">Timeline</h2>
          <div className="flex items-center gap-1">
            <Button
              data-testid="timeline-previous"
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                )
              }
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              data-testid="timeline-next"
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                )
              }
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            data-testid="timeline-today"
            onClick={() => setCurrentDate(new Date())}
            size="sm"
            variant="outline"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-300">
            <Button
              data-testid="zoom-out"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
              size="icon"
              variant="ghost"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="border-x border-gray-300 px-3 text-sm">
              {Math.round(zoomLevel * 100)}%
            </div>
            <Button
              data-testid="zoom-in"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
              size="icon"
              variant="ghost"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Button data-testid="add-task-timeline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        {/* Timeline Grid */}
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-gray-50">
            <div className="w-64 shrink-0 border-r border-gray-200 px-4 py-3 font-semibold text-gray-700 text-sm">
              Tasks
            </div>
            <div className="flex flex-1">
              {months.map((m, i) => (
                <div
                  className="flex-1 border-r border-gray-200 px-4 py-3 text-center text-gray-700 text-sm"
                  key={`${m.month}-${i.toString()}`}
                  style={{ minWidth: `${120 * zoomLevel}px` }}
                >
                  <div className="font-semibold">{m.month}</div>
                  <div className="text-gray-500 text-xs">{m.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const barStyle = getTaskBarStyle(task);
              const formattedDate = task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "No due date";

              return (
                <div
                  className="flex border-b border-gray-100 transition-colors hover:bg-gray-50"
                  key={task.id}
                >
                  <div className="w-64 shrink-0 border-r border-gray-200 px-4 py-3">
                    <button
                      className="w-full text-left"
                      onClick={() => onTaskClick?.(task.id)}
                      type="button"
                    >
                      <div className="font-medium text-gray-900 text-sm hover:underline">
                        {task.title}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Due {formattedDate}
                      </div>
                    </button>
                  </div>
                  <div className="relative flex flex-1" style={{ height: "60px" }}>
                    <div
                      className={`absolute top-4 h-8 cursor-pointer rounded px-2 py-1 text-xs transition-all duration-200 ${getStatusColor(task.status)}`}
                      onClick={() => onTaskClick?.(task.id)}
                      style={barStyle}
                    >
                      <div className="truncate">{task.title}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex border-b border-gray-100">
              <div className="w-64 shrink-0 border-r border-gray-200 px-4 py-8 text-center">
                <div className="text-gray-500 text-sm">
                  No tasks with due dates
                </div>
              </div>
              <div className="flex-1" />
            </div>
          )}

          {/* Add task row */}
          <div className="flex border-b border-gray-100 hover:bg-gray-50">
            <div className="w-64 shrink-0 border-r border-gray-200 px-4 py-3">
              <button
                className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
