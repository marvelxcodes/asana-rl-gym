"use client";

import { useEffect, useState } from "react";
import type { InteractionEvent, ObservationState } from "./state-observer";

/**
 * Reward calculation system for RL agents
 * Provides configurable reward functions for different training scenarios
 */

export interface RewardConfig {
  scenario: string;
  weights: RewardWeights;
  penalties: RewardPenalties;
  bonuses: RewardBonuses;
  thresholds: RewardThresholds;
}

export interface RewardWeights {
  taskCompletion: number;
  efficiency: number;
  timeToComplete: number;
  userExperience: number;
  errorRate: number;
}

export interface RewardPenalties {
  invalidAction: number;
  timeout: number;
  error: number;
  inefficiency: number;
  overdue: number;
}

export interface RewardBonuses {
  fastCompletion: number;
  perfectExecution: number;
  helpfulAction: number;
  innovation: number;
}

export interface RewardThresholds {
  fastCompletionTime: number; // milliseconds
  highEfficiencyRate: number; // 0-1
  maxErrorRate: number; // 0-1
  overdueThreshold: number; // days
}

export interface RewardCalculationResult {
  totalReward: number;
  breakdown: RewardBreakdown;
  metrics: RewardMetrics;
  timestamp: number;
}

export interface RewardBreakdown {
  baseReward: number;
  taskCompletionReward: number;
  efficiencyReward: number;
  timeBonus: number;
  penalties: number;
  bonuses: number;
}

export interface RewardMetrics {
  actionsPerMinute: number;
  successRate: number;
  averageTaskTime: number;
  errorCount: number;
  completionRate: number;
}

// Default reward configurations for different scenarios
export const DEFAULT_REWARD_CONFIGS: Record<string, RewardConfig> = {
  taskManagement: {
    scenario: "taskManagement",
    weights: {
      taskCompletion: 10.0,
      efficiency: 5.0,
      timeToComplete: 3.0,
      userExperience: 2.0,
      errorRate: -2.0,
    },
    penalties: {
      invalidAction: -1.0,
      timeout: -5.0,
      error: -2.0,
      inefficiency: -1.0,
      overdue: -3.0,
    },
    bonuses: {
      fastCompletion: 2.0,
      perfectExecution: 5.0,
      helpfulAction: 1.0,
      innovation: 3.0,
    },
    thresholds: {
      fastCompletionTime: 30_000, // 30 seconds
      highEfficiencyRate: 0.8,
      maxErrorRate: 0.1,
      overdueThreshold: 1, // 1 day
    },
  },
  projectCreation: {
    scenario: "projectCreation",
    weights: {
      taskCompletion: 15.0,
      efficiency: 8.0,
      timeToComplete: 5.0,
      userExperience: 3.0,
      errorRate: -3.0,
    },
    penalties: {
      invalidAction: -2.0,
      timeout: -10.0,
      error: -5.0,
      inefficiency: -2.0,
      overdue: -1.0,
    },
    bonuses: {
      fastCompletion: 5.0,
      perfectExecution: 10.0,
      helpfulAction: 2.0,
      innovation: 5.0,
    },
    thresholds: {
      fastCompletionTime: 60_000, // 1 minute
      highEfficiencyRate: 0.9,
      maxErrorRate: 0.05,
      overdueThreshold: 0, // Not applicable
    },
  },
  collaboration: {
    scenario: "collaboration",
    weights: {
      taskCompletion: 8.0,
      efficiency: 6.0,
      timeToComplete: 2.0,
      userExperience: 8.0,
      errorRate: -4.0,
    },
    penalties: {
      invalidAction: -1.5,
      timeout: -3.0,
      error: -3.0,
      inefficiency: -2.0,
      overdue: -5.0,
    },
    bonuses: {
      fastCompletion: 1.0,
      perfectExecution: 3.0,
      helpfulAction: 5.0,
      innovation: 2.0,
    },
    thresholds: {
      fastCompletionTime: 45_000, // 45 seconds
      highEfficiencyRate: 0.75,
      maxErrorRate: 0.15,
      overdueThreshold: 2, // 2 days
    },
  },
};

export interface RewardCalculatorProps {
  config?: RewardConfig;
  onRewardCalculated?: (result: RewardCalculationResult) => void;
  debugMode?: boolean;
}

export function RewardCalculator({
  config = DEFAULT_REWARD_CONFIGS.taskManagement,
  onRewardCalculated,
  debugMode = false,
}: RewardCalculatorProps) {
  const [currentReward, setCurrentReward] =
    useState<RewardCalculationResult | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<RewardMetrics>({
    actionsPerMinute: 0,
    successRate: 0,
    averageTaskTime: 0,
    errorCount: 0,
    completionRate: 0,
  });
  const [sessionStart] = useState(Date.now());
  const [lastState, setLastState] = useState<ObservationState | null>(null);

  // Calculate reward based on state changes
  const calculateReward = (
    currentState: ObservationState,
    previousState: ObservationState | null,
    interactions: InteractionEvent[]
  ): RewardCalculationResult => {
    const breakdown: RewardBreakdown = {
      baseReward: 0,
      taskCompletionReward: 0,
      efficiencyReward: 0,
      timeBonus: 0,
      penalties: 0,
      bonuses: 0,
    };

    // Base reward for any action
    breakdown.baseReward = 0.1;

    // Task completion rewards
    if (previousState) {
      const prevCompleted = previousState.metrics.completedTasks;
      const currentCompleted = currentState.metrics.completedTasks;
      const newCompletions = currentCompleted - prevCompleted;

      breakdown.taskCompletionReward =
        newCompletions * config.weights.taskCompletion;
    }

    // Efficiency rewards
    const efficiencyScore = currentState.metrics.efficiency;
    if (efficiencyScore >= config.thresholds.highEfficiencyRate) {
      breakdown.efficiencyReward = config.weights.efficiency * efficiencyScore;
    }

    // Time-based bonuses
    const recentInteractions = interactions.filter(
      (interaction) =>
        Date.now() - interaction.timestamp <
        config.thresholds.fastCompletionTime
    );
    if (recentInteractions.length > 0 && breakdown.taskCompletionReward > 0) {
      breakdown.timeBonus = config.bonuses.fastCompletion;
    }

    // Penalties for errors and inefficiencies
    const errorInteractions = interactions.filter(
      (interaction) =>
        interaction.action === "error" || interaction.metadata.error
    );
    breakdown.penalties += errorInteractions.length * config.penalties.error;

    // Overdue task penalties
    breakdown.penalties +=
      currentState.metrics.overdueTasks * config.penalties.overdue;

    // Perfect execution bonus
    if (breakdown.taskCompletionReward > 0 && errorInteractions.length === 0) {
      breakdown.bonuses += config.bonuses.perfectExecution;
    }

    // Calculate total reward
    const totalReward =
      breakdown.baseReward +
      breakdown.taskCompletionReward +
      breakdown.efficiencyReward +
      breakdown.timeBonus +
      breakdown.penalties +
      breakdown.bonuses;

    // Calculate session metrics
    const sessionDuration = (Date.now() - sessionStart) / 1000 / 60; // minutes
    const totalActions = interactions.length;
    const successfulActions = interactions.filter(
      (interaction) => !interaction.metadata.error
    ).length;

    const metrics: RewardMetrics = {
      actionsPerMinute:
        sessionDuration > 0 ? totalActions / sessionDuration : 0,
      successRate: totalActions > 0 ? successfulActions / totalActions : 0,
      averageTaskTime: 0, // Would need task timing data
      errorCount: errorInteractions.length,
      completionRate: currentState.metrics.completionRate,
    };

    return {
      totalReward,
      breakdown,
      metrics,
      timestamp: Date.now(),
    };
  };

  // Listen for state changes and calculate rewards
  useEffect(() => {
    const handleStateUpdate = () => {
      const state = (window as any).automationState as ObservationState;
      const interactions =
        (window as any).stateObserver?.getInteractions() || [];

      if (state) {
        const result = calculateReward(state, lastState, interactions);
        setCurrentReward(result);
        setSessionMetrics(result.metrics);
        setLastState(state);
        onRewardCalculated?.(result);

        // Expose reward globally for RL agents
        (window as any).currentReward = result;
      }
    };

    const interval = setInterval(handleStateUpdate, 1000);
    return () => clearInterval(interval);
  }, [lastState, config, onRewardCalculated]);

  // Expose reward calculator API globally
  useEffect(() => {
    (window as any).rewardCalculator = {
      getCurrentReward: () => currentReward,
      getSessionMetrics: () => sessionMetrics,
      calculateCustomReward: (customConfig: RewardConfig) => {
        const state = (window as any).automationState as ObservationState;
        const interactions =
          (window as any).stateObserver?.getInteractions() || [];
        if (state) {
          return calculateReward(state, lastState, interactions);
        }
        return null;
      },
      resetSession: () => {
        setCurrentReward(null);
        setSessionMetrics({
          actionsPerMinute: 0,
          successRate: 0,
          averageTaskTime: 0,
          errorCount: 0,
          completionRate: 0,
        });
        setLastState(null);
      },
    };

    return () => {
      delete (window as any).rewardCalculator;
    };
  }, [currentReward, sessionMetrics, lastState]);

  // Debug display (only in development)
  if (debugMode && process.env.NODE_ENV === "development") {
    return (
      <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border bg-background p-4 shadow-lg">
        <h3 className="mb-2 font-semibold text-sm">Reward Debug</h3>
        {currentReward && (
          <div className="space-y-1 text-xs">
            <div>Total: {currentReward.totalReward.toFixed(2)}</div>
            <div>
              Task Completion:{" "}
              {currentReward.breakdown.taskCompletionReward.toFixed(2)}
            </div>
            <div>
              Efficiency: {currentReward.breakdown.efficiencyReward.toFixed(2)}
            </div>
            <div>Penalties: {currentReward.breakdown.penalties.toFixed(2)}</div>
            <div>Bonuses: {currentReward.breakdown.bonuses.toFixed(2)}</div>
            <div className="border-t pt-1">
              <div>
                Actions/min: {sessionMetrics.actionsPerMinute.toFixed(1)}
              </div>
              <div>
                Success Rate: {(sessionMetrics.successRate * 100).toFixed(1)}%
              </div>
              <div>
                Completion Rate:{" "}
                {(sessionMetrics.completionRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Hook for accessing reward calculation functionality
 */
export function useRewardCalculator() {
  const [currentReward, setCurrentReward] =
    useState<RewardCalculationResult | null>(null);

  useEffect(() => {
    const updateReward = () => {
      const reward = (window as any).currentReward as RewardCalculationResult;
      setCurrentReward(reward);
    };

    const interval = setInterval(updateReward, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    currentReward,
    calculator: (window as any).rewardCalculator,
  };
}

/**
 * Utility for loading custom reward configurations
 */
export async function loadRewardConfig(
  configPath: string
): Promise<RewardConfig> {
  try {
    const response = await fetch(configPath);
    const config = await response.json();
    return { ...DEFAULT_REWARD_CONFIGS.taskManagement, ...config };
  } catch (error) {
    console.warn("Failed to load reward config, using default:", error);
    return DEFAULT_REWARD_CONFIGS.taskManagement;
  }
}
