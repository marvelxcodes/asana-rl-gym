import { createServer } from "http";
import { parse } from "url";
import { WebSocketServer } from "ws";

// Connection management
const connections = new Map<string, Set<any>>();
const userConnections = new Map<string, any>();

export interface WebSocketMessage {
  type: string;
  projectId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}

let wss: WebSocketServer | null = null;

export function initializeWebSocketServer(port = 3002) {
  if (wss) {
    return wss;
  }

  const server = createServer((req, res) => {
    // Handle HTTP requests for broadcasting
    if (req.method === "POST" && req.url === "/broadcast") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const { projectId, message } = JSON.parse(body);
          broadcastToProject(projectId, message);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
      return;
    }

    if (req.method === "POST" && req.url === "/send-to-user") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const { userId, message } = JSON.parse(body);
          sendToUser(userId, message);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
      return;
    }

    // Default response for other requests
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, request) => {
    console.log("New WebSocket connection");

    const { query } = parse(request.url || "", true);
    const projectId = query.projectId as string;
    const userId = query.userId as string;

    if (!(projectId && userId)) {
      ws.close(1008, "Project ID and User ID required");
      return;
    }

    // Add connection to project room
    if (!connections.has(projectId)) {
      connections.set(projectId, new Set());
    }
    connections.get(projectId)?.add(ws);
    userConnections.set(userId, ws);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connected",
        projectId,
        userId,
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    ws.on("message", (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log("Received WebSocket message:", message);

        // Add metadata to message
        const enrichedMessage = {
          ...message,
          userId,
          projectId,
          timestamp: new Date().toISOString(),
        };

        // Broadcast to all connections in the same project
        broadcastToProject(projectId, enrichedMessage);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    // Handle connection close
    ws.on("close", () => {
      console.log("WebSocket connection closed for user:", userId);
      connections.get(projectId)?.delete(ws);
      userConnections.delete(userId);

      // Clean up empty project rooms
      if (connections.get(projectId)?.size === 0) {
        connections.delete(projectId);
      }

      // Notify other users that this user disconnected
      broadcastToProject(projectId, {
        type: "user_disconnected",
        userId,
        projectId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Notify other users that this user connected
    broadcastToProject(projectId, {
      type: "user_connected",
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    });
  });

  server.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  return wss;
}

// Utility function to broadcast messages to all connections in a project
export function broadcastToProject(
  projectId: string,
  message: WebSocketMessage
) {
  const projectConnections = connections.get(projectId);
  if (!projectConnections) return;

  const messageStr = JSON.stringify(message);

  projectConnections.forEach((ws) => {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error("Error sending message to WebSocket:", error);
        // Remove dead connection
        projectConnections.delete(ws);
      }
    }
  });
}

// Utility function to send message to specific user
export function sendToUser(userId: string, message: WebSocketMessage) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending message to user:", error);
      userConnections.delete(userId);
    }
  }
}

// Utility function to get all connected users in a project
export function getProjectUsers(projectId: string): string[] {
  const users: string[] = [];
  for (const [userId, ws] of userConnections.entries()) {
    if (ws.readyState === 1) {
      // Check if this user is in the project by checking connections
      const projectConnections = connections.get(projectId);
      if (projectConnections?.has(ws)) {
        users.push(userId);
      }
    }
  }
  return users;
}

// Export connection utilities
export { connections, userConnections };
