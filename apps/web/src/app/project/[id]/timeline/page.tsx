import { ViewContainer } from "@/components/view-container";

interface ProjectTimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectTimelinePage({
  params,
}: ProjectTimelinePageProps) {
  const { id } = await params;

  return <ViewContainer projectId={id} />;
}
