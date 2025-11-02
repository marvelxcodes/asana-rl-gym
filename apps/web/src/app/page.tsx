"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Default workspace ID
const DEFAULT_WORKSPACE_ID = "1132775624246007";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Asana home page with default workspace
    router.push(`/0/${DEFAULT_WORKSPACE_ID}/home`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-2xl">Asana Clone</h1>
        <p className="text-gray-600">Redirecting to home...</p>
      </div>
    </div>
  );
}
