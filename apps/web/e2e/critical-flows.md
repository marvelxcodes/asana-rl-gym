# E2E Tests for Critical User Flows

This document outlines the E2E tests that should be run using the Playwright MCP tool.

## Prerequisites

- Development server running on `http://localhost:3001`
- Playwright MCP tools available

## Critical User Flows to Test

### 1. Homepage Navigation Flow
**Purpose**: Verify users can navigate to the home page and see all key elements

**Steps**:
1. Navigate to `http://localhost:3001`
2. Wait for redirect to `/0/1132775624246007/home`
3. Verify top navigation bar is visible
4. Verify sidebar is visible with all navigation items
5. Verify "My tasks" widget is visible
6. Verify "Projects" widget is visible
7. Take screenshot for visual regression

**Expected Results**:
- Page loads within 200ms
- All widgets render correctly
- Navigation elements are interactive

### 2. Navigation Between Pages
**Purpose**: Ensure smooth navigation between different sections

**Steps**:
1. Start at home page
2. Click "My tasks" link
3. Verify URL changes to project view
4. Click "Inbox" link
5. Verify URL changes to inbox view
6. Click "Goals" link
7. Verify URL changes to goals view
8. Click "Home" link
9. Verify returns to home page

**Expected Results**:
- Each navigation takes < 200ms
- URL updates correctly
- Page content changes appropriately
- No console errors

### 3. Sidebar Toggle Flow
**Purpose**: Test sidebar collapse/expand functionality

**Steps**:
1. Navigate to home page
2. Click hamburger menu in top nav
3. Verify sidebar is hidden
4. Click hamburger menu again
5. Verify sidebar is visible
6. Verify content adjusts to sidebar changes

**Expected Results**:
- Transition is smooth (200ms)
- Layout reflows correctly
- No visual glitches

### 4. Section Collapse/Expand
**Purpose**: Test collapsible sections in sidebar

**Steps**:
1. Navigate to home page
2. Click "Insights" section toggle
3. Verify Insights items collapse with animation
4. Click "Projects" section toggle
5. Verify Projects section collapses
6. Re-expand both sections
7. Verify items reappear with animation

**Expected Results**:
- Animations are smooth (200ms)
- State persists during session
- No layout shift issues

### 5. Search Functionality
**Purpose**: Test search input interaction

**Steps**:
1. Navigate to home page
2. Click search input in top nav
3. Verify input receives focus
4. Type search query
5. Verify keyboard shortcut (Ctrl+K) indicator is visible

**Expected Results**:
- Focus transition is smooth
- Input is responsive
- Visual feedback on focus

### 6. Create Menu Flow
**Purpose**: Test create button dropdown menu

**Steps**:
1. Navigate to home page
2. Click "Create" button in top nav
3. Verify dropdown menu appears
4. Verify all menu items are present (Task, Project, Message, Portfolio, Goal)
5. Click outside menu
6. Verify menu closes

**Expected Results**:
- Menu opens smoothly (< 200ms)
- All items are clickable
- Menu closes on outside click

### 7. Widget Interaction
**Purpose**: Test task widget functionality

**Steps**:
1. Navigate to home page
2. Click on "Upcoming" tab in My tasks widget
3. Verify tasks are displayed
4. Click on "Overdue" tab
5. Verify content updates
6. Click on "Completed" tab
7. Verify completed tasks are shown
8. Click "Create task" button
9. Verify task creation modal/input appears

**Expected Results**:
- Tab switching is instant (< 200ms)
- Content updates without page reload
- Visual feedback on active tab

### 8. Performance Metrics
**Purpose**: Measure and verify performance targets

**Metrics to capture**:
- Page load time (target: < 200ms Time to Interactive)
- Navigation transition time (target: < 200ms)
- Widget hover response (target: < 100ms)
- Animation frame rate (target: 60fps)

**Tools**:
- Browser DevTools Performance tab
- Lighthouse CI
- Custom performance markers

## Running E2E Tests

### Using Playwright MCP Tools

```typescript
// Example test execution using MCP tools
await browser_navigate({ url: 'http://localhost:3001' });
await browser_wait_for({ time: 2 });
await browser_snapshot();
await browser_click({ element: 'My tasks link', ref: 'nav-my-tasks' });
await browser_take_screenshot({ filename: 'my-tasks-page.png' });
```

## Visual Regression Testing

1. Capture baseline screenshots for all pages
2. Store in `.playwright-mcp/` directory
3. Compare new screenshots against baselines
4. Verify pixel difference < 1%

## Test Coverage Goals

- ✅ Unit tests: 29 tests covering components
- ✅ Integration tests: 6 tests covering navigation flows
- 🎯 E2E tests: 8 critical user flows (to be automated)
- 🎯 Visual regression: All major pages
- 🎯 Performance tests: All transitions

## Acceptance Criteria

- All tests pass without errors
- Page load < 200ms
- Navigation transitions < 200ms
- Animations run at 60fps
- Pixel difference < 1% from baseline
- Zero console errors in production
