"use client";

import {
  Calendar,
  ChevronDown,
  FileText,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";
import { AsanaButton } from "@/components/asana-button";
import { AsanaCustomizePanel } from "@/components/asana-customize-panel";
import { AsanaShareModal } from "@/components/asana-share-modal";
import { AsanaTooltip } from "@/components/asana-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type ViewType = "list" | "board" | "calendar" | "files";
export type FilterType = "all" | "incomplete" | "completed";
export type SortType =
  | "dueDate"
  | "alphabetical"
  | "assignee"
  | "likes"
  | "none";
export type GroupType =
  | "none"
  | "section"
  | "assignee"
  | "dueDate"
  | "project";

type AsanaHeaderExactProps = {
  title: string;
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onCustomize?: () => void;
  onShare?: () => void;
  onFilterChange?: (filter: FilterType) => void;
  onSortChange?: (sort: SortType) => void;
  onGroupChange?: (group: GroupType) => void;
};

export function AsanaHeaderExact({
  title,
  currentView = "list",
  onViewChange,
  onCustomize,
  onShare,
  onFilterChange,
  onSortChange,
  onGroupChange,
}: AsanaHeaderExactProps) {
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [currentSort, setCurrentSort] = useState<SortType>("none");
  const [currentGroup, setCurrentGroup] = useState<GroupType>("section");
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);

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

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
    onFilterChange?.(filter);
  };

  const handleSortChange = (sort: SortType) => {
    setCurrentSort(sort);
    onSortChange?.(sort);
  };

  const handleGroupChange = (group: GroupType) => {
    setCurrentGroup(group);
    onGroupChange?.(group);
  };

  const clearSort = () => {
    handleSortChange("none");
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Title Bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
            <span className="font-semibold text-gray-700 text-xs">
              {title.substring(0, 2).toUpperCase()}
            </span>
          </div>
          {/* Title */}
          <h1 className="font-semibold text-gray-900 text-lg">{title}</h1>
          {/* Dropdown indicator */}
          <button
            className="flex items-center text-gray-500 hover:text-gray-700"
            type="button"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <AsanaButton
            icon={<Share2 className="h-4 w-4" />}
            onClick={() => {
              setShowShareModal(true);
              onShare?.();
            }}
            size="sm"
            variant="secondary"
          >
            Share
          </AsanaButton>
          <AsanaButton
            icon={<Settings2 className="h-4 w-4" />}
            onClick={() => {
              setShowCustomizePanel(true);
              onCustomize?.();
            }}
            size="sm"
            variant="secondary"
          >
            Customize
          </AsanaButton>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-1">
          {views.map((view) => (
            <button
              className={`flex h-full items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors ${
                currentView === view.id
                  ? "border-blue-600 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
              data-testid={`view-tab-${view.id}`}
              key={view.id}
              onClick={() => onViewChange?.(view.id)}
              type="button"
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
          <AsanaTooltip content="Add view">
            <button
              className="flex h-full items-center border-b-2 border-transparent px-2 text-gray-600 hover:text-gray-900"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </AsanaTooltip>
        </div>

        {/* Search */}
        <AsanaTooltip content="Search this project">
          <button
            className="flex items-center text-gray-500 hover:text-gray-700"
            type="button"
          >
            <Search className="h-4 w-4" />
          </button>
        </AsanaTooltip>
      </div>

      {/* Toolbar */}
      <div className="flex h-12 items-center justify-between border-t border-gray-200 px-6">
        <div className="flex items-center gap-2">
          {/* Add task button - Primary blue */}
          <AsanaButton
            icon={<Plus className="h-4 w-4" />}
            iconRight={<ChevronDown className="h-3 w-3" />}
            size="md"
            variant="primary"
          >
            Add task
          </AsanaButton>
          <AsanaTooltip content="More actions">
            <button
              className="flex items-center text-gray-500 hover:text-gray-700"
              type="button"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </AsanaTooltip>
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AsanaButton
                icon={<Filter className="h-4 w-4" />}
                size="sm"
                variant="ghost-gray"
              >
                Filter
                {currentFilter !== "all" && `: ${currentFilter}`}
              </AsanaButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleFilterChange("incomplete")}
              >
                <span>Incomplete tasks</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleFilterChange("completed")}
              >
                <span>Completed tasks</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleFilterChange("all")}
              >
                <span>All tasks</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2">
                <span>Custom filters</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sorts button with badge */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AsanaButton
                  iconRight={<ChevronDown className="h-3 w-3" />}
                  size="sm"
                  variant="ghost-gray"
                >
                  {currentSort === "none"
                    ? "Sort"
                    : `Sort: ${currentSort === "dueDate" ? "Due date" : currentSort === "alphabetical" ? "Alphabetical" : currentSort === "assignee" ? "Assignee" : "Likes"}`}
                </AsanaButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  className="py-2"
                  onClick={() => handleSortChange("dueDate")}
                >
                  <span>Due date</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-2"
                  onClick={() => handleSortChange("alphabetical")}
                >
                  <span>Alphabetical</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-2"
                  onClick={() => handleSortChange("assignee")}
                >
                  <span>Assignee</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-2"
                  onClick={() => handleSortChange("likes")}
                >
                  <span>Likes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2" onClick={clearSort}>
                  <span>Clear sort</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {currentSort !== "none" && (
              <AsanaTooltip content="Clear sort" side="top">
                <button
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={clearSort}
                  type="button"
                >
                  <X className="h-2.5 w-2.5 text-gray-600" />
                </button>
              </AsanaTooltip>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AsanaButton
                iconRight={<ChevronDown className="h-3 w-3" />}
                size="sm"
                variant="ghost-gray"
              >
                Group
                {currentGroup !== "none" &&
                  `: ${currentGroup === "section" ? "Section" : currentGroup === "assignee" ? "Assignee" : currentGroup === "dueDate" ? "Due date" : "Project"}`}
              </AsanaButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleGroupChange("none")}
              >
                <span>None</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleGroupChange("section")}
              >
                <span>By section</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleGroupChange("assignee")}
              >
                <span>By assignee</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleGroupChange("dueDate")}
              >
                <span>By due date</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-2"
                onClick={() => handleGroupChange("project")}
              >
                <span>By project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AsanaButton
                iconRight={<ChevronDown className="h-3 w-3" />}
                size="sm"
                variant="ghost-gray"
              >
                Options
              </AsanaButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={showSubtasks}
                className="py-2"
                onCheckedChange={setShowSubtasks}
              >
                <span>Show subtasks</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showDependencies}
                className="py-2"
                onCheckedChange={setShowDependencies}
              >
                <span>Show dependencies</span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2">
                <span>Compact view</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2">
                <span>Color by project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AsanaTooltip content="More options">
            <button
              className="flex items-center text-gray-500 hover:text-gray-700"
              type="button"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </AsanaTooltip>
        </div>
      </div>

      {/* Share Modal */}
      <AsanaShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={title}
      />

      {/* Customize Panel */}
      <AsanaCustomizePanel
        isOpen={showCustomizePanel}
        onClose={() => setShowCustomizePanel(false)}
      />
    </div>
  );
}
