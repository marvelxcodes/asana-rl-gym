"use client";

import { useEffect } from "react";
import { useWebSocketContext } from "./websocket-provider";

interface ProjectWebSocketConnectorProps {
  projectId: string;
  userId: string;
}

export function ProjectWebSocketConnector({
  projectId,
  userId,
}: ProjectWebSocketConnectorProps) {
  const { connect, disconnect, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (projectId && userId) {
      connect(projectId, userId);
    }

    return () => {
      disconnect();
    };
  }, [projectId, userId, connect, disconnect]);

  // This component doesn't render anything visible
  return null;
}
