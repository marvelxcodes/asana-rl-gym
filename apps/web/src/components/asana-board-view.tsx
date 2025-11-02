"use client";

import type { TaskPriority, TaskStatus } from "@asana/api/schemas/task";
import { Calendar, MoreVertical, Plus, Users } from "lucide-react";
import { useState } from "react";
import { AsanaQuickAddTask } from "@/components/asana-quick-add-task";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/utils/trpc";

type AsanaBoardViewProps = {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
};

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
};

type Column = {
  id: TaskStatus;
  title: string;
  tasks: TaskItem[];
};

export function AsanaBoardView({
  projectId,
  onTaskClick,
}: AsanaBoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [activeQuickAdd, setActiveQuickAdd] = useState<TaskStatus | null>(null);

  // Fetch tasks
  const { data: tasks = [] } = trpc.task.getByProject.useQuery({
    projectId,
  });

  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
    },
  });

  // Group tasks by status
  const columns: Column[] = [
    {
      id: "todo",
      title: "Recently assigned",
      tasks: tasks.filter((t) => (t.status ?? "todo") === "todo"),
    },
    {
      id: "in_progress",
      title: "Do today",
      tasks: tasks.filter((t) => (t.status ?? "todo") === "in_progress"),
    },
    {
      id: "completed",
      title: "Do next week",
      tasks: tasks.filter((t) => (t.status ?? "todo") === "completed"),
    },
  ];

  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      updateStatus.mutate({ id: draggedTask.id, status: newStatus });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const toggleTaskStatus = (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus =
      currentStatus === "completed" ? "todo" : "completed";
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="flex h-full gap-4 overflow-x-auto bg-[#F6F7F8] p-6"
      data-testid="asana-board-view"
    >
      {columns.map((column) => (
        <div
          className="flex min-w-80 flex-col"
          data-testid={`column-${column.id}`}
          key={column.id}
        >
          {/* Column Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {column.title}
              </h3>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-600 text-xs">
                {column.tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded p-1 text-gray-500 hover:bg-gray-200"
                data-testid={`add-task-${column.id}`}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1 text-gray-500 hover:bg-gray-200"
                type="button"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`flex flex-1 flex-col gap-3 rounded-lg p-2 transition-colors ${
              dragOverColumn === column.id
                ? "bg-blue-50 ring-2 ring-blue-300"
                : "bg-transparent"
            }`}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Task Cards */}
            {column.tasks.map((task) => (
              <div
                className={`group cursor-move rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-100 ${
                  draggedTask?.id === task.id ? "rotate-2 scale-105 opacity-70" : "opacity-100"
                }`}
                data-testid={`task-card-${task.id}`}
                draggable
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                onDragEnd={handleDragEnd}
                onDragStart={(e) => handleDragStart(e, task)}
              >
                {/* Task Header */}
                <div className="mb-2 flex items-start gap-2">
                  <Checkbox
                    checked={task.status === "completed"}
                    className="mt-0.5 h-4 w-4"
                    data-testid={`task-checkbox-${task.id}`}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() =>
                      toggleTaskStatus(task.id, task.status ?? "todo")
                    }
                  />
                  <div className="flex-1">
                    <h4
                      className={`text-sm ${
                        task.status === "completed"
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h4>
                  </div>
                </div>

                {/* Task Description */}
                {task.description && (
                  <p className="mb-2 line-clamp-2 text-gray-600 text-xs">
                    {task.description}
                  </p>
                )}

                {/* Task Meta */}
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded p-1 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      type="button"
                    >
                      <Users className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Task Button */}
            {activeQuickAdd === column.id ? (
              <div className="rounded-lg bg-white shadow-sm">
                <AsanaQuickAddTask
                  onCancel={() => setActiveQuickAdd(null)}
                  onSuccess={() => setActiveQuickAdd(null)}
                  projectId={projectId}
                  sectionId={column.id}
                />
              </div>
            ) : (
              <button
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 text-sm transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
                data-testid={`add-task-inline-${column.id}`}
                onClick={() => setActiveQuickAdd(column.id)}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Column Button */}
      <div className="flex min-w-80 items-start">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
          data-testid="add-column"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add section
        </button>
      </div>
    </div>
  );
}
