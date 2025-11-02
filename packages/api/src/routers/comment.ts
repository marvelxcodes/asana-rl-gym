import { publicProcedure, router } from "../index";
import {
  commentIdSchema,
  commentsByTaskSchema,
  createCommentSchema,
  updateCommentSchema,
} from "../schemas/comment";

// Mock data imports
import { getMockCommentsByTask } from "../lib/mock-data";

export const commentRouter = router({
  // Create a new comment (mock)
  create: publicProcedure
    .input(createCommentSchema)
    .mutation(async ({ input }) => {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: commentId,
        taskId: input.taskId,
        userId: "user_1", // Default user
        content: input.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }),

  // Get comment by ID (mock - returns single comment)
  getById: publicProcedure
    .input(commentIdSchema)
    .query(async ({ input }) => {
      // Extract taskId from comment ID if possible, otherwise use a default
      const taskId = input.id.includes("comment_task_")
        ? input.id.split("_")[2]
        : "task_default_1";

      const comments = getMockCommentsByTask(taskId, 1);
      return comments[0] || {
        id: input.id,
        taskId,
        userId: "user_1",
        content: "Mock comment content",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }),

  // Get all comments for a task
  getByTask: publicProcedure
    .input(commentsByTaskSchema)
    .query(async ({ input }) => {
      return getMockCommentsByTask(input.taskId, 5);
    }),

  // Update comment (mock)
  update: publicProcedure
    .input(updateCommentSchema)
    .mutation(async ({ input }) => {
      return {
        id: input.id,
        content: input.content,
        updatedAt: Date.now(),
      };
    }),

  // Delete comment (mock)
  delete: publicProcedure
    .input(commentIdSchema)
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),
});
