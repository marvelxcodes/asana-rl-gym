# Data Management & Testing Guide

## ✅ What's Been Completed

### 1. Database Schema Created
- **File**: `packages/db/src/schema/notification.ts`
- **Table**: `notification` with fields:
  - `id`, `workspaceId`, `userId`, `taskId`
  - `type`: task_assigned, task_completed, task_comment, task_mentioned, task_due_soon, project_update
  - `actorId`, `message`
  - `isRead`, `isBookmarked`, `isArchived`
  - `createdAt`

### 2. tRPC API Router Created
- **File**: `packages/api/src/routers/notification.ts`
- **Endpoints**:
  - `notification.getByWorkspace` - Get all notifications
  - `notification.toggleBookmark` - Bookmark/unbookmark
  - `notification.archive` - Archive single notification
  - `notification.archiveAll` - Archive all notifications
  - `notification.markAsRead` - Mark as read

### 3. Inbox Page Updated
- **File**: `apps/web/src/app/(asana)/0/[workspaceId]/inbox/[inboxId]/page.tsx`
- Now uses **database instead of hardcoded data**
- All interactions (bookmark, archive) are real database operations
- Time-based grouping (Today/Yesterday/Earlier) works dynamically

---

## 📝 How to Add/Modify Notification Data

### Method 1: Using Database Studio (Recommended)

1. **Start database studio**:
   ```bash
   bun run db:studio
   ```

2. **Add notifications manually**:
   - Open the browser at the URL shown
   - Navigate to `notification` table
   - Click "Add Row"
   - Fill in the fields:
     - `workspaceId`: `"1132775624246007"`
     - `userId`: `"current-user"`
     - `type`: Choose from: `task_assigned`, `task_completed`, etc.
     - `message`: Your notification message
     - `createdAt`: Timestamp (use `Date.now()` in console)

### Method 2: Using SQL Directly

Create a file `apps/web/scripts/seed-data.sql`:

```sql
INSERT INTO notification (id, workspace_id, user_id, type, message, created_at, is_read, is_bookmarked, is_archived)
VALUES
  ('notif-1', '1132775624246007', 'current-user', 'task_completed', 'completed this task', strftime('%s', 'now') * 1000 - 7200000, 0, 0, 0),
  ('notif-2', '1132775624246007', 'current-user', 'task_assigned', 'assigned this task to you', strftime('%s', 'now') * 1000 - 14400000, 0, 0, 0),
  ('notif-3', '1132775624246007', 'current-user', 'task_comment', 'commented: Great work!', strftime('%s', 'now') * 1000 - 86400000, 0, 0, 0);
```

Then execute with:
```bash
sqlite3 apps/web/local.db < apps/web/scripts/seed-data.sql
```

### Method 3: Quick Testing (Add in Browser Console)

Visit `http://localhost:3001/0/1132775624246007/inbox/inbox-123` and run:

```javascript
// This would normally go through the API
fetch('/api/trpc/notification.create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: '1132775624246007',
    userId: 'current-user',
    type: 'task_completed',
    message: 'completed this task',
    createdAt: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
  })
})
```

---

## 🎯 Remaining Work: Exact Asana Interactions

### 1. Create Project Modal/Workflow

From exploring https://app.asana.com, clicking "Create project" opens:
- **URL**: `/create-project` route
- **Modal**: "Workflow gallery" dialog
- **Tabs**: For you | My organization | Marketing | Operations & PMO | Productivity | More
- **Templates**: Content calendar, Project timeline, Bug tracking, etc.
- **Buttons**: "Import" and "Blank project" in header

**Files to create**:
```
apps/web/src/app/(asana)/0/[workspaceId]/create-project/page.tsx
apps/web/src/components/asana-workflow-gallery.tsx
```

**Implementation**:
```tsx
// apps/web/src/components/asana-workflow-gallery.tsx
export function AsanaWorkflowGallery({ onClose }) {
  const [activeTab, setActiveTab] = useState("for-you");

  const templates = [
    {
      name: "Content calendar",
      description: "Plan content, organize assets...",
      category: "Marketing",
      viewType: "calendar"
    },
    // ... more templates
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <header className="border-b p-4">
        <h2>Workflow gallery</h2>
        <div className="flex gap-2">
          <button>Import</button>
          <button>Blank project</button>
          <button onClick={onClose}>×</button>
        </div>
      </header>

      <div className="flex gap-4 p-4">
        {/* Tabs */}
        <button onClick={() => setActiveTab("for-you")}>For you</button>
        {/* ... */}
      </div>

      <div className="grid grid-cols-3 gap-4 p-4">
        {templates.map(template => (
          <TemplateCard key={template.name} {...template} />
        ))}
      </div>
    </div>
  );
}
```

### 2. Tooltips

Asana uses simple tooltips on hover. Add this component:

```tsx
// apps/web/src/components/asana-tooltip.tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function AsanaTooltip({ children, content }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          className="rounded bg-gray-900 px-2 py-1 text-xs text-white"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
```

Usage:
```tsx
<AsanaTooltip content="Create a new task">
  <button>+</button>
</AsanaTooltip>
```

### 3. Other Button Interactions

From real Asana inspection:

- **"New project"** button in sidebar → Opens workflow gallery
- **"Create" button** (top left) → Dropdown menu with Task/Project/Portfolio options
- **Filter button** → Dropdown with filter options
- **Sort button** → Dropdown with sort options
- **Due date** button on tasks → Date picker modal
- **Collaborators** button → Add collaborators modal

---

## 🎨 Asana UI Patterns

### Button Styles

```tsx
// Primary button (orange)
<button className="bg-[#F0A344] text-white hover:bg-[#E09334] px-4 py-2 rounded">
  Try for free
</button>

// Secondary button
<button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded">
  Cancel
</button>

// Icon button
<button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
  <MoreVertical className="h-4 w-4" />
</button>
```

### Modal Pattern

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
  <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
    {/* Content */}
  </div>
</div>
```

### Dropdown Pattern

```tsx
<Popover>
  <PopoverTrigger>
    <button>Filter ▼</button>
  </PopoverTrigger>
  <PopoverContent className="w-56 rounded-lg bg-white shadow-lg">
    <div className="p-2">
      {/* Dropdown items */}
    </div>
  </PopoverContent>
</Popover>
```

---

## 🧪 Testing Your Changes

### 1. Test Inbox with Database

1. Add notifications using Method 1 or 2 above
2. Visit: `http://localhost:3001/0/1132775624246007/inbox/inbox-123`
3. Test:
   - Click bookmark icon → Should toggle in database
   - Click archive → Should remove from activity feed
   - Switch to "Bookmarks" tab → See bookmarked items
   - Click "Archive all" → All should move to archive

### 2. Test Navigation

1. Click "Home" in sidebar → Should navigate to Home page
2. Click "Inbox" → Should show inbox with your data
3. Click "Goals" → Should show upsell modal
4. Click "Reporting" → Should show upsell modal
5. Click "Portfolios" → Should show upsell modal

---

## 📊 Current Status

| Component | Status | Database | Notes |
|-----------|--------|----------|-------|
| Home Page | ✅ Complete | Uses `task` table | Shows tasks from DB |
| Inbox Page | ✅ Complete | Uses `notification` table | All interactions work |
| Goals Page | ✅ Complete | Static | Upsell modal |
| Reporting | ✅ Complete | Static | Upsell modal |
| Portfolios | ✅ Complete | Static | Upsell modal |
| Project Creation | ❌ TODO | N/A | Need workflow gallery |
| Tooltips | ❌ TODO | N/A | Need tooltip component |
| Dropdowns | ❌ TODO | N/A | Filter, Sort, etc. |

---

## 🚀 Quick Start for Testing

```bash
# 1. Make sure dev server is running
bun run dev:web

# 2. Open database studio to add data
bun run db:studio

# 3. Add some notifications in the studio

# 4. Visit inbox to see your data
open http://localhost:3001/0/1132775624246007/inbox/inbox-123

# 5. Test interactions (bookmark, archive, etc.)
```

---

## 📝 Next Steps

1. **Create Project Workflow Gallery** - Priority 1
   - Implement `/create-project` route
   - Create workflow gallery component
   - Add project templates

2. **Add Tooltips** - Priority 2
   - Install/configure Radix UI Tooltip
   - Add tooltips to all icon buttons

3. **Implement Dropdowns** - Priority 3
   - Filter dropdown
   - Sort dropdown
   - Create button dropdown

4. **Modal Interactions** - Priority 4
   - Date picker for due dates
   - Collaborators modal
   - Task detail modal (already exists)

---

**Last Updated**: November 3, 2025
**Status**: Database integration complete, interactions pending
