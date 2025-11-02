/**
 * RL Instrumentation System
 *
 * This module provides instrumentation for observability by RL agents.
 * It tracks DOM mutations, user actions, and UI state changes.
 */

export interface RLState {
  // UI State
  currentView: "dashboard" | "projects" | "project-detail" | "board" | "list" | "timeline" | "calendar";
  modalOpen: boolean;
  sidebarOpen: boolean;

  // Data Counts
  projectCount: number;
  taskCounts: {
    todo: number;
    inProgress: number;
    completed: number;
  };

  // Interaction State
  lastAction: string | null;
  lastActionTimestamp: number;
  errorMessage: string | null;

  // Loading State
  isLoading: boolean;
  loadingComponent: string | null;

  // Viewport Info
  viewportWidth: number;
  viewportHeight: number;
  scrollPosition: { x: number; y: number };

  // Performance Metrics
  domElementCount: number;
  interactiveElementCount: number;
  lastRenderTime: number;
}

export interface RLAction {
  type: string;
  target: string | null; // data-testid of target element
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface RLObservation {
  state: RLState;
  recentActions: RLAction[];
  mutations: DOMMutation[];
  interactiveElements: InteractiveElement[];
}

export interface DOMMutation {
  type: "childList" | "attributes" | "characterData";
  target: string; // data-testid or element description
  timestamp: number;
}

export interface InteractiveElement {
  id: string; // data-testid
  tag: string;
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  visible: boolean;
  interactive: boolean;
  ariaLabel?: string;
}

class RLInstrumentationSystem {
  private state: RLState;
  private actionHistory: RLAction[] = [];
  private mutationHistory: DOMMutation[] = [];
  private mutationObserver: MutationObserver | null = null;

  private readonly MAX_HISTORY = 100;

  constructor() {
    this.state = this.getInitialState();
    this.setupMutationObserver();
    this.setupPerformanceTracking();
  }

  private getInitialState(): RLState {
    return {
      currentView: "dashboard",
      modalOpen: false,
      sidebarOpen: true,
      projectCount: 0,
      taskCounts: { todo: 0, inProgress: 0, completed: 0 },
      lastAction: null,
      lastActionTimestamp: 0,
      errorMessage: null,
      isLoading: false,
      loadingComponent: null,
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1920,
      viewportHeight: typeof window !== "undefined" ? window.innerHeight : 1080,
      scrollPosition: { x: 0, y: 0 },
      domElementCount: 0,
      interactiveElementCount: 0,
      lastRenderTime: Date.now(),
    };
  }

  private setupMutationObserver() {
    if (typeof window === "undefined") return;

    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement;
        const testId = target.getAttribute?.("data-testid") ||
                      target.className ||
                      target.tagName;

        this.mutationHistory.push({
          type: mutation.type,
          target: testId,
          timestamp: Date.now(),
        });

        // Keep history bounded
        if (this.mutationHistory.length > this.MAX_HISTORY) {
          this.mutationHistory.shift();
        }
      }

      // Update counts
      this.updateElementCounts();
    });

    // Start observing
    if (document.body) {
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "data-testid"],
      });
    }
  }

  private setupPerformanceTracking() {
    if (typeof window === "undefined") return;

    // Track scroll position
    window.addEventListener("scroll", () => {
      this.state.scrollPosition = {
        x: window.scrollX,
        y: window.scrollY,
      };
    });

    // Track viewport changes
    window.addEventListener("resize", () => {
      this.state.viewportWidth = window.innerWidth;
      this.state.viewportHeight = window.innerHeight;
    });
  }

  private updateElementCounts() {
    if (typeof document === "undefined") return;

    this.state.domElementCount = document.querySelectorAll("*").length;
    this.state.interactiveElementCount = document.querySelectorAll(
      "button, a, input, [draggable=true], [data-testid]"
    ).length;
  }

  /**
   * Record an action performed in the environment
   */
  recordAction(action: Omit<RLAction, "timestamp">) {
    const fullAction: RLAction = {
      ...action,
      timestamp: Date.now(),
    };

    this.actionHistory.push(fullAction);
    this.state.lastAction = action.type;
    this.state.lastActionTimestamp = fullAction.timestamp;

    // Keep history bounded
    if (this.actionHistory.length > this.MAX_HISTORY) {
      this.actionHistory.shift();
    }
  }

  /**
   * Update UI state
   */
  updateState(updates: Partial<RLState>) {
    this.state = { ...this.state, ...updates };
    this.state.lastRenderTime = Date.now();
  }

  /**
   * Get current state
   */
  getState(): RLState {
    this.updateElementCounts();
    return { ...this.state };
  }

  /**
   * Get full observation for RL agent
   */
  getObservation(): RLObservation {
    return {
      state: this.getState(),
      recentActions: this.actionHistory.slice(-20), // Last 20 actions
      mutations: this.mutationHistory.slice(-50), // Last 50 mutations
      interactiveElements: this.getInteractiveElements(),
    };
  }

  /**
   * Extract all interactive elements from DOM
   */
  private getInteractiveElements(): InteractiveElement[] {
    if (typeof document === "undefined") return [];

    const elements: InteractiveElement[] = [];
    const interactiveNodes = document.querySelectorAll("[data-testid]");

    for (const node of interactiveNodes) {
      const element = node as HTMLElement;
      const rect = element.getBoundingClientRect();

      // Check if element is visible
      const visible = rect.width > 0 && rect.height > 0 &&
                     window.getComputedStyle(element).display !== "none";

      elements.push({
        id: element.getAttribute("data-testid") || "",
        tag: element.tagName.toLowerCase(),
        text: element.innerText?.substring(0, 100) || "",
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        visible,
        interactive: element.matches("button, a, input, [draggable=true]"),
        ariaLabel: element.getAttribute("aria-label") || undefined,
      });
    }

    return elements;
  }

  /**
   * Get elements by type
   */
  getElementsByType(type: "button" | "input" | "card" | "modal"): InteractiveElement[] {
    const allElements = this.getInteractiveElements();

    const typeFilters: Record<string, (el: InteractiveElement) => boolean> = {
      button: (el) => el.tag === "button" || el.id.includes("button"),
      input: (el) => el.tag === "input" || el.tag === "textarea",
      card: (el) => el.id.includes("card") || el.id.includes("task"),
      modal: (el) => el.id.includes("modal") || el.id.includes("dialog"),
    };

    return allElements.filter(typeFilters[type] || (() => false));
  }

  /**
   * Reset instrumentation (for episode reset)
   */
  reset() {
    this.state = this.getInitialState();
    this.actionHistory = [];
    this.mutationHistory = [];
  }

  /**
   * Export data for RL training
   */
  exportData() {
    return {
      state: this.state,
      actions: this.actionHistory,
      mutations: this.mutationHistory,
      elements: this.getInteractiveElements(),
    };
  }

  /**
   * Cleanup observers
   */
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

// Global singleton instance
let instrumentationInstance: RLInstrumentationSystem | null = null;

export function getRLInstrumentation(): RLInstrumentationSystem {
  if (!instrumentationInstance) {
    instrumentationInstance = new RLInstrumentationSystem();
  }
  return instrumentationInstance;
}

/**
 * Hook for React components to record actions
 */
export function useRLAction() {
  const instrumentation = getRLInstrumentation();

  return (type: string, target: string | null, success = true, metadata?: Record<string, any>) => {
    instrumentation.recordAction({ type, target, success, metadata });
  };
}

/**
 * Hook for React components to update state
 */
export function useRLState() {
  const instrumentation = getRLInstrumentation();

  return (updates: Partial<RLState>) => {
    instrumentation.updateState(updates);
  };
}
