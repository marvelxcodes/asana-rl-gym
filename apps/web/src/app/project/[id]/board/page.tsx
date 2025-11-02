import { ViewContainer } from "@/components/view-container";

interface ProjectBoardPageProps {
	params: Promise<{ id: string }>;
}

export default async function ProjectBoardPage({ params }: ProjectBoardPageProps) {
	const { id } = await params;

	return <ViewContainer projectId={id} />;
}