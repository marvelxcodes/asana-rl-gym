import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Define the notification schema locally for the seed script
const notification = sqliteTable("notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  taskId: text("task_id"),
  type: text("type").notNull(),
  actorId: text("actor_id"),
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

const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
});

const db = drizzle({ client });

const sampleNotifications = [
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "task_completed" as const,
    message: "completed this task",
    createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  },
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "task_assigned" as const,
    message: "assigned this task to you",
    createdAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
  },
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "task_comment" as const,
    message: "commented: This looks great! Just a few minor suggestions...",
    createdAt: Date.now() - 24 * 60 * 60 * 1000 - 15 * 60 * 60 * 1000, // Yesterday at 3:45 PM (approx)
  },
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "task_mentioned" as const,
    message: "mentioned you in a comment",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "task_due_soon" as const,
    message: "Task is due in 2 days",
    createdAt: Date.now() - 30 * 60 * 1000, // 30 minutes ago
  },
  {
    workspaceId: "1132775624246007",
    userId: "current-user",
    type: "project_update" as const,
    message: "updated project status",
    createdAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
  },
];

async function seedNotifications() {
  console.log("Seeding notifications...");

  // Clear existing notifications
  await db.delete(notification);

  // Insert sample notifications
  for (const notif of sampleNotifications) {
    await db.insert(notification).values(notif);
  }

  console.log(`✅ Seeded ${sampleNotifications.length} notifications`);
  process.exit(0);
}

seedNotifications().catch((error) => {
  console.error("Error seeding notifications:", error);
  process.exit(1);
});
