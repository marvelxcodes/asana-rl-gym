"use client";

import type { TaskStatus } from "@asana/api/schemas/task";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

type AsanaCalendarViewProps = {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
};

type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

export function AsanaCalendarView({
  projectId,
  onTaskClick,
}: AsanaCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch tasks
  const { data: tasksData = [] } = trpc.task.getByProject.useQuery({
    projectId,
  });

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {};
    for (const task of tasksData) {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push({
          id: task.id,
          title: task.title,
          status: task.status ?? "todo",
          dueDate: task.dueDate,
        });
      }
    }
    return grouped;
  }, [tasksData]);

  const getTasksForDay = (day: number | null) => {
    if (!day) return [];
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return tasksByDate[key] || [];
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="flex h-full flex-col bg-white" data-testid="asana-calendar-view">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900 text-xl">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              data-testid="previous-month"
              onClick={previousMonth}
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              data-testid="next-month"
              onClick={nextMonth}
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            data-testid="today-button"
            onClick={() => setCurrentDate(new Date())}
            size="sm"
            variant="outline"
          >
            Today
          </Button>
        </div>

        <Button data-testid="add-task-calendar" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200">
          {/* Day Headers */}
          {DAYS.map((day) => (
            <div
              className="bg-gray-50 p-3 text-center font-semibold text-gray-700 text-sm"
              key={day}
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            return (
              <div
                className={`group relative min-h-24 bg-white p-2 transition-colors hover:bg-gray-50 ${
                  day ? "cursor-pointer" : ""
                }`}
                data-testid={day ? `calendar-day-${day}` : undefined}
                key={`day-${index.toString()}`}
              >
                {day && (
                  <>
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                        isToday(day)
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </div>

                    {/* Tasks for this day */}
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <button
                          className={`w-full truncate rounded px-1.5 py-0.5 text-left text-xs transition-colors ${getStatusColor(task.status)}`}
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick?.(task.id);
                          }}
                          type="button"
                        >
                          {task.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="px-1.5 text-gray-500 text-xs">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Add task button on hover */}
                    <button
                      className="absolute top-2 right-2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-700 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      type="button"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
