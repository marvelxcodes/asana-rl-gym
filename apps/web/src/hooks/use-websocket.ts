import { useCallback, useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  projectId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}

export interface UseWebSocketOptions {
  projectId: string;
  userId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({
  projectId,
  userId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Use WebSocket server on port 3002
      const wsUrl = `ws://localhost:3002?projectId=${projectId}&userId=${userId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`
            );
            connect();
          }, delay);
        } else {
          setConnectionError("Failed to reconnect after multiple attempts");
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("WebSocket connection error");
        onError?.(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionError("Failed to create WebSocket connection");
    }
  }, [projectId, userId, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (message: Omit<WebSocketMessage, "timestamp">) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString(),
        };
        wsRef.current.send(JSON.stringify(messageWithTimestamp));
      } else {
        console.warn("WebSocket is not connected. Message not sent:", message);
      }
    },
    []
  );

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      disconnect();
    },
    [disconnect]
  );

  return {
    isConnected,
    connectionError,
    sendMessage,
    connect,
    disconnect,
  };
}
