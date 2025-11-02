"use client";

import { useEffect, useState } from "react";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import { ProjectWebSocketConnector } from "./project-websocket-connector";
import { RealtimeStatus } from "./realtime-status";

interface ExampleRealtimeUsageProps {
  projectId: string;
  userId: string;
}

export function ExampleRealtimeUsage({
  projectId,
  userId,
}: ExampleRealtimeUsageProps) {
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);

  const { isConnected } = useRealtimeUpdates({
    onTaskCreated: (data) => {
      setRealtimeEvents((prev) => [
        ...prev,
        `Task created: ${data.task?.name || data.taskId}`,
      ]);
    },
    onTaskUpdated: (data) => {
      setRealtimeEvents((prev) => [
        ...prev,
        `Task updated: ${data.task?.name || data.taskId}`,
      ]);
    },
    onTaskStatusChanged: (data) => {
      setRealtimeEvents((prev) => [
        ...prev,
        `Task status changed: ${data.taskId} from ${data.previousStatus} to ${data.newStatus}`,
      ]);
    },
    onCommentCreated: (data) => {
      setRealtimeEvents((prev) => [
        ...prev,
        `Comment added to task: ${data.taskId}`,
      ]);
    },
    onUserConnected: (data) => {
      setRealtimeEvents((prev) => [...prev, `User connected: ${data.userId}`]);
    },
    onUserDisconnected: (data) => {
      setRealtimeEvents((prev) => [
        ...prev,
        `User disconnected: ${data.userId}`,
      ]);
    },
  });

  // Clear events after 10 seconds
  useEffect(() => {
    if (realtimeEvents.length > 0) {
      const timer = setTimeout(() => {
        setRealtimeEvents((prev) => prev.slice(-5)); // Keep only last 5 events
      }, 10_000);
      return () => clearTimeout(timer);
    }
  }, [realtimeEvents]);

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <ProjectWebSocketConnector projectId={projectId} userId={userId} />

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Real-time Updates</h3>
        <RealtimeStatus />
      </div>

      <div className="space-y-2">
        <p className="text-gray-600 text-sm">
          Connection Status: {isConnected ? "Connected" : "Disconnected"}
        </p>

        <div className="max-h-40 overflow-y-auto">
          <h4 className="mb-2 font-medium text-sm">Recent Events:</h4>
          {realtimeEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet...</p>
          ) : (
            <ul className="space-y-1">
              {realtimeEvents.slice(-10).map((event, index) => (
                <li
                  className="rounded border bg-white p-2 text-gray-700 text-sm"
                  key={index}
                >
                  {event}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
