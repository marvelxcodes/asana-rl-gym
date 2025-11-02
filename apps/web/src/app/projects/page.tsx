import { auth } from "@asana/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsPageClient } from "./projects-client";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <ProjectsPageClient session={session} />;
}
