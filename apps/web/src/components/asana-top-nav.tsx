"use client";

import {
  CheckSquare,
  FolderKanban,
  Goal,
  HelpCircle,
  LayoutGrid,
  Menu,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AsanaTopNavProps = {
  onToggleSidebar?: () => void;
  userInitials?: string;
  userName?: string;
};

export function AsanaTopNav({
  onToggleSidebar,
  userInitials = "RK",
  userName = "User",
}: AsanaTopNavProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div
      className="flex h-12 items-center justify-between border-b border-gray-800 bg-[#2D333A] px-3"
      data-testid="asana-top-nav"
    >
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Hamburger Menu */}
        <Button
          className="h-8 w-8 p-0 text-white hover:bg-white/10"
          data-testid="toggle-sidebar"
          onClick={onToggleSidebar}
          variant="ghost"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Create Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 gap-1.5 rounded-full bg-transparent px-3 text-sm font-medium text-white hover:bg-white/10 active:bg-white/20"
              data-testid="create-button-top"
              variant="ghost"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F06A6A]">
                <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span>Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 p-1">
            <DropdownMenuItem className="gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100">
              <CheckSquare className="h-4 w-4 stroke-[1.5]" />
              <span>Task</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100">
              <FolderKanban className="h-4 w-4 stroke-[1.5]" />
              <span>Project</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100">
              <MessageSquare className="h-4 w-4 stroke-[1.5]" />
              <span>Message</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100">
              <LayoutGrid className="h-4 w-4 stroke-[1.5]" />
              <span>Portfolio</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100">
              <Goal className="h-4 w-4 stroke-[1.5]" />
              <span>Goal</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center Section - Search */}
      <div className="flex flex-1 justify-center px-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className={`h-8 w-full rounded-2xl bg-[#565557] pl-8 pr-24 text-sm text-[#F5F4F3] placeholder-gray-400 outline-none transition-colors hover:bg-[#5F5E60] ${
              searchFocused ? "ring-1 ring-blue-400/50" : ""
            }`}
            data-testid="search-input"
            onBlur={() => setSearchFocused(false)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search"
            type="text"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <kbd className="rounded border border-gray-600 bg-[#4A4A4C] px-1.5 py-0.5 text-xs text-gray-300">
              Ctrl
            </kbd>
            <kbd className="rounded border border-gray-600 bg-[#4A4A4C] px-1.5 py-0.5 text-xs text-gray-300">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <Button
          className="h-8 w-8 p-0 text-white hover:bg-white/10"
          data-testid="help-button"
          variant="ghost"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 gap-2 px-2 text-white hover:bg-white/10"
              data-testid="user-menu-button"
              variant="ghost"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-semibold text-white">
                {userInitials}
              </div>
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-500">user@example.com</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2">My Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="py-2">My Workspace</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2">Log Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
