import { db, workspace, workspaceMember } from "@asana/db";
import { and, eq } from "drizzle-orm";
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "../schemas/workspace";

export class WorkspaceService {
  // Create a new workspace
  static async create(input: CreateWorkspaceInput, ownerId: string) {
    const now = Date.now();
    const workspaceId = crypto.randomUUID();

    const [newWorkspace] = await db
      .insert(workspace)
      .values({
        id: workspaceId,
        name: input.name,
        description: input.description,
        ownerId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Add owner as workspace member
    await db.insert(workspaceMember).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: ownerId,
      role: "owner",
      createdAt: now,
    });

    return newWorkspace;
  }

  // Get workspace by ID with ownership check
  static async getById(id: string, userId: string) {
    const result = await db
      .select()
      .from(workspace)
      .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
      .where(and(eq(workspace.id, id), eq(workspaceMember.userId, userId)))
      .limit(1);

    return result[0]?.workspace || null;
  }

  // Get all workspaces for a user
  static async getByUserId(userId: string) {
    const result = await db
      .select({
        workspace,
        role: workspaceMember.role,
      })
      .from(workspace)
      .innerJoin(workspaceMember, eq(workspace.id, workspaceMember.workspaceId))
      .where(eq(workspaceMember.userId, userId));

    return result;
  }

  // Update workspace (only owner can update)
  static async update(input: UpdateWorkspaceInput, userId: string) {
    const existingWorkspace = await WorkspaceService.getById(input.id, userId);
    if (!existingWorkspace || existingWorkspace.ownerId !== userId) {
      throw new Error("Workspace not found or access denied");
    }

    const updateData: Partial<typeof workspace.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    const [updatedWorkspace] = await db
      .update(workspace)
      .set(updateData)
      .where(eq(workspace.id, input.id))
      .returning();

    return updatedWorkspace;
  }

  // Delete workspace (only owner can delete)
  static async delete(id: string, userId: string) {
    const existingWorkspace = await WorkspaceService.getById(id, userId);
    if (!existingWorkspace || existingWorkspace.ownerId !== userId) {
      throw new Error("Workspace not found or access denied");
    }

    // Delete workspace members first
    await db.delete(workspaceMember).where(eq(workspaceMember.workspaceId, id));

    // Delete workspace
    await db.delete(workspace).where(eq(workspace.id, id));

    return { success: true };
  }

  // Add member to workspace
  static async addMember(input: AddWorkspaceMemberInput, userId: string) {
    // Check if user is owner or admin of workspace
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

    if (
      !(
        userMembership[0] && ["owner", "admin"].includes(userMembership[0].role)
      )
    ) {
      throw new Error("Access denied: Only owners and admins can add members");
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, input.workspaceId),
          eq(workspaceMember.userId, input.userId)
        )
      )
      .limit(1);

    if (existingMember[0]) {
      throw new Error("User is already a member of this workspace");
    }

    const [newMember] = await db
      .insert(workspaceMember)
      .values({
        id: crypto.randomUUID(),
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
        createdAt: Date.now(),
      })
      .returning();

    return newMember;
  }

  // Remove member from workspace
  static async removeMember(
    workspaceId: string,
    memberUserId: string,
    userId: string
  ) {
    // Check if user is owner or admin of workspace
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

    if (
      !(
        userMembership[0] && ["owner", "admin"].includes(userMembership[0].role)
      )
    ) {
      throw new Error(
        "Access denied: Only owners and admins can remove members"
      );
    }

    // Cannot remove workspace owner
    const memberToRemove = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, memberUserId)
        )
      )
      .limit(1);

    if (memberToRemove[0]?.role === "owner") {
      throw new Error("Cannot remove workspace owner");
    }

    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, memberUserId)
        )
      );

    return { success: true };
  }

  // Get workspace members
  static async getMembers(workspaceId: string, userId: string) {
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

    const members = await db
      .select()
      .from(workspaceMember)
      .where(eq(workspaceMember.workspaceId, workspaceId));

    return members;
  }
}
