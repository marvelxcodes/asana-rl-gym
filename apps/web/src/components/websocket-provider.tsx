"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket";

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (message: Omit<WebSocketMessage, "timestamp">) => void;
  subscribe: (
    type: string,
    callback: (message: WebSocketMessage) => void
  ) => () => void;
  connect: (projectId: string, userId: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageSubscribers, setMessageSubscribers] = useState<
    Map<string, Set<(message: WebSocketMessage) => void>>
  >(new Map());

  const handleMessage = (message: WebSocketMessage) => {
    // Notify all subscribers for this message type
    const subscribers = messageSubscribers.get(message.type);
    if (subscribers) {
      subscribers.forEach((callback) => callback(message));
    }

    // Also notify subscribers for "all" messages
    const allSubscribers = messageSubscribers.get("*");
    if (allSubscribers) {
      allSubscribers.forEach((callback) => callback(message));
    }
  };

  const {
    isConnected,
    connectionError,
    sendMessage,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useWebSocket({
    projectId: currentProjectId || "",
    userId: currentUserId || "",
    onMessage: handleMessage,
    onConnect: () => {
      console.log("WebSocket provider connected");
    },
    onDisconnect: () => {
      console.log("WebSocket provider disconnected");
    },
    onError: (error) => {
      console.error("WebSocket provider error:", error);
    },
  });

  const connect = (projectId: string, userId: string) => {
    setCurrentProjectId(projectId);
    setCurrentUserId(userId);
  };

  const disconnect = () => {
    wsDisconnect();
    setCurrentProjectId(null);
    setCurrentUserId(null);
  };

  const subscribe = (
    type: string,
    callback: (message: WebSocketMessage) => void
  ) => {
    setMessageSubscribers((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(type)) {
        newMap.set(type, new Set());
      }
      newMap.get(type)?.add(callback);
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      setMessageSubscribers((prev) => {
        const newMap = new Map(prev);
        const subscribers = newMap.get(type);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            newMap.delete(type);
          }
        }
        return newMap;
      });
    };
  };

  // Auto-connect when projectId and userId are available
  useEffect(() => {
    if (currentProjectId && currentUserId) {
      wsConnect();
    }
  }, [currentProjectId, currentUserId, wsConnect]);

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionError,
    sendMessage,
    subscribe,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}
