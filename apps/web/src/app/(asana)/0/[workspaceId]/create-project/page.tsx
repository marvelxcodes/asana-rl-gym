"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AsanaWorkflowGallery } from "@/components/asana-workflow-gallery";

type PageParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default function CreateProjectPage({ params }: PageParams) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setWorkspaceId(p.workspaceId);
    });
  }, [params]);

  const handleClose = () => {
    // Navigate back to home
    router.push(`/0/${workspaceId}/home`);
  };

  if (!workspaceId) {
    return null;
  }

  return <AsanaWorkflowGallery workspaceId={workspaceId} onClose={handleClose} />;
}
