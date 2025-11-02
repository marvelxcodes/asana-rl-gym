import { ViewContainer } from "@/components/view-container";

interface ProjectListPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectListPage({
  params,
}: ProjectListPageProps) {
  const { id } = await params;

  return <ViewContainer projectId={id} />;
}
