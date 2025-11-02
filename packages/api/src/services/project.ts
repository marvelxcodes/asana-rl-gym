import { db, project, workspaceMember } from "@asana/db";
import { and, eq } from "drizzle-orm";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project";

export class ProjectService {
  // Create a new project
  static async create(input: CreateProjectInput, userId: string) {
    // Check if user has access to workspace
    const userMembership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, input.workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .limit(1);

    if (!userMembership[0]) {
      throw new Error("Access denied: Not a member of this workspace");
    }

    const now = Date.now();
    const [newProject] = await db
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description,
        color: input.color,
        status: "active",
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return newProject;
  }

  // Get project by ID with access check
  static async getById(id: string, userId: string) {
    const result = await db
      .select({
        project,
      })
      .from(project)
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(and(eq(project.id, id), eq(workspaceMember.userId, userId)))
      .limit(1);

    return result[0]?.project || null;
  }

  // Get all projects in a workspace for a user
  static async getByWorkspaceId(workspaceId: string, userId: string) {
    // Check if user has access to workspace
    const userMembership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .limit(1);

    if (!userMembership[0]) {
      throw new Error("Access denied: Not a member of this workspace");
    }

    const projects = await db
      .select()
      .from(project)
      .where(eq(project.workspaceId, workspaceId));

    return projects;
  }

  // Get all projects for a user across all workspaces
  static async getByUserId(userId: string) {
    const result = await db
      .select({
        project,
      })
      .from(project)
      .innerJoin(
        workspaceMember,
        eq(project.workspaceId, workspaceMember.workspaceId)
      )
      .where(eq(workspaceMember.userId, userId));

    return result.map((r) => r.project);
  }

  // Update project
  static async update(input: UpdateProjectInput, userId: string) {
    const existingProject = await ProjectService.getById(input.id, userId);
    if (!existingProject) {
      throw new Error("Project not found or access denied");
    }

    // Check if user can edit (owner or workspace admin/owner)
    const userMembership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, existingProject.workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .limit(1);

    const canEdit =
      existingProject.ownerId === userId ||
      (userMembership[0] &&
        ["owner", "admin"].includes(userMembership[0].role));

    if (!canEdit) {
      throw new Error("Access denied: Cannot edit this project");
    }

    const updateData: Partial<typeof project.$inferInsert> = {
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
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    const [updatedProject] = await db
      .update(project)
      .set(updateData)
      .where(eq(project.id, input.id))
      .returning();

    return updatedProject;
  }

  // Delete project
  static async delete(id: string, userId: string) {
    const existingProject = await ProjectService.getById(id, userId);
    if (!existingProject) {
      throw new Error("Project not found or access denied");
    }

    // Check if user can delete (owner or workspace admin/owner)
    const userMembership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, existingProject.workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .limit(1);

    const canDelete =
      existingProject.ownerId === userId ||
      (userMembership[0] &&
        ["owner", "admin"].includes(userMembership[0].role));

    if (!canDelete) {
      throw new Error("Access denied: Cannot delete this project");
    }

    await db.delete(project).where(eq(project.id, id));

    return { success: true };
  }

  // Archive project (soft delete)
  static async archive(id: string, userId: string) {
    const updateResult = await ProjectService.update(
      { id, status: "archived" },
      userId
    );
    return updateResult;
  }

  // Restore archived project
  static async restore(id: string, userId: string) {
    const updateResult = await ProjectService.update(
      { id, status: "active" },
      userId
    );
    return updateResult;
  }
}
