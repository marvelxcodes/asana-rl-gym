# Asana Sidebar Pages Implementation Guide

## 🎯 Goal: Complete all sidebar pages with pixel-perfect accuracy for RL Training Gym

**Status**: Sidebar navigation updated ✅, Pages need implementation
**Date**: November 3, 2025

---

## ✅ Completed Work

### 1. **Updated Sidebar Navigation**
**File**: `apps/web/src/components/asana-sidebar.tsx`

Updated to use Next.js Link components with proper Asana-style routes:

```tsx
const navItems = [
  { icon: Home, label: "Home", href: `/0/${workspaceId}/home` },
  { icon: LayoutGrid, label: "My tasks", href: `/0/${workspaceId}/project/${projectId}/list/view-123` },
  { icon: Inbox, label: "Inbox", href: `/0/${workspaceId}/inbox/inbox-123` },
];

const insightItems = [
  { icon: FolderKanban, label: "Reporting", href: `/0/reporting/${workspaceId}` },
  { icon: FolderKanban, label: "Portfolios", href: `/0/portfolios/${workspaceId}` },
  { icon: Target, label: "Goals", href: `/0/${workspaceId}/goals` },
];
```

All navigation now uses `<Link>` components for proper client-side routing.

---

## 📋 Pages to Implement

### Page 1: **Home** (`/0/{workspaceId}/home`)

#### Real Asana Structure:
```
/0/1132775624246007/home
```

#### Screenshot Reference:
`.playwright-mcp/asana-home-page.png`

####Layout Components:
1. **Header Section**:
   - Date display: "Monday, November 3"
   - Greeting: "Good morning, {userName}"
   - Stats bar: "My week ▼ | 0 tasks completed | 0 collaborators | Customize"

2. **My Tasks Widget** (Card #1):
   - Avatar with user initials
   - "My tasks" heading with link icon
   - Tabs: Upcoming | Overdue | Completed
   - Task list with checkboxes
   - "+ Create task" button
   - "Show more" link

3. **Projects Widget** (Card #2):
   - "Projects" heading
   - "Recents ▼" dropdown
   - "+ Create project" button with dashed border
   - Empty state message

4. **Customization Footer**:
   - Dismiss (X) button
   - "Drag and drop new widgets" message
   - "Customize" button

#### Route Structure:
```
/apps/web/src/app/(asana)/0/[workspaceId]/home/page.tsx
```

#### Implementation Notes:
- Use card/widget layout system
- Fetch tasks from tRPC `task.getByProject`
- Tab state management for Upcoming/Overdue/Completed
- Drag-and-drop widget customization (can be placeholder initially)

---

### Page 2: **Inbox** (`/0/{workspaceId}/inbox/{inboxId}`)

#### Real Asana Structure:
```
/0/1132775624246007/inbox/1208599472376928
```

#### Screenshot Reference:
`.playwright-mcp/asana-inbox-page.png`

#### Layout Components:
1. **Header**:
   - "Inbox" heading
   - "Manage notifications" button

2. **Tabs**:
   - Activity (selected)
   - Bookmarks
   - Archive
   - + Add tab

3. **Toolbar**:
   - "Filter" button
   - More actions (...)

4. **Activity Feed**:
   - Grouped by time ("Earlier", "Today", etc.)
   - Each notification:
     - Task/project icon
     - Task/project title
     - User avatar
     - User name + timestamp
     - Message content
     - "See more" for long messages
     - React emoji buttons (👍 👀 🙌 +)
   - Bookmark star button (right side)
   - Archive button (right side)
   - "Archive all notifications" button (bottom)

5. **Promotional Card** (bottom):
   - "Don't miss important notifications"
   - "Get task and comment updates in Slack or Microsoft Teams"
   - "Connect Slack" button
   - "Connect Teams" button
   - Dismiss (X) button

#### Route Structure:
```
/apps/web/src/app/(asana)/0/[workspaceId]/inbox/[inboxId]/page.tsx
```

#### Implementation Notes:
- Use activity feed with mock notifications
- Tab switching (Activity/Bookmarks/Archive)
- Time-based grouping ("Earlier", "Today", "Yesterday")
- Bookmark/Archive functionality
- React emoji toolbar

---

### Page 3: **Goals** (`/0/{workspaceId}/goals`)

#### Real Asana Structure:
```
/0/1132775624246007/goals
```

#### Screenshot Reference:
`.playwright-mcp/asana-goals-page.png`

#### Layout Components:
1. **Header**:
   - Goals icon (red circle with target)
   - "Goals" heading
   - Navigation tabs: Strategy map | Company goals | Team goals | My goals

2. **Upsell Modal** (center overlay):
   - White card with shadow
   - Heading: "Track progress on key initiatives"
   - Description: "Set goals for your company, your team, or yourself. Connect each goal to the work that supports it so you can track progress automatically."
   - "Learn more" link
   - "Try for free" button (orange)

3. **Background Preview** (blurred):
   - Strategy map with goal cards
   - Connected lines between goals
   - Project/Task cards at bottom

#### Route Structure:
```
/apps/web/src/app/(asana)/0/[workspaceId]/goals/page.tsx
```

#### Implementation Notes:
- Simple page with modal overlay
- Blurred background (can use placeholder image)
- Modal centered with `fixed inset-0` backdrop
- "Try for free" button (can be placeholder or link to upsell)

---

### Page 4: **Reporting** (`/0/reporting/{workspaceId}`)

#### Real Asana Structure:
```
/0/reporting/1208599472376928
```

#### Screenshot Reference:
`.playwright-mcp/asana-reporting-page.png`

#### Layout Components:
1. **Breadcrumb**:
   - "Reporting" link

2. **Header**:
   - Chart icon (red)
   - "My dashboard" heading

3. **Upsell Modal** (center overlay):
   - White card with shadow
   - Heading: "Uncover the state of your team's work"
   - Description: "Generate real-time reports with customizable charts. Start a free trial to unlock it now."
   - "Learn more" link
   - "Try for free" button (orange)

4. **Background Preview** (blurred):
   - 4 chart previews:
     - "Incomplete tasks by project" (bar chart)
     - "Tasks by completion status" (bar chart)
     - "Upcoming tasks by assignee" (scatter plot)
     - "Projects by project status" (donut chart)

#### Route Structure:
```
/apps/web/src/app/(asana)/0/reporting/[workspaceId]/page.tsx
```

#### Implementation Notes:
- Similar to Goals page structure
- Modal overlay with upsell
- Background chart previews (can use placeholder images)

---

### Page 5: **Portfolios** (`/0/portfolios/{workspaceId}`)

#### Real Asana Structure:
```
/0/portfolios/1208599472376928
```

#### Screenshot Reference:
`.playwright-mcp/asana-portfolios-page.png`

#### Layout Components:
1. **Header**:
   - Portfolio icon (red folder)
   - "My portfolio" heading

2. **Tabs**:
   - List | Timeline | Dashboard | Progress | Workload | Messages

3. **Upsell Modal** (center overlay):
   - White card with shadow
   - Heading: "Monitor connected projects in real time"
   - Description: "Add projects to a portfolio to see progress at a glance. See which ones are on track and which ones need your attention."
   - "Learn more" link
   - "Try for free" button (orange)

4. **Background Preview** (blurred):
   - Table with columns: Name | Status | Task progress | Owner
   - Multiple project rows with colored icons

#### Route Structure:
```
/apps/web/src/app/(asana)/0/portfolios/[workspaceId]/page.tsx
```

#### Implementation Notes:
- Similar to Goals/Reporting structure
- Modal overlay with upsell
- Background table preview

---

## 🧩 Shared Components to Create

### 1. **Upsell Modal Component**
**File**: `apps/web/src/components/asana-upsell-modal.tsx`

```tsx
type AsanaUpsellModalProps = {
  title: string;
  description: string;
  learnMoreUrl?: string;
  backgroundImage?: string;
};

export function AsanaUpsellModal({
  title,
  description,
  learnMoreUrl,
  backgroundImage,
}: AsanaUpsellModalProps) {
  return (
    <div className="relative h-full">
      {/* Blurred Background */}
      {backgroundImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={backgroundImage}
            className="h-full w-full object-cover blur-sm opacity-50"
            alt="Preview"
          />
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
          <h4 className="mb-4 text-xl font-semibold text-gray-900">
            {title}
          </h4>
          <p className="mb-4 text-gray-600">
            {description}
            {learnMoreUrl && (
              <>
                {" "}
                <a href={learnMoreUrl} className="text-blue-600 hover:underline">
                  Learn more
                </a>
              </>
            )}
          </p>
          <button className="inline-flex items-center gap-2 rounded bg-[#F0A344] px-4 py-2 text-sm font-medium text-white hover:bg-[#E09334]">
            <span>🔓</span>
            Try for free
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. **Widget Card Component**
**File**: `apps/web/src/components/asana-widget-card.tsx`

```tsx
type AsanaWidgetCardProps = {
  title?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AsanaWidgetCard({
  title,
  headerActions,
  children,
  className = "",
}: AsanaWidgetCardProps) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
          {headerActions}
        </div>
      )}
      {children}
    </div>
  );
}
```

---

## 📐 Exact Styling Reference

### Colors (from Real Asana):
```css
/* Backgrounds */
--bg-page: #F6F7F8;
--bg-card: #FFFFFF;
--bg-hover: #FAFAFA;

/* Text */
--text-primary: #1E1F21;
--text-secondary: #626C76;
--text-muted: #9CA3AF;

/* Borders */
--border-default: #EDEAE9;

/* Buttons */
--orange-primary: #F0A344;
--orange-hover: #E09334;
```

### Typography:
```css
/* Headings */
--h1: 24px/32px, font-weight: 600
--h2: 20px/28px, font-weight: 600
--h3: 18px/24px, font-weight: 600
--h4: 16px/24px, font-weight: 600

/* Body */
--text-base: 14px/20px, font-weight: 400
--text-sm: 13px/20px, font-weight: 400
```

---

## 🗂️ Route Directory Structure

```
apps/web/src/app/(asana)/
├── 0/
│   ├── [workspaceId]/
│   │   ├── home/
│   │   │   └── page.tsx          # Home page
│   │   ├── inbox/
│   │   │   └── [inboxId]/
│   │   │       └── page.tsx      # Inbox page
│   │   ├── goals/
│   │   │   └── page.tsx          # Goals page (upsell)
│   │   └── project/
│   │       └── [projectId]/
│   │           └── [viewType]/
│   │               └── [viewId]/
│   │                   └── page.tsx  # Project page (already exists)
│   ├── reporting/
│   │   └── [workspaceId]/
│   │       └── page.tsx          # Reporting page (upsell)
│   └── portfolios/
│       └── [workspaceId]/
│           └── page.tsx          # Portfolios page (upsell)
└── layout.tsx
```

---

## ✅ Implementation Checklist

### Phase 1: Premium Pages (Quick Wins)
- [ ] Create `AsanaUpsellModal` component
- [ ] Create Goals page with upsell modal
- [ ] Create Reporting page with upsell modal
- [ ] Create Portfolios page with upsell modal

### Phase 2: Home Page
- [ ] Create `AsanaWidgetCard` component
- [ ] Create Home page layout
- [ ] Implement My Tasks widget
- [ ] Implement Projects widget
- [ ] Add customization footer

### Phase 3: Inbox Page
- [ ] Create Inbox page layout
- [ ] Implement tab navigation
- [ ] Create activity feed component
- [ ] Add notification items
- [ ] Implement filter toolbar
- [ ] Add promotional card

### Phase 4: Polish
- [ ] Test all routes
- [ ] Verify pixel-perfect accuracy
- [ ] Add loading states
- [ ] Test navigation flow

---

## 🎯 For RL Training Gym

### Critical for RL:
1. **Exact URL patterns** - ✅ Implemented
2. **Pixel-perfect UI** - Requires implementation
3. **Consistent navigation** - ✅ Sidebar updated
4. **Proper state management** - Needs implementation

### RL Agent Tasks:
- Navigate between all sidebar pages
- Interact with My Tasks widget (check/uncheck tasks)
- Create new tasks from Home page
- Read inbox notifications
- Click on upsell buttons
- Navigate back to My Tasks project view

---

## 📸 Screenshots Captured

All reference screenshots saved in `.playwright-mcp/`:
- `asana-home-page.png` - Home page with widgets
- `asana-inbox-page.png` - Inbox activity feed
- `asana-goals-page.png` - Goals upsell modal
- `asana-reporting-page.png` - Reporting upsell modal
- `asana-portfolios-page.png` - Portfolios upsell modal

---

## 🚀 Quick Start Implementation

### 1. Create Upsell Pages First (Easiest):

```bash
# Create routes
mkdir -p apps/web/src/app/\(asana\)/0/[workspaceId]/goals
mkdir -p apps/web/src/app/\(asana\)/0/reporting/[workspaceId]
mkdir -p apps/web/src/app/\(asana\)/0/portfolios/[workspaceId]

# Create upsell modal component
# Copy template from this doc

# Create each page with modal
# Use template from this doc
```

### 2. Then Implement Home Page:

```bash
# Create route
mkdir -p apps/web/src/app/\(asana\)/0/[workspaceId]/home

# Create widget components
# Implement My Tasks widget
# Implement Projects widget
```

### 3. Finally Implement Inbox:

```bash
# Create route
mkdir -p apps/web/src/app/\(asana\)/0/[workspaceId]/inbox/[inboxId]

# Create activity feed component
# Add mock notifications
```

---

**Last Updated**: November 3, 2025
**Status**: Sidebar ✅ | Pages ⏳
**Next Step**: Create upsell modal component and premium pages
