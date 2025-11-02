"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Automation wrapper component that adds stable data attributes for RL agent interaction
 * This component ensures consistent and reliable element identification for automation
 */

export interface AutomationWrapperProps {
  children: React.ReactNode;
  testId: string;
  role?: string;
  action?: string;
  state?: string;
  metadata?: Record<string, string | number | boolean>;
  className?: string;
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
}

export function AutomationWrapper({
  children,
  testId,
  role,
  action,
  state,
  metadata = {},
  className,
  onClick,
  onHover,
  disabled = false,
}: AutomationWrapperProps) {
  // Generate automation attributes
  const automationAttributes: Record<string, string> = {
    "data-testid": testId,
    "data-automation-role": role || "element",
    "data-automation-action": action || "interact",
    "data-automation-state": state || "default",
    "data-automation-disabled": disabled.toString(),
  };

  // Add metadata as data attributes
  Object.entries(metadata).forEach(([key, value]) => {
    automationAttributes[`data-automation-${key}`] = value.toString();
  });

  // Add interaction tracking
  const handleClick = () => {
    if (!disabled && onClick) {
      // Track interaction for reward calculation
      window.dispatchEvent(
        new CustomEvent("automation-interaction", {
          detail: {
            testId,
            action: "click",
            timestamp: Date.now(),
            metadata,
          },
        })
      );
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (!disabled && onHover) {
      window.dispatchEvent(
        new CustomEvent("automation-interaction", {
          detail: {
            testId,
            action: "hover",
            timestamp: Date.now(),
            metadata,
          },
        })
      );
      onHover();
    }
  };

  return (
    <div
      {...automationAttributes}
      className={cn(
        "automation-wrapper",
        disabled && "automation-disabled",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </div>
  );
}

/**
 * Higher-order component that wraps any component with automation attributes
 */
export function withAutomation<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  defaultTestId?: string
) {
  return React.forwardRef<any, T & Partial<AutomationWrapperProps>>(
    function AutomatedComponent(
      { testId = defaultTestId, role, action, state, metadata, ...props },
      ref
    ) {
      if (!testId) {
        // If no testId provided, render component without wrapper
        return <Component {...(props as unknown as T)} ref={ref} />;
      }

      return (
        <AutomationWrapper
          action={action}
          metadata={metadata}
          role={role}
          state={state}
          testId={testId}
        >
          <Component {...(props as unknown as T)} ref={ref} />
        </AutomationWrapper>
      );
    }
  );
}

/**
 * Hook for generating consistent test IDs
 */
export function useAutomationId(
  baseId: string,
  suffix?: string | number
): string {
  return suffix ? `${baseId}-${suffix}` : baseId;
}

/**
 * Utility for generating automation-friendly CSS selectors
 */
export const AutomationSelectors = {
  // Task-related selectors
  task: {
    card: (taskId: string) => `[data-testid="task-card-${taskId}"]`,
    title: (taskId: string) => `[data-testid="task-title-${taskId}"]`,
    status: (taskId: string) => `[data-testid="task-status-${taskId}"]`,
    priority: (taskId: string) => `[data-testid="task-priority-${taskId}"]`,
    checkbox: (taskId: string) => `[data-testid="task-checkbox-${taskId}"]`,
    assignee: (taskId: string) => `[data-testid="task-assignee-${taskId}"]`,
    dueDate: (taskId: string) => `[data-testid="task-due-date-${taskId}"]`,
    tags: (taskId: string) => `[data-testid="task-tags-${taskId}"]`,
    dependencies: (taskId: string) =>
      `[data-testid="task-dependencies-${taskId}"]`,
  },

  // Project-related selectors
  project: {
    card: (projectId: string) => `[data-testid="project-card-${projectId}"]`,
    menu: (projectId: string) => `[data-testid="project-menu-${projectId}"]`,
    edit: (projectId: string) => `[data-testid="edit-project-${projectId}"]`,
    archive: (projectId: string) =>
      `[data-testid="archive-project-${projectId}"]`,
  },

  // Workspace-related selectors
  workspace: {
    selector: () => `[data-testid="workspace-selector-trigger"]`,
    option: (workspaceId: string) =>
      `[data-testid="workspace-option-${workspaceId}"]`,
    create: () => `[data-testid="create-workspace-trigger"]`,
  },

  // View-related selectors
  view: {
    kanbanBoard: () => `[data-testid="kanban-board-view"]`,
    taskList: () => `[data-testid="task-list-view"]`,
    column: (status: string) => `[data-testid="kanban-column-${status}"]`,
    emptyColumn: (status: string) => `[data-testid="empty-column-${status}"]`,
  },

  // Navigation selectors
  navigation: {
    sidebar: () => `[data-testid="project-sidebar"]`,
    sidebarToggle: () => `[data-testid="sidebar-toggle"]`,
    navItem: (item: string) => `[data-testid="nav-${item}"]`,
    projectView: (view: string) => `[data-testid="project-view-${view}"]`,
  },

  // Form and input selectors
  form: {
    searchInput: () => `[data-testid="task-search-input"]`,
    statusFilter: () => `[data-testid="status-filter-trigger"]`,
    priorityFilter: () => `[data-testid="priority-filter-trigger"]`,
    sortTrigger: () => `[data-testid="sort-trigger"]`,
    addTaskButton: () => `[data-testid="add-task-button"]`,
  },

  // Modal selectors
  modal: {
    taskDetail: () => `[data-testid="task-detail-modal"]`,
    createProject: () => `[data-testid="create-project-dialog"]`,
    createWorkspace: () => `[data-testid="create-workspace-dialog"]`,
  },

  // Generic selectors
  generic: {
    loading: () => `[data-testid*="loading"]`,
    error: () => `[data-testid*="error"]`,
    empty: () => `[data-testid*="empty"]`,
    button: (action: string) => `[data-testid*="${action}-button"]`,
    input: (field: string) => `[data-testid*="${field}-input"]`,
  },
} as const;

/**
 * Automation constants for consistent naming
 */
export const AutomationConstants = {
  ROLES: {
    BUTTON: "button",
    INPUT: "input",
    CARD: "card",
    LIST: "list",
    MODAL: "modal",
    NAVIGATION: "navigation",
    FILTER: "filter",
    DROPDOWN: "dropdown",
  },
  ACTIONS: {
    CLICK: "click",
    DRAG: "drag",
    DROP: "drop",
    TYPE: "type",
    SELECT: "select",
    NAVIGATE: "navigate",
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
  },
  STATES: {
    DEFAULT: "default",
    LOADING: "loading",
    ERROR: "error",
    SUCCESS: "success",
    DISABLED: "disabled",
    ACTIVE: "active",
    SELECTED: "selected",
    EXPANDED: "expanded",
    COLLAPSED: "collapsed",
  },
} as const;
