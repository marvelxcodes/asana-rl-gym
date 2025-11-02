import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { project } from "./project";

export const task = sqliteTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["todo", "in_progress", "completed"],
  })
    .notNull()
    .default("todo"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  })
    .notNull()
    .default("medium"),
  assigneeId: text("assignee_id").references(() => user.id),
  dueDate: integer("due_date"),
  tags: text("tags"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  completedAt: integer("completed_at"),
});

export const taskDependency = sqliteTable("task_dependency", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => task.id),
  dependsOnTaskId: text("depends_on_task_id")
    .notNull()
    .references(() => task.id),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});
