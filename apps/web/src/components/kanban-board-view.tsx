"use client";

import type { TaskPriority, TaskStatus } from "@asana/api/schemas/task";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { TaskDetailModal } from "./task-detail-modal";

type KanbanBoardViewProps = {
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

type ColumnConfig = {
  id: TaskStatus;
  title: string;
  color: string;
};

const COLUMNS: ColumnConfig[] = [
  { id: "todo", title: "To Do", color: "bg-gray-50 border-gray-200" },
  {
    id: "in_progress",
    title: "In Progress",
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "completed",
    title: "Completed",
    color: "bg-green-50 border-green-200",
  },
];

const MAX_VISIBLE_TAGS = 3;

export function KanbanBoardView({ projectId }: KanbanBoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
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

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskItem[]> = {
      todo: [],
      in_progress: [],
      completed: [],
    };

    for (const task of tasks) {
      const status = task.status ?? "todo";
      if (grouped[status]) {
        const transformedTask: TaskItem = {
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
        };
        grouped[status].push(transformedTask);
      }
    }

    return grouped;
  }, [tasks]);

  const utils = trpc.useUtils();

  const updateTaskStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate and refetch tasks
      utils.task.getByProject.invalidate({ projectId });
    },
  });

  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskStatus.mutate({
        id: draggedTask.id,
        status: newStatus,
      });
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleTaskClick = (e: React.MouseEvent, taskId: string) => {
    // Prevent click when dragging
    if (draggedTask) return;

    e.stopPropagation();
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    // Invalidate and refetch tasks
    utils.task.getByProject.invalidate({ projectId });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return null;
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getPriorityBadgeColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div
        className="p-4 text-center text-red-600"
        data-testid="kanban-board-error"
      >
        Error loading tasks: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="p-8 text-center text-gray-500"
        data-testid="kanban-board-loading"
      >
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="kanban-board-view">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold text-lg">Board View</h2>
        <Button data-testid="add-task-button" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-6 overflow-x-auto p-6">
        {COLUMNS.map((column) => (
          <div
            aria-label={`${column.title} column`}
            className={`min-w-80 flex-1 ${column.color} rounded-lg border-2 ${
              dragOverColumn === column.id ? "border-blue-400 bg-blue-100" : ""
            }`}
            data-testid={`kanban-column-${column.id}`}
            key={column.id}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            role="region"
          >
            {/* Column Header */}
            <div className="border-gray-200 border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <span
                  className="rounded-full bg-white px-2 py-1 text-gray-500 text-sm"
                  data-testid={`task-count-${column.id}`}
                >
                  {tasksByStatus[column.id].length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex-1 space-y-3 p-4">
              {tasksByStatus[column.id].map((task) => (
                <Card
                  className={`cursor-move border-l-4 transition-shadow hover:shadow-md ${getPriorityColor(task.priority)} ${
                    draggedTask?.id === task.id ? "opacity-50" : ""
                  }`}
                  data-testid={`task-card-${task.id}`}
                  draggable
                  key={task.id}
                  onClick={(e) => handleTaskClick(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* Task Title */}
                      <h4
                        className="font-medium text-sm leading-tight"
                        data-testid={`task-title-${task.id}`}
                      >
                        {task.title}
                      </h4>

                      {/* Task Description */}
                      {task.description && (
                        <p
                          className="line-clamp-2 text-gray-600 text-xs"
                          data-testid={`task-description-${task.id}`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="flex items-center justify-between text-gray-500 text-xs">
                        <div className="flex items-center gap-2">
                          {/* Priority Badge */}
                          <span
                            className={`rounded-full px-2 py-1 font-medium text-xs ${getPriorityBadgeColor(task.priority)}`}
                            data-testid={`task-priority-${task.id}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Due Date */}
                        {task.dueDate && (
                          <span
                            className={`text-xs ${task.isOverdue ? "font-medium text-red-600" : "text-gray-500"}`}
                            data-testid={`task-due-date-${task.id}`}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div
                          className="flex flex-wrap gap-1"
                          data-testid={`task-tags-${task.id}`}
                        >
                          {task.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                            <span
                              className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs"
                              key={`${task.id}-tag-${tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > MAX_VISIBLE_TAGS && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs">
                              +{task.tags.length - MAX_VISIBLE_TAGS}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Assignee and Dependencies */}
                      <div className="flex items-center justify-between text-gray-500 text-xs">
                        {task.assigneeId && (
                          <span data-testid={`task-assignee-${task.id}`}>
                            👤 {task.assigneeId}
                          </span>
                        )}

                        {task.dependencies && task.dependencies.length > 0 && (
                          <span data-testid={`task-dependencies-${task.id}`}>
                            🔗 {task.dependencies.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {tasksByStatus[column.id].length === 0 && (
                <div
                  className="py-8 text-center text-gray-400"
                  data-testid={`empty-column-${column.id}`}
                >
                  <p className="text-sm">No tasks</p>
                  <p className="mt-1 text-xs">
                    Drag tasks here or create new ones
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
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
