import { z } from "zod";
import { publicProcedure, router } from "../index";
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "../schemas/workspace";

// Mock data imports
import { getDefaultWorkspaces, getMockWorkspace } from "../lib/mock-data";

export const workspaceRouter = router({
  // Create a new workspace (mock - just returns success)
  create: publicProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ input }) => {
      // For RL training, just return a mock workspace
      const workspaceId = `workspace_${Date.now()}`;
      return {
        id: workspaceId,
        name: input.name,
        description: input.description || null,
        ownerId: "user_1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }),

  // Get all workspaces for the current user
  list: publicProcedure.query(async () => {
    // Return default mock workspaces
    return getDefaultWorkspaces();
  }),

  // Get workspace by ID
  getById: publicProcedure
    .input(workspaceIdSchema)
    .query(async ({ input }) => {
      // Return mock workspace
      return getMockWorkspace(input.id);
    }),

  // Update workspace (mock - returns updated workspace)
  update: publicProcedure
    .input(updateWorkspaceSchema)
    .mutation(async ({ input }) => {
      const workspace = getMockWorkspace(input.id);
      return {
        ...workspace,
        ...input,
        updatedAt: Date.now(),
      };
    }),

  // Delete workspace (mock - returns success)
  delete: publicProcedure
    .input(workspaceIdSchema)
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  // Add member to workspace (mock - returns success)
  addMember: publicProcedure
    .input(addWorkspaceMemberSchema)
    .mutation(async ({ input }) => {
      return {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
        joinedAt: Date.now(),
      };
    }),

  // Remove member from workspace (mock - returns success)
  removeMember: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async () => {
      return { success: true };
    }),

  // Get workspace members (mock - returns default users)
  getMembers: publicProcedure
    .input(workspaceIdSchema)
    .query(async () => {
      // Return mock members
      return [
        { userId: "user_1", role: "owner" as const, joinedAt: Date.now() },
        { userId: "user_2", role: "member" as const, joinedAt: Date.now() },
      ];
    }),
});
