"use client";

import type { TaskStatus } from "@asana/api/schemas/task";
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
import { AsanaCheckbox } from "@/components/asana-checkbox";
import {
  type FilterType,
  type GroupType,
  type SortType,
} from "@/components/asana-header-exact";
import { AsanaQuickAddTask } from "@/components/asana-quick-add-task";
import { trpc } from "@/utils/trpc";

type AsanaListViewExactProps = {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
  filter?: FilterType;
  sort?: SortType;
  group?: GroupType;
};

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: number | null;
  createdAt: number;
  updatedAt: number;
};

type TaskGroup = {
  id: string;
  name: string;
  tasks: TaskItem[];
  isCollapsed: boolean;
};

export function AsanaListViewExact({
  projectId,
  onTaskClick,
  filter = "all",
  sort = "none",
  group = "section",
}: AsanaListViewExactProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeQuickAdd, setActiveQuickAdd] = useState<string | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = trpc.task.getByProject.useQuery({
    projectId,
  });

  // Apply filtering and sorting to tasks
  const processedTasks = useMemo(() => {
    let filtered = tasks.map((task) => ({
      ...task,
      status: task.status ?? "todo",
    }));

    // Apply filter
    if (filter === "completed") {
      filtered = filtered.filter((task) => task.status === "completed");
    } else if (filter === "incomplete") {
      filtered = filtered.filter((task) => task.status !== "completed");
    }

    // Apply sort
    if (sort === "dueDate") {
      filtered.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });
    } else if (sort === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [tasks, filter, sort]);

  // Group tasks by status/section
  const taskGroups: TaskGroup[] = useMemo(() => {
    if (group === "none") {
      return [
        {
          id: "all-tasks",
          name: "All tasks",
          tasks: processedTasks,
          isCollapsed: collapsedSections.has("All tasks"),
        },
      ];
    }

    const groups: Record<string, TaskItem[]> = {};

    if (group === "section") {
      groups["Recently assigned"] = [];
      for (const task of processedTasks) {
        groups["Recently assigned"].push(task);
      }
    } else if (group === "dueDate") {
      groups["Overdue"] = [];
      groups["Due today"] = [];
      groups["Due this week"] = [];
      groups["Later"] = [];
      groups["No due date"] = [];

      const now = Date.now();
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      for (const task of processedTasks) {
        if (!task.dueDate) {
          groups["No due date"].push(task);
        } else if (task.dueDate < now) {
          groups["Overdue"].push(task);
        } else if (task.dueDate <= todayEnd.getTime()) {
          groups["Due today"].push(task);
        } else if (task.dueDate <= weekEnd.getTime()) {
          groups["Due this week"].push(task);
        } else {
          groups["Later"].push(task);
        }
      }
    } else if (group === "assignee") {
      groups["Unassigned"] = [];
      for (const task of processedTasks) {
        groups["Unassigned"].push(task);
      }
    } else if (group === "project") {
      groups["This project"] = processedTasks;
    }

    return Object.entries(groups)
      .filter(([, tasks]) => tasks.length > 0)
      .map(([name, tasks]) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        tasks,
        isCollapsed: collapsedSections.has(name),
      }));
  }, [processedTasks, group, collapsedSections]);

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
      <div className="p-8 text-center text-gray-500 text-sm">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white" data-testid="asana-list-view">
      <div className="min-w-max">
        {/* Column Headers - Exact Asana Match */}
        <div className="sticky top-0 z-10 grid grid-cols-[auto_minmax(300px,1fr)_160px_120px_120px_140px] border-b border-[#EDEAE9] bg-white px-6" style={{ height: '37px' }}>
          <div className="w-11 flex items-center" /> {/* Checkbox column */}
          <div className="text-[#1E1F21] text-sm font-normal flex items-center">
            Name
          </div>
          <div className="text-[#1E1F21] text-sm font-normal flex items-center">
            Due date ↓
          </div>
          <div className="text-[#1E1F21] text-sm font-normal flex items-center">
            Collaborators
          </div>
          <div className="text-[#1E1F21] text-sm font-normal flex items-center">
            Projects
          </div>
          <div className="text-[#1E1F21] text-sm font-normal flex items-center">
            Task visibility
          </div>
        </div>

        {taskGroups.map((group) => (
          <div key={group.id}>
            {/* Section Header */}
            <div className="sticky top-10 z-10 bg-white">
              <div className="flex h-10 items-center justify-between border-b border-gray-200 px-6">
                <button
                  className="flex items-center gap-2 text-gray-900 text-sm font-medium hover:text-gray-700"
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
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100"
                    data-testid={`add-task-${group.id}`}
                    onClick={() => setActiveQuickAdd(group.id)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100"
                    type="button"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks */}
            {!group.isCollapsed && (
              <>
                {group.tasks.map((task) => (
                  <div
                    className="group grid grid-cols-[auto_minmax(300px,1fr)_160px_120px_120px_140px] border-b border-[#EDEAE9] px-6 transition-colors hover:bg-[#FAFAFA]"
                    data-testid={`task-row-${task.id}`}
                    key={task.id}
                    onMouseEnter={() => setHoveredRow(task.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ height: '37px' }}
                  >
                    {/* Checkbox Column */}
                    <div className="flex w-11 items-center gap-2">
                      <GripVertical
                        className={`h-4 w-4 text-gray-400 transition-opacity ${
                          hoveredRow === task.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <AsanaCheckbox
                        checked={task.status === "completed"}
                        data-testid={`task-checkbox-${task.id}`}
                        onCheckedChange={() =>
                          toggleTaskStatus(task.id, task.status)
                        }
                      />
                    </div>

                    {/* Task Name */}
                    <div className="flex items-center">
                      <button
                        className="text-left text-gray-900 text-sm hover:underline"
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
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center">
                      {task.dueDate ? (
                        <span className="text-gray-600 text-sm">
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <button
                          className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                          type="button"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Collaborators */}
                    <div className="flex items-center">
                      <button
                        className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                        type="button"
                      >
                        <Users className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Projects */}
                    <div className="flex items-center">
                      <button
                        className="flex items-center gap-1 rounded px-2 py-1 text-gray-400 text-sm opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Lock className="h-3 w-3" />
                      <span>Only me</span>
                    </div>
                  </div>
                ))}

                {/* Add task row */}
                {activeQuickAdd === group.id ? (
                  <div className="border-b border-gray-200">
                    <AsanaQuickAddTask
                      onCancel={() => setActiveQuickAdd(null)}
                      onSuccess={() => setActiveQuickAdd(null)}
                      projectId={projectId}
                      sectionId={group.id}
                    />
                  </div>
                ) : (
                  <div className="border-b border-gray-100 px-6 py-2 hover:bg-gray-50">
                    <button
                      className="flex w-full items-center gap-2 text-gray-500 text-sm hover:text-gray-700"
                      data-testid={`add-task-inline-${group.id}`}
                      onClick={() => setActiveQuickAdd(group.id)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                      Add task…
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
