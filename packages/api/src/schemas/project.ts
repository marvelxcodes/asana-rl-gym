import { z } from "zod";

// Project status enum
export const projectStatusSchema = z.enum(["active", "archived", "template"]);

// Base project schema matching database structure
export const projectSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().optional(),
  status: projectStatusSchema.default("active"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#4A90E2"),
  ownerId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Input schemas for API endpoints
export const createProjectSchema = z.object({
  workspaceId: z.string(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#4A90E2"),
});

export const updateProjectSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long")
    .optional(),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
});

export const projectIdSchema = z.object({
  id: z.string(),
});

export const projectsByWorkspaceSchema = z.object({
  workspaceId: z.string(),
});

// Output schemas
export const projectOutputSchema = projectSchema;

// Type exports
export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
