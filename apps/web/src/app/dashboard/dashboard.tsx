"use client";
import type { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const privateData = trpc.privateData.useQuery();

  return (
    <>
      <p>API: {privateData.data?.message}</p>
    </>
  );
}
