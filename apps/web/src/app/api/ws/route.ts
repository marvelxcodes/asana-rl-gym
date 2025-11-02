import { createContext } from "@asana/api/context";
import type { NextRequest } from "next/server";

// Connection management for Server-Sent Events
const connections = new Map<string, Set<ReadableStreamDefaultController>>();
const userConnections = new Map<string, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  // RL Training Environment - no authentication required
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return new Response("Project ID required", { status: 400 });
  }

  // Use default user for RL training
  const userId = "user_1";

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to project room
      if (!connections.has(projectId)) {
        connections.set(projectId, new Set());
      }
      connections.get(projectId)?.add(controller);
      userConnections.set(userId, controller);

      // Send welcome message
      const welcomeMessage = `data: ${JSON.stringify({
        type: "connected",
        projectId,
        userId,
        timestamp: new Date().toISOString(),
      })}\n\n`;

      controller.enqueue(new TextEncoder().encode(welcomeMessage));

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatMessage));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30_000); // 30 seconds

      // Handle connection close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        connections.get(projectId)?.delete(controller);
        userConnections.delete(userId);

        // Clean up empty project rooms
        if (connections.get(projectId)?.size === 0) {
          connections.delete(projectId);
        }

        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Utility function to broadcast messages to all connections in a project
export function broadcastToProject(projectId: string, message: any) {
  const projectConnections = connections.get(projectId);
  if (!projectConnections) return;

  const messageStr = `data: ${JSON.stringify(message)}\n\n`;
  const encodedMessage = new TextEncoder().encode(messageStr);

  projectConnections.forEach((controller) => {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      // Connection closed, remove it
      projectConnections.delete(controller);
    }
  });
}

// Utility function to send message to specific user
export function sendToUser(userId: string, message: any) {
  const controller = userConnections.get(userId);
  if (controller) {
    try {
      const messageStr = `data: ${JSON.stringify(message)}\n\n`;
      controller.enqueue(new TextEncoder().encode(messageStr));
    } catch (error) {
      // Connection closed, remove it
      userConnections.delete(userId);
    }
  }
}

// Export connection utilities for use in other parts of the app
export { connections, userConnections };
