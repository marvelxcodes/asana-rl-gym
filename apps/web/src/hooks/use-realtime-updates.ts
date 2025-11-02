"use client";

import { useCallback, useEffect } from "react";
import { useWebSocketContext } from "@/components/websocket-provider";
import type { WebSocketMessage } from "@/hooks/use-websocket";

export interface RealtimeUpdateHandlers {
  onTaskCreated?: (data: any) => void;
  onTaskUpdated?: (data: any) => void;
  onTaskDeleted?: (data: any) => void;
  onTaskStatusChanged?: (data: any) => void;
  onCommentCreated?: (data: any) => void;
  onCommentUpdated?: (data: any) => void;
  onCommentDeleted?: (data: any) => void;
  onUserConnected?: (data: any) => void;
  onUserDisconnected?: (data: any) => void;
  onProjectUpdated?: (data: any) => void;
}

export function useRealtimeUpdates(handlers: RealtimeUpdateHandlers) {
  const { subscribe, isConnected } = useWebSocketContext();

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "task_created":
          handlers.onTaskCreated?.(message.data);
          break;
        case "task_updated":
          handlers.onTaskUpdated?.(message.data);
          break;
        case "task_deleted":
          handlers.onTaskDeleted?.(message.data);
          break;
        case "task_status_changed":
          handlers.onTaskStatusChanged?.(message.data);
          break;
        case "comment_created":
          handlers.onCommentCreated?.(message.data);
          break;
        case "comment_updated":
          handlers.onCommentUpdated?.(message.data);
          break;
        case "comment_deleted":
          handlers.onCommentDeleted?.(message.data);
          break;
        case "user_connected":
          handlers.onUserConnected?.(message.data);
          break;
        case "user_disconnected":
          handlers.onUserDisconnected?.(message.data);
          break;
        case "project_updated":
          handlers.onProjectUpdated?.(message.data);
          break;
        default:
          // Handle unknown message types
          console.log("Unknown realtime message type:", message.type);
      }
    },
    [handlers]
  );

  useEffect(() => {
    // Subscribe to all message types
    const unsubscribe = subscribe("*", handleMessage);

    return unsubscribe;
  }, [subscribe, handleMessage]);

  return {
    isConnected,
  };
}

// Specialized hooks for specific use cases

export function useTaskRealtimeUpdates(
  onTaskUpdate: (data: any) => void,
  onTaskStatusChange?: (data: any) => void
) {
  return useRealtimeUpdates({
    onTaskCreated: onTaskUpdate,
    onTaskUpdated: onTaskUpdate,
    onTaskDeleted: onTaskUpdate,
    onTaskStatusChanged: onTaskStatusChange || onTaskUpdate,
  });
}

export function useCommentRealtimeUpdates(
  onCommentUpdate: (data: any) => void
) {
  return useRealtimeUpdates({
    onCommentCreated: onCommentUpdate,
    onCommentUpdated: onCommentUpdate,
    onCommentDeleted: onCommentUpdate,
  });
}

export function useUserActivityUpdates(onUserActivity: (data: any) => void) {
  return useRealtimeUpdates({
    onUserConnected: onUserActivity,
    onUserDisconnected: onUserActivity,
  });
}
