"use client";

import type { TaskPriority, TaskStatus } from "@asana/api/schemas/task";
import { ChevronLeft, ChevronRight, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { TaskDetailModal } from "./task-detail-modal";

type TimelineViewProps = {
  projectId: string;
};

type TaskItem = {
  id: string;
  title: string; // Changed from 'name' to 'title' to match schema
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: number | null;
  tags?: string[]; // Optional, not used in mock data
  dependencies?: string[]; // Optional, not used in mock data
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  isOverdue?: boolean;
};

type TimelineTask = TaskItem & {
  startDate: number;
  endDate: number;
  duration: number;
  position: {
    left: number;
    width: number;
    top: number;
  };
  dependencyLines: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }>;
};

type TimeScale = "days" | "weeks" | "months";

const TASK_HEIGHT = 40;
const TASK_MARGIN = 8;
const HEADER_HEIGHT = 60;
const SIDEBAR_WIDTH = 300;
const DAYS_OFFSET = 30;
const TIMELINE_DAYS = 90;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;
const DAYS_PER_WEEK = 7;
const WEEK_MILLISECONDS = DAYS_PER_WEEK * MILLISECONDS_PER_DAY;
const DAYS_PER_MONTH = 30;
const MONTH_MILLISECONDS = DAYS_PER_MONTH * MILLISECONDS_PER_DAY;
const MIN_TASK_WIDTH_PERCENT = 2;
const HALF_TASK_HEIGHT = TASK_HEIGHT / 2;
const HALF_TASK_MARGIN = TASK_MARGIN / 2;
const NAVIGATION_DAYS_INTERVAL = 7;
const NAVIGATION_WEEKS_INTERVAL = 30;
const NAVIGATION_MONTHS_INTERVAL = 90;
const MIN_CHART_HEIGHT = 400;
const CHART_PADDING = 20;

export function TimelineView({ projectId }: TimelineViewProps) {
  const utils = trpc.useUtils();
  const [timeScale, setTimeScale] = useState<TimeScale>("weeks");
  const [viewStartDate, setViewStartDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - DAYS_OFFSET);
    return now.getTime();
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all tasks for the project
  const {
    data: tasks = [],
    isLoading,
    error,
  } = trpc.task.getByProject.useQuery({
    projectId,
  });

  // Calculate timeline data
  const timelineData = useMemo(() => {
    if (tasks.length === 0) {
      return { tasks: [], dateRange: { start: 0, end: 0 } };
    }

    // Calculate date range for the timeline
    const now = Date.now();
    const dates = tasks
      .flatMap((task) => [
        task.createdAt,
        task.dueDate || now,
        task.completedAt ||
          (task.status === "completed" ? now : task.dueDate || now),
      ])
      .filter(Boolean);

    const minDate = Math.min(...dates, viewStartDate);
    const maxDate = Math.max(
      ...dates,
      viewStartDate + TIMELINE_DAYS * MILLISECONDS_PER_DAY
    );

    // Calculate task positions and durations
    const timelineTasks: TimelineTask[] = tasks.map((task, index) => {
      const startDate = task.createdAt;
      const endDate = task.dueDate || task.completedAt || now;
      const duration = endDate - startDate;

      // Calculate position based on date range
      const totalDuration = maxDate - minDate;
      const left = ((startDate - minDate) / totalDuration) * 100;
      const width = Math.max(
        (duration / totalDuration) * 100,
        MIN_TASK_WIDTH_PERCENT
      );

      return {
        ...task,
        startDate,
        endDate,
        duration,
        position: {
          left,
          width,
          top: index * (TASK_HEIGHT + TASK_MARGIN),
        },
        dependencyLines: [], // Will be calculated after all tasks are positioned
      };
    });

    // Calculate dependency lines
    for (const task of timelineTasks) {
      task.dependencyLines = (task.dependencies || []) // Not used in mock data
        .map((depId) => {
          const depTask = timelineTasks.find((t) => t.id === depId);
          if (!depTask) {
            return null;
          }

          return {
            fromX: depTask.position.left + depTask.position.width,
            fromY: depTask.position.top + HALF_TASK_HEIGHT,
            toX: task.position.left,
            toY: task.position.top + HALF_TASK_HEIGHT,
          };
        })
        .filter(Boolean) as TimelineTask["dependencyLines"];
    }

    return {
      tasks: timelineTasks,
      dateRange: { start: minDate, end: maxDate },
    };
  }, [tasks, viewStartDate]);

  // Generate time scale markers
  const timeMarkers = useMemo(() => {
    const { start, end } = timelineData.dateRange;
    const markers: Array<{ date: number; label: string; position: number }> =
      [];

    if (start === 0 || end === 0) {
      return markers;
    }

    const totalDuration = end - start;
    let interval: number;
    let formatOptions: Intl.DateTimeFormatOptions;

    switch (timeScale) {
      case "days":
        interval = MILLISECONDS_PER_DAY;
        formatOptions = { month: "short", day: "numeric" };
        break;
      case "weeks":
        interval = WEEK_MILLISECONDS;
        formatOptions = { month: "short", day: "numeric" };
        break;
      case "months":
        interval = MONTH_MILLISECONDS;
        formatOptions = { month: "short", year: "numeric" };
        break;
      default:
        interval = WEEK_MILLISECONDS;
        formatOptions = { month: "short", day: "numeric" };
        break;
    }

    let currentDate = start;
    while (currentDate <= end) {
      const position = ((currentDate - start) / totalDuration) * 100;
      const label = new Date(currentDate).toLocaleDateString(
        "en-US",
        formatOptions
      );

      markers.push({ date: currentDate, label, position });
      currentDate += interval;
    }

    return markers;
  }, [timelineData.dateRange, timeScale]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    utils.task.getByProject.invalidate({ projectId });
  };

  const navigateTime = (direction: "prev" | "next") => {
    let interval: number;
    if (timeScale === "days") {
      interval = NAVIGATION_DAYS_INTERVAL;
    } else if (timeScale === "weeks") {
      interval = NAVIGATION_WEEKS_INTERVAL;
    } else {
      interval = NAVIGATION_MONTHS_INTERVAL;
    }
    const offset = interval * MILLISECONDS_PER_DAY;

    setViewStartDate((prev) =>
      direction === "prev" ? prev - offset : prev + offset
    );
  };

  const zoomTimeline = (direction: "in" | "out") => {
    const scales: TimeScale[] = ["days", "weeks", "months"];
    const currentIndex = scales.indexOf(timeScale);

    if (direction === "in" && currentIndex > 0) {
      setTimeScale(scales[currentIndex - 1]);
    } else if (direction === "out" && currentIndex < scales.length - 1) {
      setTimeScale(scales[currentIndex + 1]);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "in_progress":
        return "bg-blue-600";
      case "todo":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  if (error) {
    return (
      <div
        className="p-4 text-center text-red-600"
        data-testid="timeline-view-error"
      >
        Error loading tasks: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="p-8 text-center text-gray-500"
        data-testid="timeline-view-loading"
      >
        Loading timeline...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="timeline-view">
      {/* Header with controls */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Timeline View</h2>

          {/* Navigation controls */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="timeline-nav-prev"
              onClick={() => navigateTime("prev")}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              data-testid="timeline-nav-next"
              onClick={() => navigateTime("next")}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="timeline-zoom-in"
              disabled={timeScale === "days"}
              onClick={() => zoomTimeline("in")}
              size="sm"
              variant="outline"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-gray-600 text-sm capitalize">
              {timeScale}
            </span>
            <Button
              data-testid="timeline-zoom-out"
              disabled={timeScale === "months"}
              onClick={() => zoomTimeline("out")}
              size="sm"
              variant="outline"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button data-testid="add-task-button" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Timeline container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Task list sidebar */}
        <div
          className="border-r bg-gray-50"
          data-testid="timeline-sidebar"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* Sidebar header */}
          <div
            className="border-b bg-white p-4 font-medium"
            style={{ height: HEADER_HEIGHT }}
          >
            Tasks
          </div>

          {/* Task list */}
          <div className="overflow-y-auto">
            {timelineData.tasks.map((task) => (
              <button
                className="w-full cursor-pointer border-b p-3 text-left hover:bg-gray-100"
                data-testid={`timeline-task-${task.id}`}
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleTaskClick(task.id);
                  }
                }}
                style={{ height: TASK_HEIGHT + TASK_MARGIN }}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${getPriorityColor(task.priority)}`}
                    data-testid={`task-priority-indicator-${task.id}`}
                  />
                  <span className="truncate font-medium text-sm">
                    {task.title}
                  </span>
                </div>
                <div className="mt-1 text-gray-500 text-xs">
                  {task.assigneeId && `Assigned to ${task.assigneeId}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline chart area */}
        <div className="flex-1 overflow-auto">
          {/* Time scale header */}
          <div
            className="relative border-b bg-white"
            data-testid="timeline-header"
            style={{ height: HEADER_HEIGHT }}
          >
            {timeMarkers.map((marker) => (
              <div
                className="absolute border-gray-200 border-l text-gray-600 text-xs"
                data-testid={`timeline-marker-${marker.date}`}
                key={`marker-${marker.date}`}
                style={{
                  left: `${marker.position}%`,
                  top: 0,
                  height: "100%",
                  paddingLeft: "4px",
                  paddingTop: "8px",
                }}
              >
                {marker.label}
              </div>
            ))}
          </div>

          {/* Timeline chart */}
          <div
            className="relative bg-white"
            data-testid="timeline-chart"
            style={{
              height:
                timelineData.tasks.length * (TASK_HEIGHT + TASK_MARGIN) + 20,
              minHeight: "400px",
            }}
          >
            {/* Vertical grid lines */}
            {timeMarkers.map((marker) => (
              <div
                className="absolute border-gray-100 border-l"
                key={`grid-${marker.date}`}
                style={{
                  left: `${marker.position}%`,
                  top: 0,
                  height: "100%",
                }}
              />
            ))}

            {/* Dependency lines */}
            <svg
              className="pointer-events-none absolute inset-0"
              data-testid="timeline-dependencies"
              style={{ zIndex: 1 }}
            >
              <title>Task Dependencies</title>
              {timelineData.tasks.flatMap((task) =>
                task.dependencyLines.map((line) => (
                  <line
                    key={`${task.id}-dep-${line.fromX}-${line.fromY}`}
                    markerEnd="url(#arrowhead)"
                    stroke="#6b7280"
                    strokeDasharray="4,4"
                    strokeWidth="2"
                    x1={`${line.fromX}%`}
                    x2={`${line.toX}%`}
                    y1={line.fromY}
                    y2={line.toY}
                  />
                ))
              )}
              <defs>
                <marker
                  id="arrowhead"
                  markerHeight="7"
                  markerWidth="10"
                  orient="auto"
                  refX="9"
                  refY="3.5"
                >
                  <polygon fill="#6b7280" points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
            </svg>

            {/* Task bars */}
            {timelineData.tasks.map((task) => (
              <Card
                className={`absolute cursor-pointer transition-shadow hover:shadow-md ${getStatusColor(task.status)}`}
                data-testid={`timeline-bar-${task.id}`}
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                style={{
                  left: `${task.position.left}%`,
                  width: `${task.position.width}%`,
                  top: task.position.top + HALF_TASK_MARGIN,
                  height: TASK_HEIGHT - TASK_MARGIN,
                  zIndex: 2,
                }}
              >
                <CardContent className="flex h-full items-center p-2">
                  <span className="truncate font-medium text-sm text-white">
                    {task.title}
                  </span>
                </CardContent>
              </Card>
            ))}

            {/* Empty state */}
            {timelineData.tasks.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="font-medium text-lg">No tasks to display</p>
                  <p className="mt-2 text-sm">
                    Create tasks with due dates to see them on the timeline
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onTaskUpdated={handleTaskUpdated}
        taskId={selectedTaskId}
      />
    </div>
  );
}
