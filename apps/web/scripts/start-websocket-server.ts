#!/usr/bin/env bun

import { initializeWebSocketServer } from "../src/lib/websocket-server";

const port = process.env.WS_PORT ? Number.parseInt(process.env.WS_PORT) : 3002;

console.log("Starting WebSocket server...");
initializeWebSocketServer(port);

// Keep the process running
process.on("SIGINT", () => {
  console.log("\nShutting down WebSocket server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down WebSocket server...");
  process.exit(0);
});
