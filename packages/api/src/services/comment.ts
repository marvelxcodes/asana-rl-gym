import { comment, db, project, task, workspaceMember } from "@asana/db";
import { and, eq } from "drizzle-orm";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "../schemas/comment";
import { RealtimeService } from "./realtime";

export class CommentService {
  // Create a new comment
  static async create(input: CreateCommentInput, userId: string) {
    // Check if user has access to task
    const taskAccess = await CommentService.checkTaskAccess(
      input.taskId,
      userId
    );
    if (!taskAccess) {
      throw new Error(
        "Access denied: Not a member of this task's project workspace"
      );
    }

    const now = Date.now();
    const [newComment] = await db
      .insert(comment)
      .values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        userId,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Get project ID for broadcasting
    const taskInfo = await CommentService.getTaskInfo(input.taskId);
    if (taskInfo) {
      await RealtimeService.broadcastCommentCreated(
        taskInfo.projectId,
        input.taskId,
        newComment,
        userId
      );
    }

    return newComment;
  }

  // Get comment by ID with access check
  static async getById(id: string, userId: string) {
    const result = await db
      .select({
        comment,
      })
      .from(comment)
      .innerJoin(task, eq(comment.taskId, task.id))
      .innerJoin(project, eq(task.projectId, project.id))
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(and(eq(comment.id, id), eq(workspaceMember.userId, userId)))
      .limit(1);

    return result[0]?.comment || null;
  }

  // Get all comments for a task
  static async getByTaskId(taskId: string, userId: string) {
    // Check if user has access to task
    const taskAccess = await CommentService.checkTaskAccess(taskId, userId);
    if (!taskAccess) {
      throw new Error(
        "Access denied: Not a member of this task's project workspace"
      );
    }

    const comments = await db
      .select()
      .from(comment)
      .where(eq(comment.taskId, taskId))
      .orderBy(comment.createdAt);

    return comments;
  }

  // Update comment (only comment author can update)
  static async update(input: UpdateCommentInput, userId: string) {
    const existingComment = await CommentService.getById(input.id, userId);
    if (!existingComment) {
      throw new Error("Comment not found or access denied");
    }

    if (existingComment.userId !== userId) {
      throw new Error("Access denied: Can only edit your own comments");
    }

    const [updatedComment] = await db
      .update(comment)
      .set({
        content: input.content,
        updatedAt: Date.now(),
      })
      .where(eq(comment.id, input.id))
      .returning();

    // Get project ID for broadcasting
    const taskInfo = await CommentService.getTaskInfo(existingComment.taskId);
    if (taskInfo) {
      await RealtimeService.broadcastCommentUpdated(
        taskInfo.projectId,
        existingComment.taskId,
        updatedComment,
        userId
      );
    }

    return updatedComment;
  }

  // Delete comment (only comment author can delete)
  static async delete(id: string, userId: string) {
    const existingComment = await CommentService.getById(id, userId);
    if (!existingComment) {
      throw new Error("Comment not found or access denied");
    }

    if (existingComment.userId !== userId) {
      throw new Error("Access denied: Can only delete your own comments");
    }

    await db.delete(comment).where(eq(comment.id, id));

    // Get project ID for broadcasting
    const taskInfo = await CommentService.getTaskInfo(existingComment.taskId);
    if (taskInfo) {
      await RealtimeService.broadcastCommentDeleted(
        taskInfo.projectId,
        existingComment.taskId,
        id,
        userId
      );
    }

    return { success: true };
  }

  // Helper method to check task access
  private static async checkTaskAccess(
    taskId: string,
    userId: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(and(eq(task.id, taskId), eq(workspaceMember.userId, userId)))
      .limit(1);

    return !!result[0];
  }

  // Helper method to get task info including project ID
  private static async getTaskInfo(
    taskId: string
  ): Promise<{ projectId: string } | null> {
    const result = await db
      .select({
        projectId: task.projectId,
      })
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    return result[0] || null;
  }
}
