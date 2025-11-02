# Design Document

## Overview

The Asana Replica RL Gym system extends the existing Better-T-Stack monorepo to add Asana-like project management functionality while serving as a Reinforcement Learning environment. The system leverages the existing Next.js frontend, tRPC API layer, Drizzle ORM with SQLite, and Better Auth, adding new schemas and components for project management and a Python Gymnasium wrapper for RL agent interaction.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RL Agent      │    │   Next.js App    │    │   tRPC API      │
│   (Python)     │◄──►│   (React 19)     │◄──►│   (TypeScript)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐             │
         │              │   WebSockets    │◄────────────┘
         │              │   (Next.js API) │
         │              └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐
│   Selenium      │    │   SQLite DB      │
│   WebDriver     │    │   (Drizzle ORM)  │
└─────────────────┘    └──────────────────┘
```

### Technology Stack (Aligned with Existing Project)

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **API Layer**: tRPC for type-safe APIs
- **Database**: SQLite with Drizzle ORM (existing setup)
- **Authentication**: Better Auth (existing setup)
- **Real-time**: Next.js API routes with WebSockets
- **RL Interface**: Python Gymnasium wrapper with Selenium WebDriver
- **Build System**: Turborepo with Bun package manager
- **Deployment**: Docker containerization

## Components and Interfaces

### Frontend Components

#### Core Layout Components (Extending Existing Structure)
- **DashboardLayout**: Main application shell extending existing layout with sidebar
- **ProjectSidebar**: Project navigation, workspace switcher (new component)
- **ProjectHeader**: Breadcrumb navigation, view switcher (extends existing header)
- **ViewContainer**: Dynamic content area for different project views

#### Project Management Components (New)
- **WorkspaceSelector**: Dropdown for switching between workspaces
- **ProjectList**: Grid/list view of projects in workspace
- **ProjectDashboard**: Overview of project metrics and recent activity
- **TaskListView**: List view with hierarchical task display and filtering
- **KanbanBoardView**: Drag-and-drop board view with status columns
- **TimelineView**: Gantt chart view for project scheduling
- **CalendarView**: Calendar view for due dates and milestones

#### Task Components (New)
- **TaskCard**: Reusable task display component with stable data attributes
- **TaskDetailModal**: Modal for detailed task editing using existing modal patterns
- **TaskCreateForm**: Create/edit task form using @tanstack/react-form
- **TaskComments**: Comments section with real-time updates
- **TaskAssignee**: User assignment component with avatar display

#### RL-Specific Components (New)
- **AutomationWrapper**: HOC that adds stable data-testid attributes to components
- **StateObserver**: Component that exposes DOM state via data attributes
- **ActionTracker**: Records user/agent actions for reward calculation
- **RewardDisplay**: Debug component showing current reward state (dev mode only)

### tRPC API Structure (Extending Existing Pattern)

#### New tRPC Routers
```typescript
// packages/api/src/routers/workspace.ts
export const workspaceRouter = router({
  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),
  list: protectedProcedure
    .query(async ({ ctx }) => { /* implementation */ }),
  // ... other workspace operations
});

// packages/api/src/routers/project.ts
export const projectRouter = router({
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => { /* implementation */ }),
  // ... other project operations
});

// packages/api/src/routers/task.ts
export const taskRouter = router({
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => { /* implementation */ }),
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => { /* implementation */ }),
  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: taskStatusSchema }))
    .mutation(async ({ ctx, input }) => { /* implementation */ }),
  // ... other task operations
});
```

#### Main API Router (Updated)
```typescript
// packages/api/src/index.ts - Add new routers
export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  workspace: workspaceRouter,
  project: projectRouter,
  task: taskRouter,
});
```

#### Real-time Updates
- **WebSocket API Routes**: `/api/ws/project/[id]` for project-specific updates
- **Next.js API Routes**: Leverage existing API route structure
- **Real-time Events**: Task updates, project changes, user activity

### RL Environment Interface

#### Gymnasium Wrapper
```python
class AsanaReplicaEnv(gym.Env):
    def __init__(self, config: Dict[str, Any]):
        self.action_space = gym.spaces.Discrete(n_actions)
        self.observation_space = gym.spaces.Box(...)
        self.driver = webdriver.Chrome()
        self.reward_calculator = RewardCalculator(config)
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict]:
        # Execute action via Selenium
        # Capture new state
        # Calculate reward
        # Return observation, reward, done, info
    
    def reset(self) -> np.ndarray:
        # Reset environment to initial state
        # Return initial observation
    
    def render(self, mode: str = 'human'):
        # Capture screenshot or return DOM state
```

#### Action Space
- **Click Actions**: Click buttons, links, task cards
- **Navigation Actions**: Scroll, change views, navigate between projects
- **Input Actions**: Type text, select dropdowns, set dates
- **Drag Actions**: Drag tasks between status columns
- **Complex Actions**: Create tasks, assign users, set dependencies

#### Observation Space
- **Visual**: Screenshot-based observations (RGB arrays)
- **Structured**: DOM-based observations (task counts, status distributions)
- **Hybrid**: Combination of visual and structured data

## Data Models

### Core Entities

```typescript
interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

interface Project {
  id: string
  workspaceId: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'template'
  color: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
}

interface Task {
  id: string
  projectId: string
  name: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  dueDate?: Date
  dependencies: string[] // Task IDs
  tags: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  workspaces: string[] // Workspace IDs
  createdAt: Date
  lastActiveAt: Date
}

interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}
```

### Database Schema (Drizzle ORM - Extending Existing)

```typescript
// packages/db/src/schema/workspace.ts
export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// packages/db/src/schema/project.ts
export const project = sqliteTable("project", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull().references(() => workspace.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "archived", "template"] }).default("active"),
  color: text("color").default("#4A90E2"),
  ownerId: text("owner_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// packages/db/src/schema/task.ts
export const task = sqliteTable("task", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => project.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "completed"] }).default("todo"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  assigneeId: text("assignee_id").references(() => user.id),
  dueDate: integer("due_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// packages/db/src/schema/task-dependency.ts
export const taskDependency = sqliteTable("task_dependency", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").notNull().references(() => task.id),
  dependsOnTaskId: text("depends_on_task_id").notNull().references(() => task.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// packages/db/src/schema/comment.ts
export const comment = sqliteTable("comment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").notNull().references(() => task.id),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

## Error Handling

### Frontend Error Handling
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: Real-time form validation with user feedback
- **State Errors**: Error boundaries to prevent app crashes
- **RL Integration Errors**: Graceful degradation when automation fails

### Backend Error Handling
- **Database Errors**: Transaction rollback and error logging
- **Authentication Errors**: Proper HTTP status codes and error messages
- **Validation Errors**: Input sanitization and validation middleware
- **Real-time Errors**: Socket.io error handling and reconnection

### RL Environment Error Handling
- **WebDriver Errors**: Automatic browser restart and state recovery
- **Action Errors**: Invalid action handling with negative rewards
- **Observation Errors**: Fallback observation methods
- **Reward Calculation Errors**: Default reward values and error logging

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest and React Testing Library for component testing
- **Integration Tests**: Cypress for end-to-end user workflows
- **Visual Tests**: Screenshot comparison for UI consistency
- **Accessibility Tests**: axe-core for WCAG compliance

### Backend Testing
- **Unit Tests**: Jest for service and utility function testing
- **API Tests**: Supertest for endpoint testing
- **Database Tests**: In-memory SQLite for isolated testing
- **Real-time Tests**: Socket.io client testing for event handling

### RL Environment Testing
- **Environment Tests**: Gymnasium environment validation
- **Action Tests**: Selenium action execution verification
- **Reward Tests**: Reward calculation accuracy testing
- **Performance Tests**: Training episode timing and memory usage

### Automation-Specific Testing
- **Selector Stability**: Automated tests to verify CSS selector consistency
- **Action Reliability**: Tests for drag-and-drop and complex interactions
- **State Capture**: Validation of observation space accuracy
- **Reward Consistency**: Tests for reward calculation determinism

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy loading for different views and components
- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Scrolling**: For large task lists and project views
- **Image Optimization**: Lazy loading and responsive images

### Backend Optimization
- **Database Indexing**: Proper indexes for query performance
- **Caching**: In-memory caching for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Rate Limiting**: API rate limiting to prevent abuse

### RL Environment Optimization
- **Browser Management**: Headless mode for faster training
- **Observation Caching**: Cache DOM state between similar actions
- **Action Batching**: Batch multiple actions for efficiency
- **Parallel Training**: Support for multiple environment instances