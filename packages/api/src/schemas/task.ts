import { z } from "zod";

// Task status and priority enums
export const taskStatusSchema = z.enum(["todo", "in_progress", "completed"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

// Base task schema matching database structure
export const taskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z
    .string()
    .min(1, "Task name is required")
    .max(200, "Task name too long"),
  description: z.string().optional(),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z.number().optional(),
  tags: z.string().optional(), // JSON string of tags array
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),
});

// Input schemas for API endpoints
export const createTaskSchema = z.object({
  projectId: z.string(),
  name: z
    .string()
    .min(1, "Task name is required")
    .max(200, "Task name too long"),
  description: z.string().optional(),
  priority: taskPrioritySchema.default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z.number().optional(),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]), // Array of task IDs this task depends on
});

export const updateTaskSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Task name is required")
    .max(200, "Task name too long")
    .optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().optional(),
  dueDate: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskStatusSchema = z.object({
  id: z.string(),
  status: taskStatusSchema,
});

export const taskIdSchema = z.object({
  id: z.string(),
});

export const tasksByProjectSchema = z.object({
  projectId: z.string(),
});

// Task dependency schemas
export const taskDependencySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  dependsOnTaskId: z.string(),
  createdAt: z.number(),
});

export const createTaskDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

export const removeTaskDependencySchema = z.object({
  taskId: z.string(),
  dependsOnTaskId: z.string(),
});

// Validation for dependency relationships
export const validateTaskDependenciesSchema = z
  .object({
    taskId: z.string(),
    dependencies: z.array(z.string()),
  })
  .refine((data) => !data.dependencies.includes(data.taskId), {
    message: "Task cannot depend on itself",
    path: ["dependencies"],
  });

// Task filtering and sorting schemas
export const taskFilterSchema = z.object({
  projectId: z.string(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().optional(),
  dueDateFrom: z.number().optional(),
  dueDateTo: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const taskSortSchema = z.object({
  field: z.enum([
    "name",
    "status",
    "priority",
    "dueDate",
    "createdAt",
    "updatedAt",
  ]),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

// Output schemas with computed fields
export const taskOutputSchema = taskSchema.extend({
  tags: z.array(z.string()).default([]), // Parse JSON string to array for output
  dependencies: z.array(z.string()).default([]), // Include dependency task IDs
  isOverdue: z.boolean().optional(), // Computed field
});

// Type exports
export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskDependency = z.infer<typeof taskDependencySchema>;
export type CreateTaskDependencyInput = z.infer<
  typeof createTaskDependencySchema
>;
export type TaskFilter = z.infer<typeof taskFilterSchema>;
export type TaskSort = z.infer<typeof taskSortSchema>;
export type TaskOutput = z.infer<typeof taskOutputSchema>;
