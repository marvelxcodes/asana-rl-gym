import { z } from "zod";
import { publicProcedure, router } from "../index";
import {
  createTaskDependencySchema,
  createTaskSchema,
  removeTaskDependencySchema,
  taskFilterSchema,
  taskIdSchema,
  taskSortSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../schemas/task";

// Mock data imports
import {
  createMockTask,
  deleteMockTask,
  getMockTask,
  getMockTasksByProject,
  updateMockTask,
} from "../lib/mock-data";

export const taskRouter = router({
  // Create a new task (mock)
  create: publicProcedure
    .input(createTaskSchema)
    .mutation(async ({ input }) => {
      return createMockTask(input);
    }),

  // Get task by ID
  getById: publicProcedure
    .input(taskIdSchema)
    .query(async ({ input }) => {
      return getMockTask(input.id);
    }),

  // Get tasks by project with optional filtering and sorting
  getByProject: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        filter: taskFilterSchema.optional(),
        sort: taskSortSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const tasks = getMockTasksByProject(input.projectId, input.filter);

      // Apply sorting if specified
      if (input.sort?.field) {
        tasks.sort((a, b) => {
          const field = input.sort!.field;
          const direction = input.sort!.direction === "asc" ? 1 : -1;

          if (field === "createdAt" || field === "updatedAt" || field === "dueDate") {
            const aVal = a[field] || 0;
            const bVal = b[field] || 0;
            return (aVal - bVal) * direction;
          }

          if (field === "title") {
            return a.title.localeCompare(b.title) * direction;
          }

          if (field === "priority") {
            const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction;
          }

          return 0;
        });
      }

      return tasks;
    }),

  // Update task (mock)
  update: publicProcedure
    .input(updateTaskSchema)
    .mutation(async ({ input }) => {
      return updateMockTask(input.id, input);
    }),

  // Update task status specifically (mock)
  updateStatus: publicProcedure
    .input(updateTaskStatusSchema)
    .mutation(async ({ input }) => {
      const updates: any = { status: input.status };

      // Set completedAt if status is completed
      if (input.status === "completed") {
        updates.completedAt = Date.now();
      } else {
        updates.completedAt = null;
      }

      return updateMockTask(input.id, updates);
    }),

  // Delete task (mock)
  delete: publicProcedure
    .input(taskIdSchema)
    .mutation(async ({ input }) => {
      deleteMockTask(input.id);
      return { success: true, id: input.id };
    }),

  // Add task dependency (mock - just returns success)
  addDependency: publicProcedure
    .input(createTaskDependencySchema)
    .mutation(async ({ input }) => {
      return {
        taskId: input.taskId,
        dependsOnTaskId: input.dependsOnTaskId,
        createdAt: Date.now(),
      };
    }),

  // Remove task dependency (mock - just returns success)
  removeDependency: publicProcedure
    .input(removeTaskDependencySchema)
    .mutation(async () => {
      return { success: true };
    }),

  // Get tasks with specific filters (for advanced querying)
  getFiltered: publicProcedure
    .input(
      taskFilterSchema.extend({
        sort: taskSortSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      const { sort, ...filter } = input;
      const tasks = getMockTasksByProject(input.projectId, filter);

      // Apply sorting
      if (sort?.field) {
        tasks.sort((a, b) => {
          const field = sort.field;
          const direction = sort.direction === "asc" ? 1 : -1;

          if (field === "createdAt" || field === "updatedAt" || field === "dueDate") {
            const aVal = a[field] || 0;
            const bVal = b[field] || 0;
            return (aVal - bVal) * direction;
          }

          if (field === "title") {
            return a.title.localeCompare(b.title) * direction;
          }

          if (field === "priority") {
            const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction;
          }

          return 0;
        });
      }

      return tasks;
    }),

  // Bulk update task statuses (useful for Kanban board operations)
  bulkUpdateStatus: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            status: z.enum(["todo", "in_progress", "completed"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return input.updates.map((update) => {
        const updates: any = { status: update.status };

        if (update.status === "completed") {
          updates.completedAt = Date.now();
        } else {
          updates.completedAt = null;
        }

        return updateMockTask(update.id, updates);
      });
    }),
});
