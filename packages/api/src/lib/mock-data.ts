/**
 * Mock Data Generator for RL Training Environment
 *
 * Provides realistic mock data with variance for training RL agents.
 * Data is generated deterministically based on IDs for consistency,
 * but with controlled randomness for training diversity.
 */

export interface MockWorkspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MockProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MockTask {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  createdById: string;
  dueDate: number | null;
  completedAt: number | null;
  position: number;
  createdAt: number;
  updatedAt: number;
}

export interface MockComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
}

// Deterministic random number generator based on seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

// Project templates with Asana-like names and colors
const PROJECT_TEMPLATES = [
  { name: "Product Roadmap Q1", color: "#FC636B", icon: "🚀" },
  { name: "Marketing Campaign", color: "#3BE8B0", icon: "📢" },
  { name: "Website Redesign", color: "#6F6FE9", icon: "🎨" },
  { name: "Customer Onboarding", color: "#FFA23E", icon: "👥" },
  { name: "Engineering Sprint 12", color: "#E362E3", icon: "⚡" },
  { name: "Content Calendar", color: "#14AAF5", icon: "📅" },
  { name: "Sales Pipeline", color: "#00C875", icon: "💰" },
  { name: "Team Building Events", color: "#FFD234", icon: "🎉" },
  { name: "Bug Fixes & Tech Debt", color: "#808080", icon: "🔧" },
  { name: "Customer Support Tickets", color: "#FF6B6B", icon: "🎫" },
];

// Task templates with realistic Asana-like task names
const TASK_TEMPLATES = [
  "Design mockups for landing page",
  "Review and approve blog post",
  "Schedule team meeting",
  "Update product documentation",
  "Fix login page bug",
  "Analyze user feedback survey",
  "Prepare quarterly presentation",
  "Research competitor features",
  "Optimize database queries",
  "Write API documentation",
  "Create social media graphics",
  "Test mobile responsiveness",
  "Update dependencies to latest versions",
  "Review pull request #123",
  "Conduct user interviews",
  "Set up analytics dashboard",
  "Draft email newsletter",
  "Plan sprint retrospective",
  "Update pricing page",
  "Implement dark mode toggle",
];

// User templates
const USER_TEMPLATES = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", avatarColor: "#FC636B" },
  { name: "Marcus Johnson", email: "marcus.j@example.com", avatarColor: "#3BE8B0" },
  { name: "Elena Rodriguez", email: "elena.r@example.com", avatarColor: "#6F6FE9" },
  { name: "David Kim", email: "david.kim@example.com", avatarColor: "#FFA23E" },
  { name: "Priya Sharma", email: "priya.sharma@example.com", avatarColor: "#E362E3" },
];

// In-memory storage for mock data consistency
const mockStorage = {
  workspaces: new Map<string, MockWorkspace>(),
  projects: new Map<string, MockProject>(),
  tasks: new Map<string, MockTask>(),
  comments: new Map<string, MockComment>(),
  users: new Map<string, MockUser>(),
};

// Initialize default users
export function initializeMockUsers() {
  USER_TEMPLATES.forEach((template, index) => {
    const userId = `user_${index + 1}`;
    mockStorage.users.set(userId, {
      id: userId,
      ...template,
    });
  });
}

// Generate or get workspace
export function getMockWorkspace(workspaceId: string): MockWorkspace {
  if (mockStorage.workspaces.has(workspaceId)) {
    return mockStorage.workspaces.get(workspaceId)!;
  }

  const workspace: MockWorkspace = {
    id: workspaceId,
    name: `Workspace ${workspaceId}`,
    description: `A collaborative workspace for team productivity`,
    ownerId: "user_1",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    updatedAt: Date.now(),
  };

  mockStorage.workspaces.set(workspaceId, workspace);
  return workspace;
}

// Generate default workspaces
export function getDefaultWorkspaces(): MockWorkspace[] {
  const workspaces = [
    getMockWorkspace("workspace_1"),
    getMockWorkspace("workspace_2"),
  ];

  workspaces[0].name = "Personal Projects";
  workspaces[1].name = "Team Workspace";

  return workspaces;
}

// Generate or get project
export function getMockProject(projectId: string, workspaceId?: string): MockProject {
  if (mockStorage.projects.has(projectId)) {
    return mockStorage.projects.get(projectId)!;
  }

  const random = seededRandom(projectId);
  const templateIndex = Math.floor(random * PROJECT_TEMPLATES.length);
  const template = PROJECT_TEMPLATES[templateIndex];

  const project: MockProject = {
    id: projectId,
    workspaceId: workspaceId || "workspace_1",
    name: template.name,
    description: `Project description for ${template.name}`,
    color: template.color,
    icon: template.icon,
    ownerId: "user_1",
    createdAt: Date.now() - Math.floor(random * 60) * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  };

  mockStorage.projects.set(projectId, project);
  return project;
}

// Generate projects for a workspace
export function getMockProjectsByWorkspace(workspaceId: string, count: number = 5): MockProject[] {
  const projects: MockProject[] = [];

  for (let i = 1; i <= count; i++) {
    const projectId = `project_${workspaceId}_${i}`;
    const project = getMockProject(projectId, workspaceId);
    projects.push(project);
  }

  return projects;
}

// Generate or get task
export function getMockTask(taskId: string, projectId?: string): MockTask {
  if (mockStorage.tasks.has(taskId)) {
    return mockStorage.tasks.get(taskId)!;
  }

  const random = seededRandom(taskId);
  const templateIndex = Math.floor(random * TASK_TEMPLATES.length);

  // Determine status based on random
  let status: MockTask["status"] = "todo";
  if (random > 0.7) status = "completed";
  else if (random > 0.4) status = "in_progress";

  // Determine priority
  let priority: MockTask["priority"] = "medium";
  if (random > 0.85) priority = "urgent";
  else if (random > 0.6) priority = "high";
  else if (random < 0.3) priority = "low";

  // Assign to random user
  const assigneeId = random > 0.2 ? `user_${Math.floor(random * USER_TEMPLATES.length) + 1}` : null;

  // Due date (some tasks have it, some don't)
  const dueDate = random > 0.4
    ? Date.now() + Math.floor((random - 0.5) * 30) * 24 * 60 * 60 * 1000
    : null;

  const task: MockTask = {
    id: taskId,
    projectId: projectId || "project_workspace_1_1",
    workspaceId: "workspace_1",
    title: TASK_TEMPLATES[templateIndex],
    description: random > 0.5 ? `Detailed description for ${TASK_TEMPLATES[templateIndex]}` : null,
    status,
    priority,
    assigneeId,
    createdById: "user_1",
    dueDate,
    completedAt: status === "completed" ? Date.now() - Math.floor(random * 7) * 24 * 60 * 60 * 1000 : null,
    position: Math.floor(random * 1000),
    createdAt: Date.now() - Math.floor(random * 30) * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  };

  mockStorage.tasks.set(taskId, task);
  return task;
}

// Generate tasks for a project
export function getMockTasksByProject(
  projectId: string,
  filter?: { status?: string; assigneeId?: string },
  count: number = 15
): MockTask[] {
  const tasks: MockTask[] = [];

  for (let i = 1; i <= count; i++) {
    const taskId = `task_${projectId}_${i}`;
    const task = getMockTask(taskId, projectId);
    tasks.push(task);
  }

  // Apply filters
  let filteredTasks = tasks;

  if (filter?.status) {
    filteredTasks = filteredTasks.filter((t) => t.status === filter.status);
  }

  if (filter?.assigneeId) {
    filteredTasks = filteredTasks.filter((t) => t.assigneeId === filter.assigneeId);
  }

  return filteredTasks;
}

// Generate comments for a task
export function getMockCommentsByTask(taskId: string, count: number = 3): MockComment[] {
  const comments: MockComment[] = [];

  for (let i = 1; i <= count; i++) {
    const commentId = `comment_${taskId}_${i}`;

    if (mockStorage.comments.has(commentId)) {
      comments.push(mockStorage.comments.get(commentId)!);
      continue;
    }

    const random = seededRandom(commentId);
    const userId = `user_${Math.floor(random * USER_TEMPLATES.length) + 1}`;

    const commentTexts = [
      "Great progress on this! Let me know if you need any help.",
      "I've reviewed the changes and they look good to me.",
      "Can we discuss this in the next team meeting?",
      "Updated the timeline based on our conversation.",
      "This is blocked by another task. Will update when ready.",
    ];

    const comment: MockComment = {
      id: commentId,
      taskId,
      userId,
      content: commentTexts[Math.floor(random * commentTexts.length)],
      createdAt: Date.now() - Math.floor(random * 10) * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    };

    mockStorage.comments.set(commentId, comment);
    comments.push(comment);
  }

  return comments;
}

// Update task in mock storage
export function updateMockTask(taskId: string, updates: Partial<MockTask>): MockTask {
  const task = mockStorage.tasks.get(taskId);

  if (!task) {
    // Create new task if it doesn't exist
    const newTask = getMockTask(taskId, updates.projectId);
    const updatedTask = { ...newTask, ...updates, updatedAt: Date.now() };
    mockStorage.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  const updatedTask = { ...task, ...updates, updatedAt: Date.now() };
  mockStorage.tasks.set(taskId, updatedTask);
  return updatedTask;
}

// Create new task
export function createMockTask(data: Partial<MockTask>): MockTask {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const task: MockTask = {
    id: taskId,
    projectId: data.projectId || "project_workspace_1_1",
    workspaceId: data.workspaceId || "workspace_1",
    title: data.title || "New Task",
    description: data.description || null,
    status: data.status || "todo",
    priority: data.priority || "medium",
    assigneeId: data.assigneeId || null,
    createdById: data.createdById || "user_1",
    dueDate: data.dueDate || null,
    completedAt: data.completedAt || null,
    position: data.position || Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  mockStorage.tasks.set(taskId, task);
  return task;
}

// Delete task
export function deleteMockTask(taskId: string): boolean {
  return mockStorage.tasks.delete(taskId);
}

// Create new project
export function createMockProject(data: Partial<MockProject>): MockProject {
  const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const project: MockProject = {
    id: projectId,
    workspaceId: data.workspaceId || "workspace_1",
    name: data.name || "New Project",
    description: data.description || null,
    color: data.color || "#FC636B",
    icon: data.icon || "📁",
    ownerId: data.ownerId || "user_1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  mockStorage.projects.set(projectId, project);
  return project;
}

// Initialize mock data on module load
initializeMockUsers();
getDefaultWorkspaces();
getMockProjectsByWorkspace("workspace_1", 8);
getMockProjectsByWorkspace("workspace_2", 5);
