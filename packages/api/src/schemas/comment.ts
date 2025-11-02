import { z } from "zod";

// Base comment schema matching database structure
export const commentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment too long"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Input schemas for API endpoints
export const createCommentSchema = z.object({
  taskId: z.string(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment too long"),
});

export const updateCommentSchema = z.object({
  id: z.string(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(1000, "Comment too long"),
});

export const commentIdSchema = z.object({
  id: z.string(),
});

export const commentsByTaskSchema = z.object({
  taskId: z.string(),
});

// Output schemas
export const commentOutputSchema = commentSchema;

// Type exports
export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
