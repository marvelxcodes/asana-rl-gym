"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/project-layout";
import type { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type ProjectDetailLayoutProps = {
  children: React.ReactNode;
  projectId: string;
  session: typeof authClient.$Infer.Session;
};

export function ProjectDetailLayout({
  children,
  projectId,
}: ProjectDetailLayoutProps) {
  const router = useRouter();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>();

  // Fetch project details to get workspace ID
  const {
    data: project,
    isLoading,
    error,
  } = trpc.project.getById.useQuery({ id: projectId });

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load project");
      router.push("/projects");
    }
  }, [error, router]);

  // Set workspace ID when project is loaded
  useEffect(() => {
    if (project?.workspaceId) {
      setCurrentWorkspaceId(project.workspaceId);
    }
  }, [project]);

  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    // Navigate to projects page when workspace changes
    router.push("/projects");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-destructive">Failed to load project</p>
          <button
            className="text-primary hover:underline"
            onClick={() => router.push("/projects")}
            type="button"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectLayout
      currentProjectId={projectId}
      currentWorkspaceId={currentWorkspaceId}
      onWorkspaceChange={handleWorkspaceChange}
    >
      {children}
    </ProjectLayout>
  );
}
