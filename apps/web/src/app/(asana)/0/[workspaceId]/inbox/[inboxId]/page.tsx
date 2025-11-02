"use client";

import {
  Archive,
  Bookmark,
  ChevronDown,
  Filter,
  MoreVertical,
  Plus,
  Star,
  ThumbsUp,
  Eye,
  PartyPopper,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AsanaLayout } from "@/components/asana-layout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

type PageParams = {
  params: Promise<{
    workspaceId: string;
    inboxId: string;
  }>;
};

type InboxTab = "activity" | "bookmarks" | "archive";

export default function InboxPage({ params }: PageParams) {
  const [activeTab, setActiveTab] = useState<InboxTab>("activity");
  const [showPromoCard, setShowPromoCard] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setWorkspaceId(p.workspaceId);
    });
  }, [params]);

  // Fetch notifications from database
  const { data: notifications = [], refetch } = trpc.notification.getByWorkspace.useQuery(
    {
      workspaceId,
      userId: "current-user", // TODO: Get from auth session
      filter: activeTab === "bookmarks" ? "bookmarked" : activeTab === "archive" ? "archived" : "all",
    },
    {
      enabled: !!workspaceId,
    }
  );

  const toggleBookmarkMutation = trpc.notification.toggleBookmark.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const archiveMutation = trpc.notification.archive.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const archiveAllMutation = trpc.notification.archiveAll.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const toggleBookmark = (id: string) => {
    toggleBookmarkMutation.mutate({ id });
  };

  const archiveNotification = (id: string) => {
    archiveMutation.mutate({ id });
  };

  const archiveAll = () => {
    archiveAllMutation.mutate({
      workspaceId,
      userId: "current-user",
    });
  };

  // Helper to get time group
  const getTimeGroup = (timestamp: number): "Today" | "Yesterday" | "Earlier" => {
    const now = Date.now();
    const diff = now - timestamp;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) return "Today";
    if (diff < 2 * dayMs) return "Yesterday";
    return "Earlier";
  };

  // Helper to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    if (days === 1) {
      const date = new Date(timestamp);
      return `Yesterday at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${days} days ago`;
  };

  // Group notifications by time
  const groupedNotifications = notifications.reduce(
    (acc, notif) => {
      const group = getTimeGroup(notif.createdAt);
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(notif);
      return acc;
    },
    {} as Record<string, typeof notifications>
  );

  const handleViewChange = () => {
    // No-op for inbox page
  };

  const handleNavigate = () => {
    // No-op for inbox page
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
      onCustomize={handleCustomize}
      onNavigate={handleNavigate}
      onShare={handleShare}
      onViewChange={handleViewChange}
      title="Inbox"
    >
      <div className="flex h-full flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
            <Button
              className="h-9 bg-white text-sm text-gray-700 hover:bg-gray-50"
              variant="outline"
            >
              Manage notifications
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "activity"
                  ? "border-b-2 border-blue-600 text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("activity")}
              type="button"
            >
              Activity
            </button>
            <button
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "bookmarks"
                  ? "border-b-2 border-blue-600 text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("bookmarks")}
              type="button"
            >
              Bookmarks
            </button>
            <button
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "archive"
                  ? "border-b-2 border-blue-600 text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("archive")}
              type="button"
            >
              Archive
            </button>
            <button
              className="pb-3 text-gray-400 text-sm hover:text-gray-600"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-3">
          <Button
            className="h-8 bg-white text-sm text-gray-700 hover:bg-gray-50"
            variant="outline"
          >
            <Filter className="mr-2 h-3.5 w-3.5" />
            Filter
          </Button>
          <button
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            type="button"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-auto">
          {Object.entries(groupedNotifications).length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-gray-500 text-sm">
                  No notifications to show
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4">
              {Object.entries(groupedNotifications).map(([timeGroup, notifs]) => (
                <div className="mb-6" key={timeGroup}>
                  {/* Time Group Header */}
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {timeGroup}
                  </h3>

                  {/* Notifications */}
                  <div className="space-y-3">
                    {notifs.map((notif) => (
                      <div
                        className="group flex gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm"
                        key={notif.id}
                      >
                        {/* Task Icon */}
                        <div className="flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-600">
                            ✓
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="mb-1 font-medium text-gray-900 text-sm">
                            Task notification
                          </div>
                          <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-white text-xs">
                              U
                            </div>
                            <span className="font-medium">User</span>
                            <span>•</span>
                            <span>{formatTimestamp(notif.createdAt)}</span>
                          </div>
                          <div className="mb-3 text-gray-700 text-sm">
                            {notif.message}
                          </div>

                          {/* Emoji Reactions */}
                          <div className="flex items-center gap-2">
                            <button
                              className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                              type="button"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                              type="button"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <button
                              className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                              type="button"
                            >
                              <PartyPopper className="h-3 w-3" />
                            </button>
                            <button
                              className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-xs transition-colors hover:bg-gray-50"
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className={`rounded p-1 transition-colors ${
                              notif.isBookmarked
                                ? "text-yellow-500"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            onClick={() => toggleBookmark(notif.id)}
                            type="button"
                          >
                            {notif.isBookmarked ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="rounded p-1 text-gray-400 hover:text-gray-600"
                            onClick={() => archiveNotification(notif.id)}
                            type="button"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Archive All Button */}
              {activeTab === "activity" && notifications.length > 0 && (
                <button
                  className="mt-4 text-sm text-blue-600 hover:underline"
                  onClick={archiveAll}
                  type="button"
                >
                  Archive all notifications
                </button>
              )}
            </div>
          )}

          {/* Promotional Card */}
          {showPromoCard && activeTab === "activity" && (
            <div className="mx-6 mb-6 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
              <button
                className="float-right text-gray-400 hover:text-gray-600"
                onClick={() => setShowPromoCard(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
              <h4 className="mb-2 font-semibold text-gray-900">
                Don't miss important notifications
              </h4>
              <p className="mb-4 text-gray-600 text-sm">
                Get task and comment updates in Slack or Microsoft Teams
              </p>
              <div className="flex gap-3">
                <Button className="h-9 bg-white text-sm text-gray-700 hover:bg-gray-50">
                  Connect Slack
                </Button>
                <Button className="h-9 bg-white text-sm text-gray-700 hover:bg-gray-50">
                  Connect Teams
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AsanaLayout>
  );
}
