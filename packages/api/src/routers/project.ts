import { publicProcedure, router } from "../index";
import {
  createProjectSchema,
  projectIdSchema,
  projectsByWorkspaceSchema,
  updateProjectSchema,
} from "../schemas/project";

// Mock data imports
import {
  createMockProject,
  getMockProject,
  getMockProjectsByWorkspace,
} from "../lib/mock-data";

export const projectRouter = router({
  // Create a new project (mock)
  create: publicProcedure
    .input(createProjectSchema)
    .mutation(async ({ input }) => {
      return createMockProject(input);
    }),

  // Get all projects for the current user across all workspaces
  list: publicProcedure.query(async () => {
    // Return projects from default workspaces
    const workspace1Projects = getMockProjectsByWorkspace("workspace_1", 5);
    const workspace2Projects = getMockProjectsByWorkspace("workspace_2", 3);
    return [...workspace1Projects, ...workspace2Projects];
  }),

  // Get projects by workspace ID
  getByWorkspace: publicProcedure
    .input(projectsByWorkspaceSchema)
    .query(async ({ input }) => {
      return getMockProjectsByWorkspace(input.workspaceId, 8);
    }),

  // Get project by ID
  getById: publicProcedure
    .input(projectIdSchema)
    .query(async ({ input }) => {
      return getMockProject(input.id);
    }),

  // Update project (mock)
  update: publicProcedure
    .input(updateProjectSchema)
    .mutation(async ({ input }) => {
      const project = getMockProject(input.id);
      return {
        ...project,
        ...input,
        updatedAt: Date.now(),
      };
    }),

  // Delete project (mock)
  delete: publicProcedure
    .input(projectIdSchema)
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  // Archive project (mock)
  archive: publicProcedure
    .input(projectIdSchema)
    .mutation(async ({ input }) => {
      const project = getMockProject(input.id);
      return {
        ...project,
        archived: true,
        updatedAt: Date.now(),
      };
    }),

  // Restore archived project (mock)
  restore: publicProcedure
    .input(projectIdSchema)
    .mutation(async ({ input }) => {
      const project = getMockProject(input.id);
      return {
        ...project,
        archived: false,
        updatedAt: Date.now(),
      };
    }),
});
