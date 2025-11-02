# Asana Clone - Route Structure

This document describes the routing structure of the Asana clone application, matching the actual app.asana.com URL patterns.

## Route Structure Overview

The application uses Next.js 16 App Router with a route group `(asana)` to organize all Asana-related pages. All routes follow the pattern used by the actual Asana application.

## Main Routes

### Project View Route
```
/0/[workspaceId]/project/[projectId]/[viewType]/[viewId]
```

**Example:**
```
/0/1132775624246007/project/1208600145357627/list/1208600145390949
```

**Parameters:**
- `workspaceId`: Unique identifier for the workspace
- `projectId`: Unique identifier for the project
- `viewType`: Type of view (`list`, `board`, `calendar`, `files`)
- `viewId`: Unique identifier for the specific view configuration

**Features:**
- Filter tasks (all, incomplete, completed)
- Sort tasks (due date, alphabetical, assignee, likes)
- Group tasks (none, section, assignee, due date, project)
- Quick add task (keyboard shortcut: `Q`)
- Task detail panel
- View switching (List, Board, Calendar, Files)

### Home Route
```
/0/[workspaceId]/home
```

**Example:**
```
/0/1132775624246007/home
```

Displays the workspace home page with an overview of all projects and tasks.

### Inbox Route
```
/0/[workspaceId]/inbox/[inboxId]
```

**Example:**
```
/0/1132775624246007/inbox/1208599472376928
```

Shows inbox notifications and updates for the workspace.

### Goals Route
```
/0/[workspaceId]/goals
```

**Example:**
```
/0/1132775624246007/goals
```

Displays goals and objectives for the workspace.

### Reporting Route
```
/0/reporting/[workspaceId]
```

**Example:**
```
/0/reporting/1208599472376928
```

Shows reporting and analytics for the workspace.

### Portfolios Route
```
/0/portfolios/[workspaceId]
```

**Example:**
```
/0/portfolios/1208599472376928
```

Displays portfolio management for the workspace.

### Create Project Route
```
/0/[workspaceId]/create-project
```

**Example:**
```
/0/1132775624246007/create-project
```

Opens the workflow gallery modal for creating a new project from templates.

## Route Group

All Asana routes are organized under the `(asana)` route group located at:
```
src/app/(asana)/...
```

This route group allows:
- Shared layout across all Asana pages
- Isolated routing context
- Clean URL structure without the group name appearing in URLs

## Components Used

### Layout Components
- **AsanaLayout**: Main layout wrapper with header, sidebar, and content area
- **AsanaHeaderExact**: Top navigation bar with view tabs, filter/sort/group controls
- **AsanaSidebar**: Left sidebar with navigation and workspace switcher

### View Components
- **AsanaListViewExact**: List view with task rows
- **AsanaBoardView**: Kanban board view
- **AsanaCalendarView**: Calendar view with task scheduling
- **AsanaTimelineView**: Timeline/Gantt chart view

### Modal Components
- **AsanaShareModal**: Share project/task modal
- **AsanaCustomizePanel**: Customize view side panel
- **AsanaNewProjectModal**: Workflow gallery for creating projects
- **AsanaTaskDetailPanel**: Task detail side panel
- **AsanaQuickAddTask**: Quick add task modal (keyboard shortcut: Q)

## Keyboard Shortcuts

- **Q**: Open quick add task modal (when not in input/textarea)
- **Escape**: Close active panel or modal

## State Management

Each route page manages its own state for:
- Current view type (list, board, calendar, files)
- Selected task ID
- Task panel open/closed state
- Quick add modal state
- Filter settings (all, incomplete, completed)
- Sort settings (none, due date, alphabetical, assignee, likes)
- Group settings (none, section, assignee, due date, project)

## Navigation

Navigation between routes should use Next.js Link component or router.push():

```tsx
import Link from "next/link";

<Link href="/0/1132775624246007/project/demo-project/list/view-123">
  Go to Project
</Link>
```

Or programmatically:

```tsx
import { useRouter } from "next/navigation";

const router = useRouter();
router.push("/0/1132775624246007/home");
```

## Testing Routes

To test the routes during development, use the following URLs:

- **Project List View**: http://localhost:3001/0/1132775624246007/project/demo-project/list/view-123
- **Home**: http://localhost:3001/0/1132775624246007/home
- **Inbox**: http://localhost:3001/0/1132775624246007/inbox/inbox-123
- **Goals**: http://localhost:3001/0/1132775624246007/goals
- **Reporting**: http://localhost:3001/0/reporting/1132775624246007
- **Portfolios**: http://localhost:3001/0/portfolios/1132775624246007

## Future Enhancements

Potential future route additions:
- `/0/[workspaceId]/project/[projectId]/settings` - Project settings
- `/0/[workspaceId]/settings` - Workspace settings
- `/0/[workspaceId]/members` - Team member management
- `/0/[workspaceId]/search` - Global search results
