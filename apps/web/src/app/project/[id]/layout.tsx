import { auth } from "@asana/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectDetailLayout } from "./project-detail-layout";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <ProjectDetailLayout projectId={id} session={session}>
      {children}
    </ProjectDetailLayout>
  );
}
