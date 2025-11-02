"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectDashboard } from "@/components/project-dashboard";
import { ProjectLayout } from "@/components/project-layout";
import type { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type ProjectsPageClientProps = {
  session: typeof authClient.$Infer.Session;
};

export function ProjectsPageClient(_props: ProjectsPageClientProps) {
  const router = useRouter();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>();

  // Fetch user's workspaces
  const { data: workspaces } = trpc.workspace.list.useQuery();

  // Set default workspace when workspaces are loaded
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !currentWorkspaceId) {
      setCurrentWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
  };

  const handleProjectSelect = (projectId: string) => {
    router.push(`/project/${projectId}/list`);
  };

  return (
    <ProjectLayout
      currentWorkspaceId={currentWorkspaceId}
      onWorkspaceChange={handleWorkspaceChange}
    >
      {currentWorkspaceId ? (
        <ProjectDashboard
          onProjectSelect={handleProjectSelect}
          workspaceId={currentWorkspaceId}
        />
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      )}
    </ProjectLayout>
  );
}
