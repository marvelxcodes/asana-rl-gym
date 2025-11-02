import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, notification } from "@asana/db";
import { publicProcedure, router } from "../index";

export const notificationRouter = router({
  getByWorkspace: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        filter: z.enum(["all", "bookmarked", "archived"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId, userId, filter } = input;

      const conditions = [
        eq(notification.workspaceId, workspaceId),
        eq(notification.userId, userId),
      ];

      if (filter === "bookmarked") {
        conditions.push(eq(notification.isBookmarked, true));
      } else if (filter === "archived") {
        conditions.push(eq(notification.isArchived, true));
      } else {
        // Default: show non-archived
        conditions.push(eq(notification.isArchived, false));
      }

      const notifications = await db
        .select()
        .from(notification)
        .where(and(...conditions))
        .orderBy(desc(notification.createdAt));

      return notifications;
    }),

  toggleBookmark: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const notif = await db
        .select()
        .from(notification)
        .where(eq(notification.id, input.id))
        .get();

      if (!notif) {
        throw new Error("Notification not found");
      }

      await db
        .update(notification)
        .set({ isBookmarked: !notif.isBookmarked })
        .where(eq(notification.id, input.id));

      return { success: true };
    }),

  archive: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(notification)
        .set({ isArchived: true })
        .where(eq(notification.id, input.id));

      return { success: true };
    }),

  archiveAll: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(notification)
        .set({ isArchived: true })
        .where(
          and(
            eq(notification.workspaceId, input.workspaceId),
            eq(notification.userId, input.userId),
            eq(notification.isArchived, false)
          )
        );

      return { success: true };
    }),

  markAsRead: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(notification)
        .set({ isRead: true })
        .where(eq(notification.id, input.id));

      return { success: true };
    }),
});
