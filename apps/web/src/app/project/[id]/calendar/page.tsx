import { ViewContainer } from "@/components/view-container";

interface ProjectCalendarPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectCalendarPage({
  params,
}: ProjectCalendarPageProps) {
  const { id } = await params;

  return <ViewContainer projectId={id} />;
}
