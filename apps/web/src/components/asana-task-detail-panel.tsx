"use client";

import type { TaskPriority, TaskStatus } from "@asana/api/schemas/task";
import {
  Calendar,
  ChevronDown,
  Flag,
  Link2,
  Lock,
  MoreHorizontal,
  Paperclip,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";

type AsanaTaskDetailPanelProps = {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
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

export function AsanaTaskDetailPanel({
  taskId,
  isOpen,
  onClose,
}: AsanaTaskDetailPanelProps) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

  // Fetch task details
  const { data: task } = trpc.task.getById.useQuery(
    { id: taskId || "" },
    { enabled: !!taskId && isOpen }
  );

  useEffect(() => {
    if (task) {
      setTaskName(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  const utils = trpc.useUtils();
  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.getById.invalidate({ id: taskId || "" });
    },
  });

  const toggleComplete = () => {
    if (!taskId || !task) return;
    const newStatus: TaskStatus =
      task.status === "completed" ? "todo" : "completed";
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  const handleSaveDescription = () => {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, description });
  };

  if (!isOpen || !taskId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity"
        data-testid="task-panel-backdrop"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 z-50 flex h-screen w-[800px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform"
        data-testid="task-detail-panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              className={`gap-2 ${
                task?.status === "completed"
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-white hover:bg-gray-100"
              }`}
              data-testid="mark-complete-button"
              onClick={toggleComplete}
              size="sm"
              variant="outline"
            >
              <Checkbox
                checked={task?.status === "completed"}
                className="h-4 w-4"
              />
              {task?.status === "completed" ? "Completed" : "Mark complete"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button data-testid="like-button" size="icon" variant="ghost">
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button data-testid="attach-button" size="icon" variant="ghost">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button data-testid="copy-link-button" size="icon" variant="ghost">
              <Link2 className="h-4 w-4" />
            </Button>
            <Button data-testid="more-actions-button" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              data-testid="close-panel-button"
              onClick={onClose}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Task Name */}
            <div className="mb-6">
              <Input
                className="border-0 px-0 font-semibold text-2xl focus-visible:ring-0"
                data-testid="task-name-input"
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Write a task name"
                value={taskName}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Description
              </Label>
              <Textarea
                className="min-h-32 resize-none text-sm"
                data-testid="task-description-input"
                onBlur={handleSaveDescription}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this task about?"
                value={description}
              />
            </div>

            {/* Subtasks */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-gray-700 text-xs font-semibold uppercase">
                  Subtasks
                </Label>
              </div>
              <button
                className="flex w-full items-center gap-2 rounded border-2 border-dashed border-gray-300 p-3 text-gray-500 text-sm transition-colors hover:border-gray-400 hover:bg-gray-50"
                data-testid="add-subtask-button"
                type="button"
              >
                <Checkbox className="h-4 w-4" />
                Add subtask
              </button>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-center gap-4">
                <button
                  className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === "comments"
                      ? "border-b-2 border-blue-600 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  data-testid="comments-tab"
                  onClick={() => setActiveTab("comments")}
                  type="button"
                >
                  Comments
                </button>
                <button
                  className={`pb-2 text-sm font-medium transition-colors ${
                    activeTab === "activity"
                      ? "border-b-2 border-blue-600 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  data-testid="activity-tab"
                  onClick={() => setActiveTab("activity")}
                  type="button"
                >
                  All activity
                </button>
              </div>

              {/* Comment Input */}
              <div className="mb-4 flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-gray-700 text-xs font-semibold">U</span>
                </div>
                <div className="flex-1">
                  <Textarea
                    className="mb-2 min-h-20 text-sm"
                    data-testid="comment-input"
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    value={newComment}
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="post-comment-button"
                    disabled={!newComment.trim()}
                    onClick={() => {
                      // In a real app, would post comment
                      setNewComment("");
                    }}
                    size="sm"
                  >
                    Comment
                  </Button>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                <div className="flex gap-3 text-gray-600 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-gray-700 text-xs font-semibold">GB</span>
                  </div>
                  <div>
                    <p>
                      <span className="font-semibold text-gray-900">George B. Baku</span>{" "}
                      created this task · Nov 22, 2024
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Metadata */}
          <div className="w-64 border-l border-gray-200 bg-gray-50 p-6">
            {/* Assignee */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Assignee
              </Label>
              <button
                className="flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                data-testid="assignee-button"
                type="button"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xs font-semibold">U</span>
                </div>
                <span className="flex-1">Assign</span>
              </button>
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Due date
              </Label>
              <button
                className="flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                data-testid="due-date-button"
                type="button"
              >
                <Calendar className="h-4 w-4" />
                No due date
              </button>
            </div>

            {/* Projects */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Projects
              </Label>
              <button
                className="flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                data-testid="projects-button"
                type="button"
              >
                Add to projects
              </button>
            </div>

            {/* Priority */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Priority
              </Label>
              <button
                className="flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                data-testid="priority-button"
                type="button"
              >
                <Flag className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-gray-500">Set priority</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Collaborators */}
            <div className="mb-6">
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Collaborators
              </Label>
              <button
                className="flex w-full items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                data-testid="collaborators-button"
                type="button"
              >
                <Users className="h-4 w-4 text-gray-400" />
                <span className="flex-1 text-gray-500">Add collaborators</span>
              </button>
            </div>

            {/* Visibility */}
            <div>
              <Label className="mb-2 block text-gray-700 text-xs font-semibold uppercase">
                Visibility
              </Label>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Lock className="h-4 w-4" />
                Only me
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
