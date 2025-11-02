"use client";

import { useForm } from "@tanstack/react-form";
import { Building2, ChevronDown, Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";

interface WorkspaceSelectorProps {
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function WorkspaceSelector({
  currentWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Fetch workspaces
  const { data: workspaces, isLoading } = trpc.workspace.list.useQuery();

  // Create workspace mutation
  const createWorkspaceMutation = trpc.workspace.create.useMutation({
    onSuccess: (newWorkspace) => {
      toast.success("Workspace created successfully");
      setIsCreateDialogOpen(false);
      if (newWorkspace) {
        onWorkspaceChange?.(newWorkspace.id);
      }
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create workspace");
    },
  });

  // Form for creating workspace
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      createWorkspaceMutation.mutate(value);
    },
  });

  const currentWorkspace = workspaces?.find((w) => w.id === currentWorkspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="flex h-auto items-center justify-start gap-2 px-3 py-2"
            data-testid="workspace-selector-trigger"
            variant="ghost"
          >
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentWorkspace?.name || "Select Workspace"}
            </span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces?.map((item) => (
            <DropdownMenuItem
              className="flex flex-col items-start gap-1"
              data-testid={`workspace-option-${item.id}`}
              key={item.id}
              onClick={() => onWorkspaceChange?.(item.id)}
            >
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-muted-foreground text-xs">
                  {item.description}
                </div>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            data-testid="create-workspace-trigger"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
        <DialogContent data-testid="create-workspace-dialog">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your projects and collaborate
              with your team.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="grid gap-4 py-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value ? undefined : "Workspace name is required",
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="workspace-name">Name *</Label>
                    <Input
                      data-testid="workspace-name-input"
                      id="workspace-name"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter workspace name"
                      value={field.state.value}
                    />
                    {field.state.meta.errors && (
                      <p className="text-destructive text-sm">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor="workspace-description">Description</Label>
                    <Input
                      data-testid="workspace-description-input"
                      id="workspace-description"
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter workspace description (optional)"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <DialogFooter>
              <Button
                data-testid="cancel-create-workspace"
                onClick={() => setIsCreateDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-create-workspace"
                disabled={createWorkspaceMutation.isPending}
                type="submit"
              >
                {createWorkspaceMutation.isPending
                  ? "Creating..."
                  : "Create Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
