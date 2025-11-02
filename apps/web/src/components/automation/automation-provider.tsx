"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  DEFAULT_REWARD_CONFIGS,
  RewardCalculator,
  type RewardConfig,
} from "./reward-calculator";
import { StateObserver } from "./state-observer";

/**
 * Main automation provider that wraps the application with RL infrastructure
 * Provides state observation, reward calculation, and automation utilities
 */

export type AutomationProviderProps = {
  children: React.ReactNode;
  enabled?: boolean;
  rewardConfig?: RewardConfig;
  debugMode?: boolean;
  captureScreenshots?: boolean;
  captureInterval?: number;
};

const AUTOMATION_CHECK_INTERVAL = 1000;
const DEFAULT_CAPTURE_INTERVAL = 1000;

export function AutomationProvider({
  children,
  enabled = true,
  rewardConfig,
  debugMode = false,
  captureScreenshots = false,
  captureInterval = DEFAULT_CAPTURE_INTERVAL,
}: AutomationProviderProps) {
  const [config, setConfig] = useState<RewardConfig>(
    rewardConfig || DEFAULT_REWARD_CONFIGS.taskManagement
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize automation system
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Load custom config if available
    const loadConfig = async () => {
      try {
        // Try to load config from public directory
        const response = await fetch("/automation-config.json");
        if (response.ok) {
          const customConfig = await response.json();
          setConfig({
            ...DEFAULT_REWARD_CONFIGS.taskManagement,
            ...customConfig,
          });
        }
      } catch {
        // No custom automation config found, using defaults
      }
      setIsInitialized(true);
    };

    loadConfig();
  }, [enabled]);

  // Expose automation API globally for RL agents
  useEffect(() => {
    if (!(enabled && isInitialized)) {
      return;
    }

    const automationAPI = {
      // State observation
      getCurrentState: () => (window as any).automationState,
      captureState: () => (window as any).stateObserver?.captureState(),

      // Reward calculation
      getCurrentReward: () => (window as any).currentReward,
      calculateReward: (customConfig?: RewardConfig) =>
        (window as any).rewardCalculator?.calculateCustomReward(
          customConfig || config
        ),

      // Interaction tracking
      getInteractions: () =>
        (window as any).stateObserver?.getInteractions() || [],
      clearInteractions: () =>
        (window as any).stateObserver?.clearInteractions(),

      // Configuration
      getConfig: () => config,
      setConfig: (newConfig: RewardConfig) => setConfig(newConfig),

      // Utilities
      isEnabled: () => enabled,
      getVersion: () => "1.0.0",

      // Action simulation (for testing)
      simulateClick: (selector: string) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          element.click();
          return true;
        }
        return false;
      },

      simulateInput: (selector: string, value: string) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.value = value;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        return false;
      },

      simulateDrag: (sourceSelector: string, targetSelector: string) => {
        const source = document.querySelector(sourceSelector) as HTMLElement;
        const target = document.querySelector(targetSelector) as HTMLElement;

        if (source && target) {
          // Simulate drag and drop events
          const dragStartEvent = new DragEvent("dragstart", { bubbles: true });
          const dropEvent = new DragEvent("drop", { bubbles: true });
          const dragEndEvent = new DragEvent("dragend", { bubbles: true });

          source.dispatchEvent(dragStartEvent);
          target.dispatchEvent(dropEvent);
          source.dispatchEvent(dragEndEvent);
          return true;
        }
        return false;
      },
    };

    (window as any).automationAPI = automationAPI;

    // Add CSS classes for automation styling
    document.documentElement.classList.add("automation-enabled");
    if (debugMode) {
      document.documentElement.classList.add("automation-debug");
    }

    return () => {
      (window as any).automationAPI = undefined;
      document.documentElement.classList.remove(
        "automation-enabled",
        "automation-debug"
      );
    };
  }, [enabled, isInitialized, config, debugMode]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <StateObserver
      captureInterval={captureInterval}
      captureScreenshots={captureScreenshots}
      observerId="main-app"
    >
      <RewardCalculator config={config} debugMode={debugMode} />
      {children}
    </StateObserver>
  );
}

/**
 * Hook for accessing automation context
 */
export function useAutomation() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    const checkAutomation = () => {
      const automationAPI = (window as any).automationAPI;
      setIsEnabled(!!automationAPI);
      setApi(automationAPI);
    };

    checkAutomation();
    const interval = setInterval(checkAutomation, AUTOMATION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    isEnabled,
    api,
  };
}
