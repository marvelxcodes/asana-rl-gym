"use client";

import { Download, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type AsanaNewProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TabType = "forYou" | "myOrg" | "marketing" | "ops" | "productivity";

export function AsanaNewProjectModal({
  isOpen,
  onClose,
}: AsanaNewProjectModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("forYou");

  if (!isOpen) return null;

  const tabs = [
    { id: "forYou" as const, label: "For you" },
    { id: "myOrg" as const, label: "My organization" },
    { id: "marketing" as const, label: "Marketing" },
    { id: "ops" as const, label: "Operations & PMO" },
    { id: "productivity" as const, label: "Productivity" },
  ];

  const templates = [
    {
      id: 1,
      title: "Content calendar",
      description: "Plan content, organize assets, and view schedules by channel to keep your marketing teams organized.",
      tag: "Great for marketing",
      color: "bg-pink-50",
    },
    {
      id: 2,
      title: "Project timeline",
      description: "Map out dependencies, milestones, and deadlines to keep your projects on track.",
      tag: "Great for ops & PMO",
      color: "bg-gray-50",
    },
    {
      id: 3,
      title: "Bug tracking",
      description: "File, assign, and prioritize bugs in one place to fix issues faster.",
      tag: "Great for IT",
      color: "bg-green-50",
    },
    {
      id: 4,
      title: "Cross-functional project plan",
      description: "Create tasks, add due dates, and organize work by stage to align teams across your organization.",
      tag: "Great for all teams",
      color: "bg-purple-50",
    },
    {
      id: 5,
      title: "1:1 Meeting agenda",
      description: "Track agenda items, meeting notes, and next steps so you can keep your conversations focused and meaningful.",
      tag: "Great for all teams",
      color: "bg-pink-50",
    },
    {
      id: 6,
      title: "Meeting agenda",
      description: "Capture agenda items, next steps, and action items to keep meetings focused and productive.",
      tag: "Great for all teams",
      color: "bg-blue-50",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-white shadow-2xl md:inset-8 lg:inset-16">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Workflow gallery
              </h2>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                New
              </span>
              <a
                className="text-sm text-blue-600 hover:underline"
                href="https://form.asana.com/?k=kyI9mgJ21ZzvaHnDjt0lbA&d=15793206719"
                rel="noopener noreferrer"
                target="_blank"
              >
                Send feedback
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Import
              </Button>
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Blank project
              </Button>
              <button
                className="ml-2 flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
            <button
              className="flex items-center gap-1 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
              type="button"
            >
              More
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-8">
            <h3 className="mb-2 text-2xl font-semibold text-gray-900">
              Start working in seconds
            </h3>
            <p className="text-gray-600">
              Power your everyday processes with Asana's most popular workflows
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <button
                className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 text-left transition-shadow hover:shadow-md"
                key={template.id}
                type="button"
              >
                {/* Template preview */}
                <div className={`h-32 ${template.color} p-4`}>
                  {/* Placeholder for template preview image */}
                  <div className="h-full w-full rounded bg-white/50" />
                </div>

                {/* Template info */}
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="mb-2 font-semibold text-gray-900">
                    {template.title}
                  </h4>
                  <p className="mb-3 flex-1 text-sm text-gray-600">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{template.tag}</span>
                    <svg
                      className="h-4 w-4 text-orange-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
