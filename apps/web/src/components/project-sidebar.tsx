"use client";

import {
  BarChart3,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Home,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkspaceSelector } from "./workspace-selector";

type ProjectSidebarProps = {
  currentWorkspaceId?: string;
  currentProjectId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and recent activity",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderOpen,
    description: "All projects in workspace",
  },
  {
    title: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
    description: "Tasks assigned to you",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Due dates and milestones",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Progress and analytics",
  },
];

const projectViews = [
  {
    title: "List",
    href: "/list",
    description: "Hierarchical task view",
  },
  {
    title: "Board",
    href: "/board",
    description: "Kanban board view",
  },
  {
    title: "Timeline",
    href: "/timeline",
    description: "Gantt chart view",
  },
  {
    title: "Calendar",
    href: "/calendar",
    description: "Calendar view",
  },
];

export function ProjectSidebar({
  currentWorkspaceId,
  currentProjectId,
  onWorkspaceChange,
  collapsed = false,
  onToggleCollapse,
}: ProjectSidebarProps) {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const getProjectViewHref = (viewHref: string) => {
    if (currentProjectId) {
      return `/project/${currentProjectId}${viewHref}`;
    }
    return viewHref;
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      data-testid="project-sidebar"
    >
      {/* Header with workspace selector */}
      <div className="border-b p-4">
        {!collapsed && (
          <WorkspaceSelector
            currentWorkspaceId={currentWorkspaceId}
            onWorkspaceChange={onWorkspaceChange}
          />
        )}
        {collapsed && (
          <div className="flex justify-center">
            <WorkspaceSelector
              currentWorkspaceId={currentWorkspaceId}
              onWorkspaceChange={onWorkspaceChange}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isActiveLink(item.href);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent font-medium text-accent-foreground",
                  collapsed && "justify-center"
                )}
                data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                href={item.href as any}
                key={item.href}
                title={collapsed ? item.description : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Project Views Section */}
        {currentProjectId && !collapsed && (
          <div className="mt-6">
            <div className="px-3 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Project Views
            </div>
            <div className="space-y-1">
              {projectViews.map((view) => {
                const href = getProjectViewHref(view.href);
                const isActive = pathname === href;
                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent font-medium text-accent-foreground"
                    )}
                    data-testid={`project-view-${view.title.toLowerCase()}`}
                    href={href as any}
                    key={view.href}
                  >
                    <span className="truncate">{view.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer with settings and collapse toggle */}
      <div className="border-t p-2">
        <Link
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/settings") &&
              "bg-accent font-medium text-accent-foreground",
            collapsed && "justify-center"
          )}
          data-testid="nav-settings"
          href={"/settings" as any}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>

        {onToggleCollapse && (
          <Button
            className={cn(
              "mt-2 flex w-full items-center gap-2",
              collapsed && "justify-center"
            )}
            data-testid="sidebar-toggle"
            onClick={onToggleCollapse}
            size="sm"
            variant="ghost"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
