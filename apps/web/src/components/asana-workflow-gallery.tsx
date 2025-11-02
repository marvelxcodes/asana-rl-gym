"use client";

import { Download, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type WorkflowCategory = "for-you" | "my-organization" | "marketing" | "operations" | "productivity";

type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  viewType: "list" | "board" | "calendar" | "timeline";
  imageUrl?: string;
};

const projectTemplates: ProjectTemplate[] = [
  {
    id: "content-calendar",
    name: "Content calendar",
    description: "Plan content, organize assets, and view schedules by channel to keep your marketing teams organized.",
    category: "Marketing",
    viewType: "calendar",
  },
  {
    id: "project-timeline",
    name: "Project timeline",
    description: "Map out dependencies, milestones, and deadlines to keep your projects on track.",
    category: "Operations & PMO",
    viewType: "timeline",
  },
  {
    id: "bug-tracking",
    name: "Bug tracking",
    description: "File, assign, and prioritize bugs in one place to fix issues faster.",
    category: "IT",
    viewType: "board",
  },
  {
    id: "cross-functional-plan",
    name: "Cross-functional project plan",
    description: "Create tasks, add due dates, and organize work by stage to align teams across your organization.",
    category: "All teams",
    viewType: "list",
  },
  {
    id: "1-on-1-meeting",
    name: "1:1 Meeting agenda",
    description: "Track agenda items, meeting notes, and next steps so you can keep your conversations focused and meaningful.",
    category: "All teams",
    viewType: "list",
  },
  {
    id: "meeting-agenda",
    name: "Meeting agenda",
    description: "Capture agenda items, next steps, and action items to keep meetings focused and productive.",
    category: "All teams",
    viewType: "list",
  },
];

type AsanaWorkflowGalleryProps = {
  workspaceId: string;
  onClose: () => void;
};

export function AsanaWorkflowGallery({ workspaceId, onClose }: AsanaWorkflowGalleryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkflowCategory>("for-you");

  const handleCreateBlankProject = () => {
    // Navigate to create a blank project
    router.push(`/0/${workspaceId}/project/new-project/list/view-new`);
  };

  const handleSelectTemplate = (template: ProjectTemplate) => {
    // Create project from template
    console.log("Creating project from template:", template.name);
    router.push(`/0/${workspaceId}/project/new-project-${template.id}/${template.viewType}/view-new`);
  };

  const tabs = [
    { id: "for-you" as WorkflowCategory, label: "For you" },
    { id: "my-organization" as WorkflowCategory, label: "My organization" },
    { id: "marketing" as WorkflowCategory, label: "Marketing" },
    { id: "operations" as WorkflowCategory, label: "Operations & PMO" },
    { id: "productivity" as WorkflowCategory, label: "Productivity" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Workflow gallery</h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            New
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://form.asana.com/?k=kyI9mgJ21ZzvaHnDjt0lbA&d=15793206719"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Send feedback
          </a>

          <Button
            className="h-9 gap-2 bg-white text-sm text-gray-700 hover:bg-gray-50"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Import
          </Button>

          <Button
            className="h-9 gap-2 bg-blue-600 text-sm text-white hover:bg-blue-700"
            onClick={handleCreateBlankProject}
          >
            <span className="text-base">+</span>
            Blank project
          </Button>

          <button
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <button
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
          <button
            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
            type="button"
          >
            More ▼
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Start working in seconds
            </h3>
            <p className="text-gray-600 text-sm">
              Power your everyday processes with Asana's most popular workflows
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectTemplates.map((template) => (
              <button
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-shadow hover:shadow-lg"
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                type="button"
              >
                {/* Template Preview Image */}
                <div className="relative h-40 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-2 text-4xl">
                        {template.viewType === "calendar" && "📅"}
                        {template.viewType === "timeline" && "📊"}
                        {template.viewType === "board" && "📋"}
                        {template.viewType === "list" && "📝"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.viewType} view
                      </div>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-blue-600 opacity-0 transition-opacity group-hover:opacity-10" />
                </div>

                {/* Template Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="mb-2 font-semibold text-gray-900">
                    {template.name}
                  </h4>
                  <p className="mb-3 flex-1 text-gray-600 text-sm">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-100">
                        <span className="text-xs">★</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        Great for {template.category.toLowerCase()}
                      </span>
                    </div>

                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F06A6A]">
                      <span className="text-[10px] text-white">a</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
