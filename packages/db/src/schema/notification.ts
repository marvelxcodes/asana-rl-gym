import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { task } from "./task";

export const notification = sqliteTable("notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  taskId: text("task_id").references(() => task.id),
  type: text("type", {
    enum: [
      "task_assigned",
      "task_completed",
      "task_comment",
      "task_mentioned",
      "task_due_soon",
      "project_update",
    ],
  }).notNull(),
  actorId: text("actor_id").references(() => user.id),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  isBookmarked: integer("is_bookmarked", { mode: "boolean" })
    .notNull()
    .default(false),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});
