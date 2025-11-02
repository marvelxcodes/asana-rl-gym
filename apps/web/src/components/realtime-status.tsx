"use client";

import { useWebSocketContext } from "./websocket-provider";

export function RealtimeStatus() {
  const { isConnected, connectionError } = useWebSocketContext();

  if (connectionError) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span>Connection error</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600 text-sm">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span>Live</span>
    </div>
  );
}
