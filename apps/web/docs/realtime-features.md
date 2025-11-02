# Real-time Collaboration Features

This document describes the real-time collaboration features implemented for the Asana Replica RL Gym project.

## Overview

The real-time system enables live updates across all connected clients when tasks, comments, or project data changes. It uses WebSocket connections for low-latency communication and Server-Sent Events as a fallback.

## Architecture

### WebSocket Server
- Runs on port 3002 (configurable via `WS_PORT` environment variable)
- Manages project-specific rooms for broadcasting updates
- Handles user connection/disconnection events
- Provides HTTP endpoints for broadcasting from API services

### Real-time Service
- `RealtimeService` class in `packages/api/src/services/realtime.ts`
- Integrates with existing tRPC services (TaskService, CommentService)
- Broadcasts updates via HTTP calls to WebSocket server
- Supports different message types for various events

### Client-side Components
- `WebSocketProvider`: React context for managing WebSocket connections
- `useWebSocket`: Hook for direct WebSocket communication
- `useRealtimeUpdates`: Hook for handling specific event types
- `ProjectWebSocketConnector`: Component to auto-connect when entering projects
- `RealtimeStatus`: Visual indicator of connection status

## Usage

### 1. Starting the Development Environment

To run both the Next.js app and WebSocket server:

```bash
# Run both servers concurrently
cd apps/web
bun run dev:full

# Or run them separately:
bun run dev        # Next.js on port 3001
bun run dev:ws     # WebSocket server on port 3002
```

### 2. Connecting to Real-time Updates

The `WebSocketProvider` is already integrated into the app providers. To connect to a specific project:

```tsx
import { ProjectWebSocketConnector } from "@/components/project-websocket-connector";

function ProjectPage({ projectId, userId }: { projectId: string; userId: string }) {
  return (
    <div>
      <ProjectWebSocketConnector projectId={projectId} userId={userId} />
      {/* Your project content */}
    </div>
  );
}
```

### 3. Handling Real-time Events

Use the `useRealtimeUpdates` hook to respond to specific events:

```tsx
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";

function TaskList() {
  const [tasks, setTasks] = useState([]);

  useRealtimeUpdates({
    onTaskCreated: (data) => {
      setTasks(prev => [...prev, data.task]);
    },
    onTaskUpdated: (data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId ? { ...task, ...data.task } : task
      ));
    },
    onTaskDeleted: (data) => {
      setTasks(prev => prev.filter(task => task.id !== data.taskId));
    },
    onTaskStatusChanged: (data) => {
      // Handle status changes with special logic
      console.log(\`Task \${data.taskId} changed from \${data.previousStatus} to \${data.newStatus}\`);
    }
  });

  // ... rest of component
}
```

### 4. Specialized Hooks

For common use cases, use the specialized hooks:

```tsx
import { useTaskRealtimeUpdates, useCommentRealtimeUpdates } from "@/hooks/use-realtime-updates";

// For task updates
useTaskRealtimeUpdates(
  (data) => {
    // Handle any task update
    refetchTasks();
  },
  (data) => {
    // Handle status changes specifically
    showStatusChangeNotification(data);
  }
);

// For comment updates
useCommentRealtimeUpdates((data) => {
  refetchComments();
});
```

## Event Types

### Task Events
- `task_created`: New task created
- `task_updated`: Task properties updated
- `task_deleted`: Task deleted
- `task_status_changed`: Task status changed (special case of update)

### Comment Events
- `comment_created`: New comment added
- `comment_updated`: Comment edited
- `comment_deleted`: Comment removed

### User Activity Events
- `user_connected`: User joined project
- `user_disconnected`: User left project

### Project Events
- `project_updated`: Project properties changed

## Message Format

All real-time messages follow this structure:

```typescript
interface WebSocketMessage {
  type: string;
  projectId?: string;
  userId?: string;
  data?: any;
  timestamp: string;
}
```

Example task update message:
```json
{
  "type": "task_status_changed",
  "projectId": "proj_123",
  "userId": "user_456",
  "data": {
    "taskId": "task_789",
    "projectId": "proj_123",
    "task": { /* full task object */ },
    "previousStatus": "todo",
    "newStatus": "in_progress"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Connection Management

### Automatic Reconnection
The WebSocket client automatically attempts to reconnect with exponential backoff:
- Initial retry after 2 seconds
- Maximum retry delay of 30 seconds
- Up to 5 reconnection attempts

### Connection Status
Monitor connection status using the `RealtimeStatus` component or the `isConnected` property from hooks:

```tsx
import { RealtimeStatus } from "@/components/realtime-status";

function ProjectHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1>Project Name</h1>
      <RealtimeStatus />
    </div>
  );
}
```

## Production Considerations

### Scaling
For production deployment:
1. Replace in-memory connection storage with Redis
2. Use Redis pub/sub for broadcasting between server instances
3. Implement proper authentication for WebSocket connections
4. Add rate limiting and connection limits

### Fallback Strategy
If WebSocket connections fail:
1. The system gracefully degrades to polling-based updates
2. Server-Sent Events can be used as an alternative transport
3. The UI remains functional without real-time features

### Security
- WebSocket connections require valid user authentication
- Project-level access control is enforced
- All messages include user and project context for validation

## Troubleshooting

### WebSocket Connection Issues
1. Ensure WebSocket server is running on port 3002
2. Check browser console for connection errors
3. Verify firewall settings allow WebSocket connections
4. Check that the user has access to the project

### Missing Updates
1. Verify the user is connected to the correct project room
2. Check server logs for broadcasting errors
3. Ensure the WebSocket server HTTP endpoints are accessible
4. Verify tRPC services are calling RealtimeService methods

### Performance Issues
1. Monitor connection count and message frequency
2. Implement message throttling if needed
3. Consider using message batching for high-frequency updates
4. Profile memory usage in connection management