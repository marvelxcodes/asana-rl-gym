"use client";

import type {
  TaskFilter,
  TaskPriority,
  TaskSort,
  TaskStatus,
} from "@asana/api/schemas/task";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";

type TaskListViewProps = {
  projectId: string;
};

type TaskItem = {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: number | null;
  tags: string[];
  dependencies: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  isOverdue?: boolean;
};

export function TaskListView({ projectId }: TaskListViewProps) {
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all"
  );
  const [sortField, setSortField] = useState<TaskSort["field"]>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<TaskSort["direction"]>("desc");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build filter object for API
  const filter: TaskFilter = useMemo(() => {
    const baseFilter: TaskFilter = { projectId };

    if (statusFilter !== "all") {
      baseFilter.status = statusFilter;
    }

    if (priorityFilter !== "all") {
      baseFilter.priority = priorityFilter;
    }

    return baseFilter;
  }, [projectId, statusFilter, priorityFilter]);

  // Build sort object for API
  const sort: TaskSort = useMemo(
    () => ({
      field: sortField,
      direction: sortDirection,
    }),
    [sortField, sortDirection]
  );

  // Fetch tasks with filtering and sorting
  const {
    data: tasks = [],
    isLoading,
    error,
  } = trpc.task.getByProject.useQuery({
    projectId,
    filter,
    sort,
  });

  // Filter tasks by search query (client-side for name/description)
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }

    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description?.toLowerCase().includes(query) ?? false)
    );
  }, [tasks, searchQuery]);

  // Group tasks by hierarchy (for now, just show flat list)
  const hierarchicalTasks = useMemo(() => {
    // TODO: Implement proper hierarchy based on dependencies
    return filteredTasks.map((task) => ({
      ...task,
      level: 0, // All tasks at root level for now
    }));
  }, [filteredTasks]);

  const handleStatusChange = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate and refetch tasks
      utils.task.getByProject.invalidate({ projectId, filter, sort });
    },
  });

  const toggleTaskStatus = (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus =
      currentStatus === "completed" ? "todo" : "completed";
    handleStatusChange.mutate({ id: taskId, status: newStatus });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    // Invalidate and refetch tasks
    utils.task.getByProject.invalidate({ projectId, filter, sort });
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
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "todo":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  if (error) {
    return (
      <div
        className="p-4 text-center text-red-600"
        data-testid="task-list-error"
      >
        Error loading tasks: {error.message}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="task-list-view">
      {/* Header with search and filters */}
      <div className="flex items-center gap-4 border-b p-4">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
          <Input
            className="pl-10"
            data-testid="task-search-input"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            value={searchQuery}
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="status-filter-trigger"
              size="sm"
              variant="outline"
            >
              <Filter className="mr-2 h-4 w-4" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="status-filter-menu">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("todo")}>
              Todo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
              Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="priority-filter-trigger"
              size="sm"
              variant="outline"
            >
              Priority: {priorityFilter === "all" ? "All" : priorityFilter}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="priority-filter-menu">
            <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("urgent")}>
              Urgent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="sort-trigger" size="sm" variant="outline">
              Sort: {sortField} ({sortDirection})
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="sort-menu">
            <DropdownMenuItem
              onClick={() => {
                setSortField("priority");
                setSortDirection("desc");
              }}
            >
              Priority (High to Low)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortField("dueDate");
                setSortDirection("asc");
              }}
            >
              Due Date (Earliest First)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortField("createdAt");
                setSortDirection("desc");
              }}
            >
              Created Date (Newest First)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortField("name");
                setSortDirection("asc");
              }}
            >
              Name (A to Z)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button data-testid="add-task-button" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto" data-testid="task-list-container">
        {isLoading ? (
          <div
            className="p-8 text-center text-gray-500"
            data-testid="task-list-loading"
          >
            Loading tasks...
          </div>
        ) : hierarchicalTasks.length === 0 ? (
          <div
            className="p-8 text-center text-gray-500"
            data-testid="task-list-empty"
          >
            {searchQuery
              ? "No tasks match your search."
              : "No tasks found. Create your first task!"}
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {hierarchicalTasks.map((task) => (
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                data-testid={`task-item-${task.id}`}
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                style={{ marginLeft: `${task.level * 24}px` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Task Checkbox */}
                    <Checkbox
                      checked={task.status === "completed"}
                      data-testid={`task-checkbox-${task.id}`}
                      onCheckedChange={() =>
                        toggleTaskStatus(task.id, task.status)
                      }
                    />

                    {/* Task Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4
                          className={`truncate font-medium ${
                            task.status === "completed"
                              ? "text-gray-500 line-through"
                              : ""
                          }`}
                          data-testid={`task-name-${task.id}`}
                        >
                          {task.title}
                        </h4>

                        {/* Priority Badge */}
                        <span
                          className={`rounded-full bg-gray-100 px-2 py-1 text-xs ${getPriorityColor(task.priority)}`}
                          data-testid={`task-priority-${task.id}`}
                        >
                          {task.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full bg-gray-100 px-2 py-1 text-xs ${getStatusColor(task.status)}`}
                          data-testid={`task-status-${task.id}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>

                      {task.description && (
                        <p
                          className="truncate text-gray-600 text-sm"
                          data-testid={`task-description-${task.id}`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta Information */}
                      <div className="mt-2 flex items-center gap-4 text-gray-500 text-xs">
                        {task.dueDate && (
                          <span
                            className={task.dueDate < Date.now() && task.status !== "completed" ? "text-red-600" : ""}
                            data-testid={`task-due-date-${task.id}`}
                          >
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}

                        {task.assigneeId && (
                          <span data-testid={`task-assignee-${task.id}`}>
                            Assigned to: {task.assigneeId}
                          </span>
                        )}

                        {/* Tags not used in mock data */}

                        {/* Dependencies not used in mock data */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
