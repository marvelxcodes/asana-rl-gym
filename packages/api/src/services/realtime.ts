// Real-time service for broadcasting updates via WebSocket
// This service will be used by other services to notify connected clients

export interface RealtimeMessage {
  type: string;
  data: any;
  userId?: string;
  projectId?: string;
  timestamp: string;
}

export interface TaskUpdateMessage extends RealtimeMessage {
  type:
    | "task_updated"
    | "task_created"
    | "task_deleted"
    | "task_status_changed";
  data: {
    taskId: string;
    projectId: string;
    task?: any;
    previousStatus?: string;
    newStatus?: string;
  };
}

export interface CommentMessage extends RealtimeMessage {
  type: "comment_created" | "comment_updated" | "comment_deleted";
  data: {
    commentId: string;
    taskId: string;
    projectId: string;
    comment?: any;
  };
}

export interface ProjectMessage extends RealtimeMessage {
  type: "project_updated" | "project_member_added" | "project_member_removed";
  data: {
    projectId: string;
    project?: any;
    memberId?: string;
  };
}

export interface UserActivityMessage extends RealtimeMessage {
  type: "user_connected" | "user_disconnected" | "user_typing";
  data: {
    userId: string;
    projectId: string;
    taskId?: string;
  };
}

// In-memory storage for WebSocket connections
// In production, this would be replaced with Redis or similar
const projectConnections = new Map<string, Set<any>>();
const userConnections = new Map<string, any>();

export class RealtimeService {
  // Initialize connection storage (called from WebSocket server)
  static initializeConnections(
    connections: Map<string, Set<any>>,
    users: Map<string, any>
  ) {
    // This would be called from the WebSocket server to share connection references
    // For now, we'll use a simple HTTP-based approach
  }

  // Broadcast message to all users in a project
  static async broadcastToProject(projectId: string, message: RealtimeMessage) {
    try {
      // In development, we'll use a simple HTTP call to the WebSocket server
      // In production, this would use shared memory or Redis pub/sub

      const wsMessage = {
        ...message,
        projectId,
        timestamp: new Date().toISOString(),
      };

      // Try to send to WebSocket server via HTTP API
      try {
        await fetch("http://localhost:3002/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "project_broadcast",
            projectId,
            message: wsMessage,
          }),
        });
      } catch (error) {
        // WebSocket server might not be running in production
        console.warn("Could not broadcast to WebSocket server:", error);
      }

      console.log(`Broadcasting to project ${projectId}:`, wsMessage);
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  }

  // Send message to specific user
  static async sendToUser(userId: string, message: RealtimeMessage) {
    try {
      const wsMessage = {
        ...message,
        userId,
        timestamp: new Date().toISOString(),
      };

      // Try to send to WebSocket server via HTTP API
      try {
        await fetch("http://localhost:3002/send-to-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            message: wsMessage,
          }),
        });
      } catch (error) {
        console.warn("Could not send to WebSocket server:", error);
      }

      console.log(`Sending to user ${userId}:`, wsMessage);
    } catch (error) {
      console.error("Error sending message to user:", error);
    }
  }

  // Task-related broadcasts
  static async broadcastTaskUpdate(
    projectId: string,
    taskId: string,
    task: any,
    userId: string
  ) {
    const message: TaskUpdateMessage = {
      type: "task_updated",
      data: {
        taskId,
        projectId,
        task,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  static async broadcastTaskCreated(
    projectId: string,
    task: any,
    userId: string
  ) {
    const message: TaskUpdateMessage = {
      type: "task_created",
      data: {
        taskId: task.id,
        projectId,
        task,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  static async broadcastTaskDeleted(
    projectId: string,
    taskId: string,
    userId: string
  ) {
    const message: TaskUpdateMessage = {
      type: "task_deleted",
      data: {
        taskId,
        projectId,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  static async broadcastTaskStatusChanged(
    projectId: string,
    taskId: string,
    previousStatus: string,
    newStatus: string,
    task: any,
    userId: string
  ) {
    const message: TaskUpdateMessage = {
      type: "task_status_changed",
      data: {
        taskId,
        projectId,
        task,
        previousStatus,
        newStatus,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  // Comment-related broadcasts
  static async broadcastCommentCreated(
    projectId: string,
    taskId: string,
    comment: any,
    userId: string
  ) {
    const message: CommentMessage = {
      type: "comment_created",
      data: {
        commentId: comment.id,
        taskId,
        projectId,
        comment,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  static async broadcastCommentUpdated(
    projectId: string,
    taskId: string,
    comment: any,
    userId: string
  ) {
    const message: CommentMessage = {
      type: "comment_updated",
      data: {
        commentId: comment.id,
        taskId,
        projectId,
        comment,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  static async broadcastCommentDeleted(
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string
  ) {
    const message: CommentMessage = {
      type: "comment_deleted",
      data: {
        commentId,
        taskId,
        projectId,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  // Project-related broadcasts
  static async broadcastProjectUpdated(
    projectId: string,
    project: any,
    userId: string
  ) {
    const message: ProjectMessage = {
      type: "project_updated",
      data: {
        projectId,
        project,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }

  // User activity broadcasts
  static async broadcastUserActivity(
    projectId: string,
    userId: string,
    activityType: "connected" | "disconnected" | "typing",
    taskId?: string
  ) {
    const message: UserActivityMessage = {
      type: `user_${activityType}` as any,
      data: {
        userId,
        projectId,
        taskId,
      },
      userId,
      projectId,
      timestamp: new Date().toISOString(),
    };

    await RealtimeService.broadcastToProject(projectId, message);
  }
}
