"use client";

import type { TaskPriority, TaskStatus } from "@asana/api/schemas/task";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { TaskDetailModal } from "./task-detail-modal";

type CalendarViewProps = {
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
  tags?: string[];
  dependencies?: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  isOverdue?: boolean;
};

type CalendarDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskItem[];
};

type CalendarWeek = CalendarDay[];

const DAYS_PER_WEEK = 7;
const WEEKS_IN_CALENDAR = 6;
const MAX_TASKS_DISPLAY = 3;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarView({ projectId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Generate calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of the month and calculate start of calendar
    const firstDayOfMonth = new Date(year, month, 1);
    const startOfCalendar = new Date(firstDayOfMonth);
    startOfCalendar.setDate(
      startOfCalendar.getDate() - firstDayOfMonth.getDay()
    );

    // Generate calendar weeks
    const weeks: CalendarWeek[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let week = 0; week < WEEKS_IN_CALENDAR; week += 1) {
      const weekDays: CalendarDay[] = [];

      for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
        const currentCalendarDate = new Date(startOfCalendar);
        currentCalendarDate.setDate(
          startOfCalendar.getDate() + week * DAYS_PER_WEEK + day
        );

        const isCurrentMonth = currentCalendarDate.getMonth() === month;
        const isToday = currentCalendarDate.getTime() === today.getTime();

        // Find tasks for this day
        const dayTasks = tasks
          .filter((task) => {
            if (!task.dueDate) {
              return false;
            }

            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);

            return taskDate.getTime() === currentCalendarDate.getTime();
          })
          .map((task) => ({
            ...task,
            description: task.description ?? undefined,
            status: task.status ?? "todo",
            priority: task.priority ?? "medium",
            assigneeId: task.assigneeId ?? undefined,
            dueDate: task.dueDate
              ? typeof task.dueDate === "string"
                ? Number.parseInt(task.dueDate)
                : task.dueDate
              : undefined,
            completedAt: task.completedAt
              ? typeof task.completedAt === "string"
                ? Number.parseInt(task.completedAt)
                : task.completedAt
              : undefined,
            createdAt:
              typeof task.createdAt === "string"
                ? Number.parseInt(task.createdAt)
                : task.createdAt,
            updatedAt:
              typeof task.updatedAt === "string"
                ? Number.parseInt(task.updatedAt)
                : task.updatedAt,
            tags: [], // Not used in mock data
            dependencies: [], // Not used in mock data
          })) as TaskItem[];

        weekDays.push({
          date: new Date(currentCalendarDate),
          dayNumber: currentCalendarDate.getDate(),
          isCurrentMonth,
          isToday,
          tasks: dayTasks,
        });
      }

      weeks.push(weekDays);
    }

    return weeks;
  }, [currentDate, tasks]);

  // Navigate to previous/next month
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const utils = trpc.useUtils();

  const handleTaskUpdated = () => {
    utils.task.getByProject.invalidate({ projectId });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low":
        return "bg-green-100 border-green-300 text-green-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "✓";
      case "in_progress":
        return "⏳";
      case "todo":
        return "○";
      default:
        return "○";
    }
  };

  if (error) {
    return (
      <div
        className="p-4 text-center text-red-600"
        data-testid="calendar-view-error"
      >
        Error loading tasks: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="p-8 text-center text-gray-500"
        data-testid="calendar-view-loading"
      >
        Loading calendar...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="calendar-view">
      {/* Header with navigation */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Calendar View</h2>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button
              data-testid="calendar-nav-prev"
              onClick={() => navigateMonth("prev")}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-48 text-center">
              <span className="font-medium text-lg">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>

            <Button
              data-testid="calendar-nav-next"
              onClick={() => navigateMonth("next")}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            data-testid="calendar-today-button"
            onClick={goToToday}
            size="sm"
            variant="outline"
          >
            Today
          </Button>
        </div>

        <Button data-testid="add-task-button" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid h-full grid-cols-7 gap-1 rounded-lg border">
          {/* Weekday headers */}
          {WEEKDAYS.map((day) => (
            <div
              className="border-b bg-gray-50 p-3 text-center font-medium text-gray-700 text-sm"
              data-testid={`calendar-weekday-${day.toLowerCase()}`}
              key={day}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarData.flat().map((day, index) => (
            <div
              className={`min-h-32 border-r border-b p-2 ${
                day.isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${day.isToday ? "border-blue-200 bg-blue-50" : ""}`}
              data-testid={`calendar-day-${day.date.toISOString().split("T")[0]}`}
              key={`${day.date.getTime()}-${index}`}
            >
              {/* Day number */}
              <div
                className={`mb-2 text-sm ${
                  day.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                } ${day.isToday ? "font-bold text-blue-600" : ""}`}
              >
                {day.dayNumber}
              </div>

              {/* Tasks for this day */}
              <div className="space-y-1">
                {day.tasks.slice(0, MAX_TASKS_DISPLAY).map((task) => (
                  <button
                    className={`w-full rounded border p-1 text-left text-xs hover:shadow-sm ${getPriorityColor(task.priority)}`}
                    data-testid={`calendar-task-${task.id}`}
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleTaskClick(task.id);
                      }
                    }}
                    type="button"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">
                        {getStatusIcon(task.status)}
                      </span>
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                  </button>
                ))}

                {/* Show more indicator */}
                {day.tasks.length > MAX_TASKS_DISPLAY && (
                  <div className="text-gray-500 text-xs">
                    +{day.tasks.length - MAX_TASKS_DISPLAY} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <span>○ Todo</span>
            <span>⏳ In Progress</span>
            <span>✓ Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Priority:</span>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-yellow-500" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {tasks.filter((task) => task.dueDate).length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            <p className="font-medium text-lg">No tasks with due dates</p>
            <p className="mt-2 text-sm">
              Add due dates to your tasks to see them on the calendar
            </p>
          </div>
        )}
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
