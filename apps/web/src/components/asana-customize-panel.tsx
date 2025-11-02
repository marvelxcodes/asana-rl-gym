"use client";

import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AsanaCustomizePanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AsanaCustomizePanel({
  isOpen,
  onClose,
}: AsanaCustomizePanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-40 h-full w-80 border-l border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h4 className="font-semibold text-gray-900">Customize</h4>
        <button
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* This project section */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h5 className="text-sm font-semibold text-gray-900">This project</h5>
              <p className="text-xs text-gray-600">
                View and edit features on this project
              </p>
            </div>
            <button
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
              type="button"
            >
              Add
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {/* Fields */}
          <button
            className="flex w-full items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-100">
                <svg
                  className="h-4 w-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Fields</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Rules */}
          <button
            className="flex w-full items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-100">
                <svg
                  className="h-4 w-4 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Rules</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Apps */}
          <button
            className="flex w-full items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-orange-100">
                <svg
                  className="h-4 w-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Apps</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
