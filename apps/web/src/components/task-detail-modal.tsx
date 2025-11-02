"use client";

import type {
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "@asana/api/schemas/task";
import { Calendar, ChevronDown, Flag, Tag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { TaskComments } from "./task-comments";

type TaskDetailModalProps = {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
};

type TaskFormData = {
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
  tags: string[];
};

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "text-green-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
    tags: [],
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch task details when taskId changes
  const { data: task, isLoading } = trpc.task.getById.useQuery(
    { id: taskId || "" },
    {
      enabled: !!taskId && isOpen,
    }
  );

  // Update form data when task data is loaded
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.title,
        description: task.description || "",
        status: task.status ?? "todo",
        priority: task.priority ?? "medium",
        assigneeId: task.assigneeId || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        tags: [], // Not used in mock data
      });
    }
  }, [task]);

  // Update task mutation
  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      onTaskUpdated?.();
      onClose();
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        status: "todo",
        priority: "medium",
        assigneeId: "",
        dueDate: "",
        tags: [],
      });
      setNewTag("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(taskId && formData.name.trim())) {
      return;
    }

    setIsSubmitting(true);

    const updateData: UpdateTaskInput = {
      id: taskId,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      priority: formData.priority,
      assigneeId: formData.assigneeId || undefined,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).getTime()
        : undefined,
      tags: formData.tags,
    };

    try {
      await updateTask.mutateAsync(updateData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!(isOpen && taskId)) {
    return null;
  }

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        data-testid="task-detail-modal"
      >
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading Task..." : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading task details...
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                data-testid="task-name-input"
                id="task-name"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter task name..."
                required
                value={formData.name}
              />
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <textarea
                className="resize-vertical w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="task-description-input"
                id="task-description"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter task description..."
                rows={4}
                value={formData.description}
              />
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between"
                      data-testid="status-dropdown-trigger"
                      variant="outline"
                    >
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        {
                          STATUS_OPTIONS.find(
                            (opt) => opt.value === formData.status
                          )?.label
                        }
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-full"
                    data-testid="status-dropdown-menu"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            status: option.value,
                          }))
                        }
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between"
                      data-testid="priority-dropdown-trigger"
                      variant="outline"
                    >
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        <span
                          className={
                            PRIORITY_OPTIONS.find(
                              (opt) => opt.value === formData.priority
                            )?.color
                          }
                        >
                          {
                            PRIORITY_OPTIONS.find(
                              (opt) => opt.value === formData.priority
                            )?.label
                          }
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-full"
                    data-testid="priority-dropdown-menu"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            priority: option.value,
                          }))
                        }
                      >
                        <span className={option.color}>{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Assignee and Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <div className="relative">
                  <User className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                  <Input
                    className="pl-10"
                    data-testid="task-assignee-input"
                    id="task-assignee"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigneeId: e.target.value,
                      }))
                    }
                    placeholder="Enter user ID or email..."
                    value={formData.assigneeId}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <div className="relative">
                  <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                  <Input
                    className="pl-10"
                    data-testid="task-due-date-input"
                    id="task-due-date"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    type="date"
                    value={formData.dueDate}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>

              {/* Existing Tags */}
              {formData.tags.length > 0 && (
                <div
                  className="mb-2 flex flex-wrap gap-2"
                  data-testid="task-tags-list"
                >
                  {formData.tags.map((tag) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-sm"
                      key={tag}
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        className="ml-1 hover:text-blue-600"
                        data-testid={`remove-tag-${tag}`}
                        onClick={() => handleRemoveTag(tag)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                  <Input
                    className="pl-10"
                    data-testid="new-tag-input"
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    value={newTag}
                  />
                </div>
                <Button
                  data-testid="add-tag-button"
                  disabled={!newTag.trim()}
                  onClick={handleAddTag}
                  type="button"
                  variant="outline"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Task Comments */}
            <div className="border-t pt-6">
              <TaskComments taskId={taskId} />
            </div>

            <DialogFooter>
              <Button
                data-testid="cancel-button"
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                data-testid="save-button"
                disabled={isSubmitting || !formData.name.trim()}
                type="submit"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
