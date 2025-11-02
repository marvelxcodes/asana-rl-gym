"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

type TaskCommentsProps = {
  taskId: string;
};

const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const HOURS_IN_WEEK = 168;

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments for the task
  const { data: comments = [], isLoading } = trpc.comment.getByTask.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  const utils = trpc.useUtils();

  // Create comment mutation
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      // Invalidate and refetch comments
      utils.comment.getByTask.invalidate({ taskId });
    },
    onError: (error) => {
      // Handle error appropriately in production
      console.error("Failed to create comment:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createComment.mutateAsync({
        taskId,
        content: newComment.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      (now.getTime() - date.getTime()) /
      (1000 * MINUTES_IN_HOUR * MINUTES_IN_HOUR);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * MINUTES_IN_HOUR);
      if (diffInMinutes <= 1) {
        return "Just now";
      }
      return `${diffInMinutes} minutes ago`;
    }

    if (diffInHours < HOURS_IN_DAY) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (diffInHours < HOURS_IN_WEEK) {
      const days = Math.floor(diffInHours / HOURS_IN_DAY);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4" data-testid="task-comments">
      {/* Comments Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div
        className="max-h-96 space-y-3 overflow-y-auto"
        data-testid="comments-list"
      >
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-sm">No comments yet</p>
            <p className="mt-1 text-xs">Be the first to add a comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card
              className="bg-gray-50"
              data-testid={`comment-${comment.id}`}
              key={comment.id}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Comment Header */}
                  <div className="flex items-center justify-between text-gray-500 text-xs">
                    <span
                      className="font-medium text-gray-700"
                      data-testid={`comment-author-${comment.id}`}
                    >
                      {comment.userId}
                    </span>
                    <span data-testid={`comment-date-${comment.id}`}>
                      {formatDate(
                        typeof comment.createdAt === "string"
                          ? Number.parseInt(comment.createdAt)
                          : comment.createdAt
                      )}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <p
                    className="whitespace-pre-wrap text-gray-800 text-sm"
                    data-testid={`comment-content-${comment.id}`}
                  >
                    {comment.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            className="resize-vertical w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="new-comment-input"
            disabled={isSubmitting}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            value={newComment}
          />
        </div>

        <div className="flex justify-end">
          <Button
            data-testid="submit-comment-button"
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            type="submit"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
