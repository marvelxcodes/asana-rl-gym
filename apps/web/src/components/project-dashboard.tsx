"use client";

import { useForm } from "@tanstack/react-form";
import {
  Calendar,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";

type ProjectDashboardProps = {
  workspaceId: string;
  onProjectSelect?: (projectId: string) => void;
};

export function ProjectDashboard({
  workspaceId,
  onProjectSelect,
}: ProjectDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  // Fetch projects for the workspace
  const { data: projects, isLoading } = trpc.project.getByWorkspace.useQuery(
    { workspaceId },
    { enabled: !!workspaceId }
  );

  // Create project mutation
  const createProjectMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success("Project created successfully");
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  // Update project mutation
  const updateProjectMutation = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully");
      setEditingProject(null);
      editForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  // Archive project mutation
  const archiveProjectMutation = trpc.project.archive.useMutation({
    onSuccess: () => {
      toast.success("Project archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive project");
    },
  });

  // Create form
  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      color: "#4A90E2",
    },
    onSubmit: ({ value }) => {
      createProjectMutation.mutate({
        ...value,
        workspaceId,
      });
    },
  });

  // Edit form
  const editForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      color: "#4A90E2",
    },
    onSubmit: ({ value }) => {
      if (editingProject) {
        updateProjectMutation.mutate({
          id: editingProject,
          ...value,
        });
      }
    },
  });

  // Set edit form values when editing project changes
  useEffect(() => {
    if (editingProject) {
      const project = projects?.find((p) => p.id === editingProject);
      if (project) {
        editForm.setFieldValue("name", project.name);
        editForm.setFieldValue("description", project.description || "");
        editForm.setFieldValue("color", project.color || "#4A90E2");
      }
    }
  }, [editingProject, projects, editForm]);

  const handleArchiveProject = (projectId: string) => {
    archiveProjectMutation.mutate({ id: projectId });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card className="animate-pulse" key={`skeleton-${i}`}>
            <CardHeader>
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
        <Button
          data-testid="create-project-button"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            data-testid={`project-card-${project.id}`}
            key={project.id}
            onClick={() => onProjectSelect?.(project.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color ?? "#6b7280" }}
                  />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-8 w-8"
                        data-testid={`project-menu-${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        data-testid={`edit-project-${project.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project.id);
                        }}
                      >
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        data-testid={`archive-project-${project.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveProject(project.id);
                        }}
                      >
                        Archive Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </div>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>0 tasks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>1 member</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-medium text-lg">No projects yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first project to get started with task management.
            </p>
            <Button
              data-testid="empty-state-create-project"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
        <DialogContent data-testid="create-project-dialog">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your tasks and collaborate with
              your team.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createForm.handleSubmit();
            }}
          >
            <div className="grid gap-4 py-4">
              <createForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value ? undefined : "Project name is required",
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="project-name">Name *</Label>
                    <Input
                      data-testid="project-name-input"
                      id="project-name"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter project name"
                      value={field.state.value}
                    />
                    {field.state.meta.errors && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </createForm.Field>
              <createForm.Field name="description">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Input
                      data-testid="project-description-input"
                      id="project-description"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter project description (optional)"
                      value={field.state.value}
                    />
                  </div>
                )}
              </createForm.Field>
              <createForm.Field name="color">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="project-color">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        className="h-9 w-12 rounded border border-input"
                        data-testid="project-color-input"
                        id="project-color"
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="color"
                        value={field.state.value}
                      />
                      <Input
                        className="flex-1"
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="#4A90E2"
                        value={field.state.value}
                      />
                    </div>
                  </div>
                )}
              </createForm.Field>
            </div>
            <DialogFooter>
              <Button
                data-testid="cancel-create-project"
                onClick={() => setIsCreateDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-create-project"
                disabled={createProjectMutation.isPending}
                type="submit"
              >
                {createProjectMutation.isPending
                  ? "Creating..."
                  : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        onOpenChange={() => setEditingProject(null)}
        open={!!editingProject}
      >
        <DialogContent data-testid="edit-project-dialog">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details and settings.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editForm.handleSubmit();
            }}
          >
            <div className="grid gap-4 py-4">
              <editForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value ? undefined : "Project name is required",
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project-name">Name *</Label>
                    <Input
                      data-testid="edit-project-name-input"
                      id="edit-project-name"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter project name"
                      value={field.state.value}
                    />
                    {field.state.meta.errors && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </editForm.Field>
              <editForm.Field name="description">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project-description">
                      Description
                    </Label>
                    <Input
                      data-testid="edit-project-description-input"
                      id="edit-project-description"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter project description (optional)"
                      value={field.state.value}
                    />
                  </div>
                )}
              </editForm.Field>
              <editForm.Field name="color">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project-color">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        className="h-9 w-12 rounded border border-input"
                        data-testid="edit-project-color-input"
                        id="edit-project-color"
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="color"
                        value={field.state.value}
                      />
                      <Input
                        className="flex-1"
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="#4A90E2"
                        value={field.state.value}
                      />
                    </div>
                  </div>
                )}
              </editForm.Field>
            </div>
            <DialogFooter>
              <Button
                data-testid="cancel-edit-project"
                onClick={() => setEditingProject(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-edit-project"
                disabled={updateProjectMutation.isPending}
                type="submit"
              >
                {updateProjectMutation.isPending
                  ? "Updating..."
                  : "Update Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
