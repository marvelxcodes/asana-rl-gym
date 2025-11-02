import { z } from "zod";

// Base workspace schema matching database structure
export const workspaceSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name too long"),
  description: z.string().optional(),
  ownerId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Input schemas for API endpoints
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name too long"),
  description: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name too long")
    .optional(),
  description: z.string().optional(),
});

export const workspaceIdSchema = z.object({
  id: z.string(),
});

// Workspace member schemas
export const workspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
  createdAt: z.number(),
});

export const addWorkspaceMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "member"]).default("member"),
});

// Output schemas
export const workspaceOutputSchema = workspaceSchema;
export const workspaceMemberOutputSchema = workspaceMemberSchema;

// Type exports
export type Workspace = z.infer<typeof workspaceSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
