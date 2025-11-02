"use client";

import { Lock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type AsanaShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export function AsanaShareModal({
  isOpen,
  onClose,
  title = "My tasks",
}: AsanaShareModalProps) {
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Manage privacy</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Input field */}
          <div className="mb-4">
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Add teammates by adding their name or email..."
              type="text"
              value={email}
            />
          </div>

          {/* Info message */}
          <div className="flex items-start gap-3 rounded-md bg-gray-50 p-4">
            <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
            <div className="flex-1 text-sm text-gray-700">
              <p>
                This view is private to only you. Adding teammates will allow
                them to view, edit, and organize your work. They will only be
                able to see tasks they already have access to.{" "}
                <a
                  className="text-blue-600 hover:underline"
                  href="https://asana.com/guide/help/fundamentals/my-tasks#gl-membership"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            <Button
              className="bg-[#F06A6A] hover:bg-[#E55A5A] disabled:opacity-50"
              disabled={!email.trim()}
              type="button"
            >
              Invite
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
