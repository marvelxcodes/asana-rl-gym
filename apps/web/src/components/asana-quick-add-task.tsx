"use client";

import type { TaskPriority } from "@asana/api/schemas/task";
import { Calendar, Flag, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";

type AsanaQuickAddTaskProps = {
  projectId: string;
  sectionId?: string;
  onCancel: () => void;
  onSuccess?: () => void;
  autoFocus?: boolean;
};

export function AsanaQuickAddTask({
  projectId,
  sectionId,
  onCancel,
  onSuccess,
  autoFocus = true,
}: AsanaQuickAddTaskProps) {
  const [taskName, setTaskName] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const utils = trpc.useUtils();
  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId });
      setTaskName("");
      setDueDate("");
      setPriority("medium");
      setIsExpanded(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    createTask.mutate({
      title: taskName.trim(),
      projectId,
      status: "todo",
      priority,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && e.metaKey) {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="border-b border-gray-200 bg-white transition-all duration-200"
      data-testid="quick-add-task"
    >
      <form onSubmit={handleSubmit}>
        {/* Main Input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-4 w-4 items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
          </div>
          <Input
            className="flex-1 border-0 px-0 text-sm focus-visible:ring-0"
            data-testid="task-name-input"
            onBlur={() => {
              if (!taskName.trim() && !isExpanded) {
                onCancel();
              }
            }}
            onChange={(e) => setTaskName(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Task name"
            ref={inputRef}
            value={taskName}
          />
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div
            className="border-t border-gray-100 px-4 pb-3 pt-2 transition-all duration-200"
            data-testid="task-options"
          >
            <div className="mb-3 flex items-center gap-2">
              {/* Due Date */}
              <button
                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-gray-600 text-xs transition-colors hover:bg-gray-50"
                data-testid="due-date-button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                type="button"
              >
                <Calendar className="h-3 w-3" />
                <span>Due date</span>
              </button>

              {/* Assignee */}
              <button
                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-gray-600 text-xs transition-colors hover:bg-gray-50"
                data-testid="assignee-button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                type="button"
              >
                <Users className="h-3 w-3" />
                <span>Assignee</span>
              </button>

              {/* Priority */}
              <button
                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-gray-600 text-xs transition-colors hover:bg-gray-50"
                data-testid="priority-button"
                onClick={(e) => {
                  e.preventDefault();
                }}
                type="button"
              >
                <Flag className="h-3 w-3" />
                <span>Priority</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  data-testid="create-task-button"
                  disabled={!taskName.trim() || createTask.isPending}
                  size="sm"
                  type="submit"
                >
                  {createTask.isPending ? "Creating..." : "Create task"}
                </Button>
                <Button
                  data-testid="cancel-button"
                  onClick={onCancel}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
              <div className="text-gray-500 text-xs">⌘↵ to save</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
