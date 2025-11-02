"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WorkspaceSelector } from "@/components/workspace-selector";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(
    undefined
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Top Navigation Bar - Asana Style */}
      <div className="border-b bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Asana Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FC636B]">
                <span className="font-bold text-white">A</span>
              </div>
              <span className="font-semibold text-lg">Asana</span>
            </div>

            {/* Workspace Selector */}
            <WorkspaceSelector
              currentWorkspaceId={currentWorkspaceId}
              onWorkspaceChange={setCurrentWorkspaceId}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="create-project-button"
              onClick={() => router.push("/projects")}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Asana Style */}
        <div className="w-64 border-r bg-gray-50">
          <nav className="p-4">
            {/* Personal Section */}
            <div className="space-y-1">
              <button
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                data-testid="nav-home"
                type="button"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
              <button
                className="flex w-full items-center gap-3 rounded bg-gray-200 px-3 py-2 text-left text-sm font-medium"
                data-testid="nav-my-tasks"
                type="button"
              >
                <span>✓</span>
                <span>My Tasks</span>
              </button>
              <button
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                data-testid="nav-inbox"
                type="button"
              >
                <span>📥</span>
                <span>Inbox</span>
              </button>
            </div>

            {/* Starred Section */}
            <div className="mt-6">
              <div className="mb-2 px-3 font-semibold text-gray-600 text-xs uppercase">
                Starred
              </div>
              <div className="space-y-1">
                <button
                  className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                  data-testid="nav-starred-item"
                  type="button"
                >
                  <span>⭐</span>
                  <span>Important Projects</span>
                </button>
              </div>
            </div>

            {/* Projects Section */}
            <div className="mt-6">
              <div className="mb-2 px-3 font-semibold text-gray-600 text-xs uppercase">
                Projects
              </div>
              <button
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                data-testid="nav-view-all-projects"
                onClick={() => router.push("/projects")}
                type="button"
              >
                <span>📁</span>
                <span>View all projects</span>
              </button>
            </div>

            {/* Teams Section */}
            <div className="mt-6">
              <div className="mb-2 px-3 font-semibold text-gray-600 text-xs uppercase">
                Teams
              </div>
              <button
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                data-testid="nav-teams"
                type="button"
              >
                <span>👥</span>
                <span>My Team</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-8">
            <h1 className="mb-6 font-semibold text-3xl">
              Good afternoon!
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Quick Action Cards */}
              <div
                className="cursor-pointer rounded-lg border p-6 transition-shadow hover:shadow-lg"
                data-testid="quick-action-projects"
                onClick={() => router.push("/projects")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push("/projects");
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="mb-2 text-2xl">📁</div>
                <h3 className="mb-1 font-semibold">View Projects</h3>
                <p className="text-gray-600 text-sm">
                  Browse and manage all your projects
                </p>
              </div>

              <div
                className="cursor-pointer rounded-lg border p-6 transition-shadow hover:shadow-lg"
                data-testid="quick-action-tasks"
                role="button"
                tabIndex={0}
              >
                <div className="mb-2 text-2xl">✓</div>
                <h3 className="mb-1 font-semibold">My Tasks</h3>
                <p className="text-gray-600 text-sm">
                  View all tasks assigned to you
                </p>
              </div>

              <div
                className="cursor-pointer rounded-lg border p-6 transition-shadow hover:shadow-lg"
                data-testid="quick-action-create"
                role="button"
                tabIndex={0}
              >
                <div className="mb-2 text-2xl">➕</div>
                <h3 className="mb-1 font-semibold">Create Task</h3>
                <p className="text-gray-600 text-sm">
                  Quickly create a new task
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Recent Activity
              </h2>
              <div className="rounded-lg border p-6 text-center text-gray-500">
                <p>No recent activity</p>
                <p className="mt-1 text-sm">
                  Start creating projects and tasks to see activity here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
