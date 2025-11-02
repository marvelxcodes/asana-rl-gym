"use client";

import { ChevronDown, ExternalLink, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AsanaCheckbox } from "@/components/asana-checkbox";
import { AsanaLayout } from "@/components/asana-layout";
import { AsanaQuickAddTask } from "@/components/asana-quick-add-task";
import { AsanaWidgetCard } from "@/components/asana-widget-card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

type PageParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

type TaskTab = "upcoming" | "overdue" | "completed";

export default function HomePage({ params }: PageParams) {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TaskTab>("upcoming");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCustomizationFooter, setShowCustomizationFooter] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setWorkspaceId(p.workspaceId);
    });
  }, [params]);

  // Get current date for header
  const currentDate = new Date();
  const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  // Get greeting based on time
  const hour = currentDate.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Fetch tasks (using demo-project as default)
  const { data: tasks = [] } = trpc.task.getByProject.useQuery({
    projectId: "demo-project",
  });

  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.getByProject.invalidate({ projectId: "demo-project" });
    },
  });

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed";
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "completed") {
      return task.status === "completed";
    }
    if (activeTab === "overdue") {
      // Check if task is overdue
      if (task.dueDate && task.status !== "completed") {
        return task.dueDate < Date.now();
      }
      return false;
    }
    // Upcoming: not completed and (no due date or due date in future)
    return task.status !== "completed";
  });

  const handleViewChange = () => {
    // No-op for home page
  };

  const handleNavigate = () => {
    // No-op for home page
  };

  const handleCustomize = () => {
    console.log("Customize clicked");
  };

  const handleShare = () => {
    console.log("Share clicked");
  };

  return (
    <AsanaLayout
      currentView="list"
      currentWorkspaceId={workspaceId}
      onCustomize={handleCustomize}
      onNavigate={handleNavigate}
      onShare={handleShare}
      onViewChange={handleViewChange}
      title="Home"
    >
      <div className="h-full overflow-auto bg-[#F6F7F8] p-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-500">
            {dayOfWeek}, {monthDay}
          </div>
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            {greeting}, User
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <button
              className="flex items-center gap-1 hover:text-gray-900"
              type="button"
            >
              My week <ChevronDown className="h-4 w-4" />
            </button>
            <span>•</span>
            <span>
              {tasks.filter((t) => t.status === "completed").length} tasks
              completed
            </span>
            <span>•</span>
            <span>0 collaborators</span>
            <button
              className="ml-auto text-blue-600 hover:underline"
              type="button"
            >
              Customize
            </button>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My Tasks Widget */}
          <AsanaWidgetCard
            headerActions={
              <button
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                type="button"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            }
            title="My tasks"
          >
            {/* Tabs */}
            <div className="mb-4 flex gap-4 border-b border-gray-200">
              <button
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "upcoming"
                    ? "border-b-2 border-blue-600 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("upcoming")}
                type="button"
              >
                Upcoming
              </button>
              <button
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "overdue"
                    ? "border-b-2 border-blue-600 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("overdue")}
                type="button"
              >
                Overdue
              </button>
              <button
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "completed"
                    ? "border-b-2 border-blue-600 text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("completed")}
                type="button"
              >
                Completed
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No tasks to show
                </div>
              ) : (
                filteredTasks.slice(0, 5).map((task) => (
                  <div
                    className="flex items-center gap-3 rounded py-1 hover:bg-gray-50"
                    key={task.id}
                  >
                    <AsanaCheckbox
                      checked={task.status === "completed"}
                      onCheckedChange={() =>
                        toggleTaskStatus(task.id, task.status ?? "todo")
                      }
                    />
                    <span
                      className={`text-sm ${
                        task.status === "completed"
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add Task Button */}
            <button
              className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setShowQuickAdd(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create task
            </button>

            {/* Show More Link */}
            {filteredTasks.length > 5 && (
              <button
                className="mt-4 text-sm text-blue-600 hover:underline"
                type="button"
              >
                Show more
              </button>
            )}
          </AsanaWidgetCard>

          {/* Projects Widget */}
          <AsanaWidgetCard title="Projects">
            <div className="mb-4">
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                type="button"
              >
                Recents <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Create Project Button */}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-12 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
              onClick={() => router.push(`/0/${workspaceId}/create-project`)}
              type="button"
            >
              <Plus className="h-5 w-5" />
              Create project
            </button>

            <div className="mt-4 text-center text-sm text-gray-500">
              No projects to show
            </div>
          </AsanaWidgetCard>
        </div>

        {/* Customization Footer */}
        {showCustomizationFooter && (
          <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                Drag and drop new widgets to customize your Home
              </div>
              <Button
                className="h-8 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
                type="button"
              >
                Customize
              </Button>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setShowCustomizationFooter(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 transition-opacity"
            onClick={() => setShowQuickAdd(false)}
          />
          <div className="fixed top-1/4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg bg-white shadow-2xl">
            <AsanaQuickAddTask
              autoFocus
              onCancel={() => setShowQuickAdd(false)}
              onSuccess={() => setShowQuickAdd(false)}
              projectId="demo-project"
            />
          </div>
        </>
      )}
    </AsanaLayout>
  );
}
