"use client";

import {
  BarChart3,
  Calendar,
  ChevronRight,
  Kanban,
  List,
  MoreHorizontal,
  Share2,
  Star,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type ProjectHeaderProps = {
  currentProjectId?: string;
  currentWorkspaceId?: string;
};

const viewOptions = [
  {
    id: "list",
    label: "List",
    icon: List,
    href: "/list",
    description: "Hierarchical task view with sorting and filtering",
  },
  {
    id: "board",
    label: "Board",
    icon: Kanban,
    href: "/board",
    description: "Kanban board with drag-and-drop functionality",
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: BarChart3,
    href: "/timeline",
    description: "Gantt chart view for project scheduling",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    href: "/calendar",
    description: "Calendar view for due dates and milestones",
  },
];

export function ProjectHeader({
  currentProjectId,
  currentWorkspaceId,
}: ProjectHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Fetch current project details
  const { data: project } = trpc.project.getById.useQuery(
    { id: currentProjectId || "" },
    { enabled: !!currentProjectId }
  );

  // Fetch workspace details
  const { data: workspace } = trpc.workspace.getById.useQuery(
    { id: currentWorkspaceId || "" },
    { enabled: !!currentWorkspaceId }
  );

  const getCurrentView = () => {
    if (!currentProjectId) {
      return null;
    }

    const projectPath = `/project/${currentProjectId}`;
    if (pathname === projectPath || pathname === `${projectPath}/list`) {
      return "list";
    }
    if (pathname === `${projectPath}/board`) {
      return "board";
    }
    if (pathname === `${projectPath}/timeline`) {
      return "timeline";
    }
    if (pathname === `${projectPath}/calendar`) {
      return "calendar";
    }
    return null;
  };

  const currentView = getCurrentView();

  const handleViewChange = (viewId: string) => {
    if (!currentProjectId) {
      return;
    }

    const viewOption = viewOptions.find((v) => v.id === viewId);
    if (viewOption) {
      router.push(`/project/${currentProjectId}${viewOption.href}`);
    }
  };

  // If we're not in a project context, show a simpler header
  if (!(currentProjectId && project)) {
    return (
      <header
        className="border-b bg-background px-6 py-4"
        data-testid="project-header"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>{workspace?.name || "Workspace"}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="border-b bg-background px-6 py-4"
      data-testid="project-header"
    >
      <div className="flex items-center justify-between">
        {/* Breadcrumb and Project Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>{workspace?.name || "Workspace"}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{project.name}</span>
          </div>
        </div>

        {/* Project Actions */}
        <div className="flex items-center gap-2">
          <Button data-testid="star-project" size="sm" variant="ghost">
            <Star className="h-4 w-4" />
          </Button>
          <Button data-testid="share-project" size="sm" variant="ghost">
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-testid="project-menu" size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Project Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* View Switcher */}
      <div className="mt-4 flex items-center gap-1">
        {viewOptions.map((view) => {
          const isActive = currentView === view.id;
          return (
            <Button
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-primary text-primary-foreground"
              )}
              data-testid={`view-${view.id}`}
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              size="sm"
              title={view.description}
              variant={isActive ? "default" : "ghost"}
            >
              <view.icon className="h-4 w-4" />
              <span>{view.label}</span>
            </Button>
          );
        })}
      </div>
    </header>
  );
}
