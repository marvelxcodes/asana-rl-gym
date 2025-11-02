import { db, project, task, taskDependency, workspaceMember } from "@asana/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import type {
  CreateTaskDependencyInput,
  CreateTaskInput,
  TaskFilter,
  TaskSort,
  TaskStatus,
  UpdateTaskInput,
} from "../schemas/task";

export class TaskService {
  // Create a new task
  static async create(input: CreateTaskInput, userId: string) {
    // Check if user has access to project
    const projectAccess = await TaskService.checkProjectAccess(
      input.projectId,
      userId
    );
    if (!projectAccess) {
      throw new Error(
        "Access denied: Not a member of this project's workspace"
      );
    }

    // Validate dependencies if provided
    if (input.dependencies.length > 0) {
      await TaskService.validateDependencies(
        input.projectId,
        input.dependencies
      );
    }

    const now = Date.now();
    const taskId = crypto.randomUUID();

    await db.insert(task).values({
      id: taskId,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      tags: JSON.stringify(input.tags),
      status: "todo",
      createdAt: now,
      updatedAt: now,
    });

    // Create task dependencies
    if (input.dependencies.length > 0) {
      await TaskService.createDependencies(taskId, input.dependencies);
    }

    const createdTask = await TaskService.getById(taskId, userId);

    // Broadcast task creation
    if (createdTask) {
      await RealtimeService.broadcastTaskCreated(
        input.projectId,
        createdTask,
        userId
      );
    }

    return createdTask;
  }

  // Get task by ID with access check
  static async getById(id: string, userId: string) {
    const result = await db
      .select({
        task,
        project,
      })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(and(eq(task.id, id), eq(workspaceMember.userId, userId)))
      .limit(1);

    if (!result[0]) return null;

    const taskData = result[0].task;
    const dependencies = await TaskService.getDependencies(id);

    return {
      ...taskData,
      tags: taskData.tags ? JSON.parse(taskData.tags) : [],
      dependencies: dependencies.map((d) => d.dependsOnTaskId),
      isOverdue: taskData.dueDate
        ? taskData.dueDate < Date.now() && taskData.status !== "completed"
        : false,
    };
  }

  // Get tasks by project with filtering and sorting
  static async getByProjectId(
    projectId: string,
    userId: string,
    filter?: TaskFilter,
    sort?: TaskSort
  ) {
    // Check if user has access to project
    const projectAccess = await TaskService.checkProjectAccess(
      projectId,
      userId
    );
    if (!projectAccess) {
      throw new Error(
        "Access denied: Not a member of this project's workspace"
      );
    }

    let query = db.select().from(task).where(eq(task.projectId, projectId));

    // Apply filters
    if (filter) {
      const conditions = [eq(task.projectId, projectId)];

      if (filter.status) {
        conditions.push(eq(task.status, filter.status));
      }
      if (filter.priority) {
        conditions.push(eq(task.priority, filter.priority));
      }
      if (filter.assigneeId) {
        conditions.push(eq(task.assigneeId, filter.assigneeId));
      }
      if (filter.dueDateFrom) {
        conditions.push(sql`${task.dueDate} >= ${filter.dueDateFrom}`);
      }
      if (filter.dueDateTo) {
        conditions.push(sql`${task.dueDate} <= ${filter.dueDateTo}`);
      }

      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sort) {
      const orderBy =
        sort.direction === "desc"
          ? sql`${task[sort.field]} DESC`
          : sql`${task[sort.field]} ASC`;
      query = query.orderBy(orderBy);
    }

    const tasks = await query;

    // Enhance tasks with dependencies and computed fields
    const enhancedTasks = await Promise.all(
      tasks.map(async (taskData) => {
        const dependencies = await TaskService.getDependencies(taskData.id);
        return {
          ...taskData,
          tags: taskData.tags ? JSON.parse(taskData.tags) : [],
          dependencies: dependencies.map((d) => d.dependsOnTaskId),
          isOverdue: taskData.dueDate
            ? taskData.dueDate < Date.now() && taskData.status !== "completed"
            : false,
        };
      })
    );

    return enhancedTasks;
  }

  // Update task
  static async update(input: UpdateTaskInput, userId: string) {
    const existingTask = await TaskService.getById(input.id, userId);
    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    const updateData: Partial<typeof task.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "completed") {
        updateData.completedAt = Date.now();
      } else if (
        existingTask.status === "completed" &&
        input.status !== "completed"
      ) {
        updateData.completedAt = null;
      }
    }
    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }
    if (input.assigneeId !== undefined) {
      updateData.assigneeId = input.assigneeId;
    }
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate;
    }
    if (input.tags !== undefined) {
      updateData.tags = JSON.stringify(input.tags);
    }

    const [updatedTask] = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, input.id))
      .returning();

    const result = await TaskService.getById(updatedTask.id, userId);

    // Broadcast task update
    if (result) {
      // Check if status changed for special broadcast
      if (input.status !== undefined && input.status !== existingTask.status) {
        await RealtimeService.broadcastTaskStatusChanged(
          existingTask.projectId,
          input.id,
          existingTask.status,
          input.status,
          result,
          userId
        );
      } else {
        await RealtimeService.broadcastTaskUpdate(
          existingTask.projectId,
          input.id,
          result,
          userId
        );
      }
    }

    return result;
  }

  // Update task status
  static async updateStatus(id: string, status: TaskStatus, userId: string) {
    return await TaskService.update({ id, status }, userId);
  }

  // Delete task
  static async delete(id: string, userId: string) {
    const existingTask = await TaskService.getById(id, userId);
    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    // Delete task dependencies first
    await db
      .delete(taskDependency)
      .where(
        sql`${taskDependency.taskId} = ${id} OR ${taskDependency.dependsOnTaskId} = ${id}`
      );

    // Delete task
    await db.delete(task).where(eq(task.id, id));

    // Broadcast task deletion
    await RealtimeService.broadcastTaskDeleted(
      existingTask.projectId,
      id,
      userId
    );

    return { success: true };
  }

  // Add task dependency
  static async addDependency(input: CreateTaskDependencyInput, userId: string) {
    // Check access to both tasks
    const [taskAccess, dependencyAccess] = await Promise.all([
      TaskService.getById(input.taskId, userId),
      TaskService.getById(input.dependsOnTaskId, userId),
    ]);

    if (!(taskAccess && dependencyAccess)) {
      throw new Error("Task not found or access denied");
    }

    // Check for circular dependencies
    const wouldCreateCycle = await TaskService.wouldCreateCycle(
      input.taskId,
      input.dependsOnTaskId
    );
    if (wouldCreateCycle) {
      throw new Error("Cannot create circular dependency");
    }

    // Check if dependency already exists
    const existingDependency = await db
      .select()
      .from(taskDependency)
      .where(
        and(
          eq(taskDependency.taskId, input.taskId),
          eq(taskDependency.dependsOnTaskId, input.dependsOnTaskId)
        )
      )
      .limit(1);

    if (existingDependency[0]) {
      throw new Error("Dependency already exists");
    }

    const [newDependency] = await db
      .insert(taskDependency)
      .values({
        id: crypto.randomUUID(),
        taskId: input.taskId,
        dependsOnTaskId: input.dependsOnTaskId,
        createdAt: Date.now(),
      })
      .returning();

    return newDependency;
  }

  // Remove task dependency
  static async removeDependency(
    taskId: string,
    dependsOnTaskId: string,
    userId: string
  ) {
    // Check access to task
    const taskAccess = await TaskService.getById(taskId, userId);
    if (!taskAccess) {
      throw new Error("Task not found or access denied");
    }

    await db
      .delete(taskDependency)
      .where(
        and(
          eq(taskDependency.taskId, taskId),
          eq(taskDependency.dependsOnTaskId, dependsOnTaskId)
        )
      );

    return { success: true };
  }

  // Helper methods
  private static async checkProjectAccess(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(project)
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(and(eq(project.id, projectId), eq(workspaceMember.userId, userId)))
      .limit(1);

    return !!result[0];
  }

  private static async getDependencies(taskId: string) {
    return await db
      .select()
      .from(taskDependency)
      .where(eq(taskDependency.taskId, taskId));
  }

  private static async createDependencies(
    taskId: string,
    dependencyIds: string[]
  ) {
    if (dependencyIds.length === 0) return;

    const dependencyValues = dependencyIds.map((depId) => ({
      id: crypto.randomUUID(),
      taskId,
      dependsOnTaskId: depId,
      createdAt: Date.now(),
    }));

    await db.insert(taskDependency).values(dependencyValues);
  }

  private static async validateDependencies(
    projectId: string,
    dependencyIds: string[]
  ) {
    // Check that all dependency tasks exist and are in the same project
    const dependencyTasks = await db
      .select()
      .from(task)
      .where(
        and(inArray(task.id, dependencyIds), eq(task.projectId, projectId))
      );

    if (dependencyTasks.length !== dependencyIds.length) {
      throw new Error("One or more dependency tasks not found in this project");
    }
  }

  private static async wouldCreateCycle(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<boolean> {
    // Simple cycle detection: check if dependsOnTaskId eventually depends on taskId
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      if (currentId === taskId) {
        return true; // Cycle detected
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Get all tasks that currentId depends on
      const dependencies = await db
        .select()
        .from(taskDependency)
        .where(eq(taskDependency.taskId, currentId));

      for (const dep of dependencies) {
        stack.push(dep.dependsOnTaskId);
      }
    }

    return false;
  }
}
