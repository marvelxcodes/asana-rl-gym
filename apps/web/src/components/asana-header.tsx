"use client";

import {
  Calendar,
  FileText,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ViewType = "list" | "board" | "calendar" | "files";

type AsanaHeaderProps = {
  title: string;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onCustomize?: () => void;
  onShare?: () => void;
};

export function AsanaHeader({
  title,
  currentView = "list",
  onViewChange,
  onCustomize,
  onShare,
}: AsanaHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: "list", label: "List", icon: <List className="h-4 w-4" /> },
    { id: "board", label: "Board", icon: <Grid3X3 className="h-4 w-4" /> },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
    },
    { id: "files", label: "Files", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div
      className="border-b border-gray-200 bg-white"
      data-testid="asana-header"
    >
      {/* Top Section - Title and Actions */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200"
            data-testid="project-avatar"
          >
            <span className="font-semibold text-gray-700 text-sm">
              {title.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <h1 className="font-semibold text-gray-900 text-xl">{title}</h1>
          <Button data-testid="project-menu" size="icon" variant="ghost">
            <MoreHorizontal className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="gap-2"
            data-testid="share-button"
            onClick={onShare}
            size="sm"
            variant="outline"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            className="gap-2"
            data-testid="customize-button"
            onClick={onCustomize}
            size="sm"
            variant="outline"
          >
            <Settings className="h-4 w-4" />
            Customize
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex items-center gap-6">
          {views.map((view) => (
            <button
              className={`relative flex items-center gap-2 border-b-2 px-1 pb-3 pt-2 text-sm transition-colors ${
                currentView === view.id
                  ? "border-[#4573D2] font-medium text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
              data-testid={`view-tab-${view.id}`}
              key={view.id}
              onClick={() => onViewChange?.(view.id)}
              type="button"
            >
              {view.icon}
              {view.label}
            </button>
          ))}
          <button
            className="flex items-center gap-2 border-b-2 border-transparent px-1 pb-3 pt-2 text-gray-400 text-sm transition-colors hover:text-gray-600"
            data-testid="add-view-tab"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <Button
            className="gap-2 bg-[#4573D2] text-white hover:bg-[#3563C2] active:bg-[#2553B2]"
            data-testid="add-task-button"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
          <Button data-testid="more-actions" size="icon" variant="ghost">
            <MoreHorizontal className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="gap-2"
            data-testid="filter-button"
            size="sm"
            variant="ghost"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            className="gap-2"
            data-testid="sort-button"
            size="sm"
            variant="ghost"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </Button>
          <Button
            className="gap-2"
            data-testid="group-button"
            size="sm"
            variant="ghost"
          >
            <Grid3X3 className="h-4 w-4" />
            Group
          </Button>
          <Button
            className="gap-2"
            data-testid="options-button"
            size="sm"
            variant="ghost"
          >
            <Settings className="h-4 w-4" />
            Options
          </Button>
          <Button data-testid="search-button" size="icon" variant="ghost">
            <Search className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
