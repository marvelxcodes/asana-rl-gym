"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

/**
 * State observer component that captures and exposes DOM state for RL agents
 * This component provides structured data extraction and screenshot capabilities
 */

export interface StateObserverProps {
  children: React.ReactNode;
  observerId: string;
  captureScreenshots?: boolean;
  captureInterval?: number;
  onStateChange?: (state: ObservationState) => void;
}

export interface ObservationState {
  timestamp: number;
  observerId: string;
  domState: DOMState;
  screenshot?: string;
  interactions: InteractionEvent[];
  metrics: StateMetrics;
}

export interface DOMState {
  tasks: TaskState[];
  projects: ProjectState[];
  workspaces: WorkspaceState[];
  currentView: ViewState;
  navigation: NavigationState;
  modals: ModalState[];
  forms: FormState[];
}

export interface TaskState {
  id: string;
  name: string;
  status: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  tags: string[];
  dependencies: string[];
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  interactable: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  memberCount: number;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
}

export interface WorkspaceState {
  id: string;
  name: string;
  selected: boolean;
  projectCount: number;
}

export interface ViewState {
  type: "list" | "board" | "timeline" | "calendar" | "dashboard";
  filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
  };
  sort: {
    field?: string;
    direction?: "asc" | "desc";
  };
}

export interface NavigationState {
  currentPath: string;
  sidebarCollapsed: boolean;
  activeSection: string;
}

export interface ModalState {
  type: string;
  open: boolean;
  data?: Record<string, any>;
}

export interface FormState {
  id: string;
  fields: Record<string, any>;
  errors: Record<string, string>;
  submitting: boolean;
}

export interface InteractionEvent {
  timestamp: number;
  testId: string;
  action: string;
  metadata: Record<string, any>;
}

export interface StateMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  completionRate: number;
  efficiency: number;
}

export function StateObserver({
  children,
  observerId,
  captureScreenshots = false,
  captureInterval = 1000,
  onStateChange,
}: StateObserverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentState, setCurrentState] = useState<ObservationState | null>(
    null
  );
  const [interactions, setInteractions] = useState<InteractionEvent[]>([]);

  // Capture DOM state
  const captureDOMState = (): DOMState => {
    const container = containerRef.current;
    if (!container) {
      return {
        tasks: [],
        projects: [],
        workspaces: [],
        currentView: { type: "dashboard", filters: {}, sort: {} },
        navigation: {
          currentPath: "",
          sidebarCollapsed: false,
          activeSection: "",
        },
        modals: [],
        forms: [],
      };
    }

    // Extract task states
    const tasks: TaskState[] = Array.from(
      container.querySelectorAll(
        '[data-testid^="task-card-"], [data-testid^="task-item-"]'
      )
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      const testId = element.getAttribute("data-testid") || "";
      const taskId = testId.replace(/^task-(card|item)-/, "");

      return {
        id: taskId,
        name:
          element.querySelector(
            '[data-testid*="task-title"], [data-testid*="task-name"]'
          )?.textContent || "",
        status:
          element.querySelector('[data-testid*="task-status"]')?.textContent ||
          "",
        priority:
          element.querySelector('[data-testid*="task-priority"]')
            ?.textContent || "",
        assignee:
          element.querySelector('[data-testid*="task-assignee"]')
            ?.textContent || undefined,
        dueDate:
          element.querySelector('[data-testid*="task-due-date"]')
            ?.textContent || undefined,
        tags: Array.from(
          element.querySelectorAll('[data-testid*="task-tags"] span')
        ).map((tag) => tag.textContent || ""),
        dependencies: [],
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        visible: rect.width > 0 && rect.height > 0,
        interactable: !element.hasAttribute("disabled"),
      };
    });

    // Extract project states
    const projects: ProjectState[] = Array.from(
      container.querySelectorAll('[data-testid^="project-card-"]')
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      const testId = element.getAttribute("data-testid") || "";
      const projectId = testId.replace("project-card-", "");

      return {
        id: projectId,
        name:
          element.querySelector('h3, h4, [data-testid*="title"]')
            ?.textContent || "",
        color: getComputedStyle(element.querySelector(".h-3.w-3") || element)
          .backgroundColor,
        taskCount: 0, // Would need to be populated from context
        memberCount: 1, // Would need to be populated from context
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        visible: rect.width > 0 && rect.height > 0,
      };
    });

    // Extract workspace states
    const workspaces: WorkspaceState[] = Array.from(
      container.querySelectorAll('[data-testid^="workspace-option-"]')
    ).map((element) => {
      const testId = element.getAttribute("data-testid") || "";
      const workspaceId = testId.replace("workspace-option-", "");

      return {
        id: workspaceId,
        name: element.textContent || "",
        selected: element.getAttribute("aria-selected") === "true",
        projectCount: 0, // Would need to be populated from context
      };
    });

    // Extract current view state
    const currentView: ViewState = {
      type: getCurrentViewType(container),
      filters: extractFilters(container),
      sort: extractSort(container),
    };

    // Extract navigation state
    const navigation: NavigationState = {
      currentPath: window.location.pathname,
      sidebarCollapsed:
        container
          .querySelector('[data-testid="project-sidebar"]')
          ?.classList.contains("w-16") ?? false,
      activeSection: getActiveNavigationSection(container),
    };

    // Extract modal states
    const modals: ModalState[] = Array.from(
      container.querySelectorAll(
        '[data-testid*="modal"], [data-testid*="dialog"]'
      )
    ).map((element) => ({
      type: element.getAttribute("data-testid") || "",
      open:
        element.getAttribute("data-state") === "open" ||
        !element.hasAttribute("hidden"),
      data: {},
    }));

    // Extract form states
    const forms: FormState[] = Array.from(
      container.querySelectorAll("form")
    ).map((form, index) => ({
      id: form.id || `form-${index}`,
      fields: extractFormFields(form),
      errors: extractFormErrors(form),
      submitting:
        form.querySelector('[type="submit"]')?.hasAttribute("disabled") ??
        false,
    }));

    return {
      tasks,
      projects,
      workspaces,
      currentView,
      navigation,
      modals,
      forms,
    };
  };

  // Calculate state metrics
  const calculateMetrics = (domState: DOMState): StateMetrics => {
    const totalTasks = domState.tasks.length;
    const completedTasks = domState.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const overdueTasks = domState.tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < new Date()
    ).length;
    const totalProjects = domState.projects.length;
    const activeProjects = domState.projects.length; // Assuming all visible projects are active

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      efficiency:
        totalTasks > 0 ? (completedTasks - overdueTasks) / totalTasks : 0,
    };
  };

  // Capture screenshot (if supported)
  const captureScreenshot = async (): Promise<string | undefined> => {
    if (!(captureScreenshots && containerRef.current)) return;

    try {
      // Use html2canvas or similar library in production
      // For now, return a placeholder
      return "data:image/png;base64,placeholder";
    } catch (error) {
      console.warn("Screenshot capture failed:", error);
      return;
    }
  };

  // Update observation state
  const updateState = async () => {
    const domState = captureDOMState();
    const metrics = calculateMetrics(domState);
    const screenshot = await captureScreenshot();

    const newState: ObservationState = {
      timestamp: Date.now(),
      observerId,
      domState,
      screenshot,
      interactions: [...interactions],
      metrics,
    };

    setCurrentState(newState);
    onStateChange?.(newState);

    // Expose state globally for RL agents
    (window as any).automationState = newState;
  };

  // Listen for automation interactions
  useEffect(() => {
    const handleInteraction = (event: CustomEvent<InteractionEvent>) => {
      setInteractions((prev) => [...prev.slice(-99), event.detail]); // Keep last 100 interactions
    };

    window.addEventListener(
      "automation-interaction",
      handleInteraction as EventListener
    );
    return () => {
      window.removeEventListener(
        "automation-interaction",
        handleInteraction as EventListener
      );
    };
  }, []);

  // Periodic state capture
  useEffect(() => {
    const interval = setInterval(updateState, captureInterval);
    updateState(); // Initial capture

    return () => clearInterval(interval);
  }, [captureInterval, interactions]);

  // Expose state observer API globally
  useEffect(() => {
    (window as any).stateObserver = {
      getCurrentState: () => currentState,
      captureState: updateState,
      getInteractions: () => interactions,
      clearInteractions: () => setInteractions([]),
    };

    return () => {
      delete (window as any).stateObserver;
    };
  }, [currentState, interactions]);

  return (
    <div
      data-automation-observer={observerId}
      data-automation-state={JSON.stringify(currentState?.metrics || {})}
      ref={containerRef}
    >
      {children}
    </div>
  );
}

// Helper functions
function getCurrentViewType(container: Element): ViewState["type"] {
  if (container.querySelector('[data-testid="kanban-board-view"]'))
    return "board";
  if (container.querySelector('[data-testid="task-list-view"]')) return "list";
  if (container.querySelector('[data-testid="timeline-view"]'))
    return "timeline";
  if (container.querySelector('[data-testid="calendar-view"]'))
    return "calendar";
  return "dashboard";
}

function extractFilters(container: Element): ViewState["filters"] {
  const statusFilter = container.querySelector(
    '[data-testid="status-filter-trigger"]'
  )?.textContent;
  const priorityFilter = container.querySelector(
    '[data-testid="priority-filter-trigger"]'
  )?.textContent;
  const searchInput = container.querySelector(
    '[data-testid="task-search-input"]'
  ) as HTMLInputElement;

  return {
    status: statusFilter?.includes(":")
      ? statusFilter.split(":")[1]?.trim()
      : undefined,
    priority: priorityFilter?.includes(":")
      ? priorityFilter.split(":")[1]?.trim()
      : undefined,
    search: searchInput?.value || undefined,
  };
}

function extractSort(container: Element): ViewState["sort"] {
  const sortTrigger = container.querySelector(
    '[data-testid="sort-trigger"]'
  )?.textContent;
  if (!sortTrigger?.includes(":")) return {};

  const sortText = sortTrigger.split(":")[1]?.trim();
  const [field, direction] = sortText?.split(" (") || [];

  return {
    field: field?.trim(),
    direction: direction?.includes("desc") ? "desc" : "asc",
  };
}

function getActiveNavigationSection(container: Element): string {
  const activeNav = container.querySelector('[data-testid^="nav-"].bg-accent');
  return activeNav?.getAttribute("data-testid")?.replace("nav-", "") || "";
}

function extractFormFields(form: Element): Record<string, any> {
  const fields: Record<string, any> = {};

  form.querySelectorAll("input, textarea, select").forEach((input) => {
    const element = input as HTMLInputElement;
    const name = element.name || element.id;
    if (name) {
      fields[name] = element.value;
    }
  });

  return fields;
}

function extractFormErrors(form: Element): Record<string, string> {
  const errors: Record<string, string> = {};

  form
    .querySelectorAll('.text-destructive, .text-red-600, [role="alert"]')
    .forEach((error) => {
      const fieldName = error.getAttribute("data-field") || "general";
      errors[fieldName] = error.textContent || "";
    });

  return errors;
}
