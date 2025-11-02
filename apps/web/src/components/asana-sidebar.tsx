"use client";

import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Goal,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquare,
  Plus,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AsanaNewProjectModal } from "@/components/asana-new-project-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AsanaSidebarProps = {
  currentWorkspaceId?: string;
  currentProjectId?: string;
  onNavigate?: (path: string) => void;
};

export function AsanaSidebar({
  currentWorkspaceId = "1132775624246007",
  currentProjectId = "demo-project",
  onNavigate,
}: AsanaSidebarProps) {
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: `/0/${currentWorkspaceId}/home` },
    { icon: LayoutGrid, label: "My tasks", href: `/0/${currentWorkspaceId}/project/${currentProjectId}/list/view-123` },
    { icon: Inbox, label: "Inbox", href: `/0/${currentWorkspaceId}/inbox/inbox-123` },
  ];

  const insightItems = [
    { icon: FolderKanban, label: "Reporting", href: `/0/reporting/${currentWorkspaceId}` },
    { icon: FolderKanban, label: "Portfolios", href: `/0/portfolios/${currentWorkspaceId}` },
    { icon: Target, label: "Goals", href: `/0/${currentWorkspaceId}/goals` },
  ];

  return (
    <aside
      className="flex h-full w-60 flex-col bg-[#2D333A]"
      data-testid="asana-sidebar"
    >
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2">
        <div className="space-y-1 py-2">
          {navItems.map((item) => (
            <Link
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white transition-all duration-200 hover:bg-white/10 active:bg-white/20"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              href={item.href}
              key={item.label}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Insights Section */}
        <div className="mt-4">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
            data-testid="insights-toggle"
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            type="button"
          >
            {insightsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span className="flex-1 text-left">Insights</span>
            <Plus className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {insightsExpanded && (
            <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {insightItems.map((item) => (
                <Link
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 pl-9 text-sm text-white transition-all duration-200 hover:bg-white/10 active:bg-white/20"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  href={item.href}
                  key={item.label}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div className="mt-4">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
            data-testid="projects-toggle"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            type="button"
          >
            {projectsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span className="flex-1 text-left">Projects</span>
            <Plus className="h-3 w-3" />
          </button>

          {projectsExpanded && (
            <div className="mt-1 space-y-1">
              <div className="px-3 py-4 text-center text-sm text-white/60">
                <p className="mb-2">Organize and plan your work with projects</p>
                <Button
                  className="h-8 text-sm"
                  data-testid="new-project-button"
                  onClick={() => setShowNewProjectModal(true)}
                  size="sm"
                  variant="outline"
                >
                  New project
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Upgrade Button */}
      <div className="border-t border-white/10 p-3">
        <Button
          className="h-9 w-full justify-center bg-[#F0A344] text-sm font-medium text-white hover:bg-[#E09334] active:bg-[#D08324]"
          data-testid="upgrade-button"
        >
          Upgrade
        </Button>
      </div>

      {/* New Project Modal */}
      <AsanaNewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </aside>
  );
}
