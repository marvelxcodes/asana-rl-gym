"use client";

import type {
  TaskFilter,
  TaskPriority,
  TaskSort,
  TaskStatus,
} from "@asana/api/schemas/task";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Lock,
  MoreVertical,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AsanaQuickAddTask } from "@/components/asana-quick-add-task";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/utils/trpc";

type AsanaListViewProps = {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
};

type TaskGroup = {
  id: string;
  name: string;
  tasks: TaskItem[];
  isCollapsed: boolean;
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

export function AsanaListView({
  projectId,
  onTaskClick,
}: AsanaListViewProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeQuickAdd, setActiveQuickAdd] = useState<string | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = trpc.task.getByProject.useQuery({
    projectId,
  });

  // Group tasks by status/section
  const taskGroups: TaskGroup[] = useMemo(() => {
    const groups: Record<string, TaskItem[]> = {
      "Recently assigned": [],
      "Do today": [],
      "Do next week": [],
      "Do later": [],
    };

    for (const task of tasks) {
      const taskItem: TaskItem = {
        ...task,
        status: task.status ?? "todo",
        priority: task.priority ?? "medium",
      };

      // Simple grouping logic (can be enhanced)
      if (taskItem.status === "completed") {
        groups["Recently assigned"].push(taskItem);
      } else if (taskItem.dueDate) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (taskItem.dueDate <= now + dayMs) {
          groups["Do today"].push(taskItem);
        } else if (taskItem.dueDate <= now + 7 * dayMs) {
          groups["Do next week"].push(taskItem);
        } else {
          groups["Do later"].push(taskItem);
        }
      } else {
        groups["Recently assigned"].push(taskItem);
      }
    }

    return Object.entries(groups).map(([name, tasks]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      tasks,
      isCollapsed: collapsedSections.has(name),
    }));
  }, [tasks, collapsedSections]);

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
    },
  });

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
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading tasks...</div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white" data-testid="asana-list-view">
      <table className="w-full border-collapse">
        <tbody>
          {taskGroups.map((group) => (
            <tr key={group.id}>
              <td className="p-0" colSpan={6}>
                {/* Section Header */}
                <div className="sticky top-0 z-10 bg-white">
                  <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
                    <button
                      className="flex items-center gap-2 text-gray-900 text-sm font-semibold hover:text-gray-700"
                      data-testid={`section-toggle-${group.id}`}
                      onClick={() => toggleSection(group.name)}
                      type="button"
                    >
                      {group.isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {group.name}
                    </button>
                    <button
                      className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-gray-500 text-xs hover:bg-gray-100"
                      data-testid={`add-task-${group.id}`}
                      type="button"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      className="flex items-center gap-1 rounded px-2 py-1 text-gray-500 text-xs hover:bg-gray-100"
                      data-testid={`section-menu-${group.id}`}
                      type="button"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Column Headers (only for first expanded section) */}
                  {!group.isCollapsed && (
                    <div className="grid grid-cols-[auto_1fr_120px_100px_120px_100px] border-b border-gray-200 bg-gray-50 px-4 py-2 text-gray-600 text-xs font-medium">
                      <div className="w-12" />
                      <div>Task name</div>
                      <div>Due date</div>
                      <div>Collaborators</div>
                      <div>Projects</div>
                      <div>Task visibility</div>
                    </div>
                  )}
                </div>

                {/* Tasks */}
                {!group.isCollapsed && (
                  <table className="w-full">
                    <tbody>
                      {group.tasks.map((task) => (
                        <tr
                          className="group border-b border-gray-100 transition-colors hover:bg-gray-50"
                          data-testid={`task-row-${task.id}`}
                          key={task.id}
                          onMouseEnter={() => setHoveredRow(task.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {/* Drag Handle + Checkbox */}
                          <td className="w-12 px-4 py-0">
                            <div className="flex items-center gap-2">
                              <GripVertical
                                className={`h-4 w-4 text-gray-400 transition-opacity ${
                                  hoveredRow === task.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <Checkbox
                                checked={task.status === "completed"}
                                className="h-4 w-4"
                                data-testid={`task-checkbox-${task.id}`}
                                onCheckedChange={() =>
                                  toggleTaskStatus(task.id, task.status)
                                }
                              />
                            </div>
                          </td>

                          {/* Task Name */}
                          <td className="py-3">
                            <button
                              className="w-full text-left text-gray-900 text-sm hover:underline"
                              data-testid={`task-name-${task.id}`}
                              onClick={() => onTaskClick?.(task.id)}
                              type="button"
                            >
                              <span
                                className={
                                  task.status === "completed"
                                    ? "line-through opacity-60"
                                    : ""
                                }
                              >
                                {task.title}
                              </span>
                            </button>
                          </td>

                          {/* Due Date */}
                          <td className="w-32 py-3">
                            {task.dueDate ? (
                              <button
                                className="flex items-center gap-2 rounded px-2 py-1 text-gray-600 text-sm hover:bg-gray-100"
                                type="button"
                              >
                                {formatDate(task.dueDate)}
                              </button>
                            ) : (
                              <button
                                className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                                type="button"
                              >
                                <Calendar className="h-3 w-3" />
                              </button>
                            )}
                          </td>

                          {/* Collaborators */}
                          <td className="w-24 py-3">
                            <button
                              className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                              type="button"
                            >
                              <Users className="h-3 w-3" />
                            </button>
                          </td>

                          {/* Projects */}
                          <td className="w-32 py-3">
                            <button
                              className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                              type="button"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </td>

                          {/* Visibility */}
                          <td className="w-24 py-3">
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Lock className="h-3 w-3" />
                              <span>Only me</span>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Add task row */}
                      {activeQuickAdd === group.id ? (
                        <tr>
                          <td className="p-0" colSpan={6}>
                            <AsanaQuickAddTask
                              onCancel={() => setActiveQuickAdd(null)}
                              onSuccess={() => setActiveQuickAdd(null)}
                              projectId={projectId}
                              sectionId={group.id}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr className="group border-b border-gray-100 transition-colors hover:bg-gray-50">
                          <td className="px-4 py-3" colSpan={6}>
                            <button
                              className="flex w-full items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-700"
                              data-testid={`add-task-inline-${group.id}`}
                              onClick={() => setActiveQuickAdd(group.id)}
                              type="button"
                            >
                              <Plus className="h-4 w-4" />
                              Add task…
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
