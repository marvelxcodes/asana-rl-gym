/**
 * Automation infrastructure for RL agent interaction
 * Provides stable selectors, state observation, and reward calculation
 */

/**
 * Main automation provider component that wraps the entire application
 */
export { AutomationProvider } from "./automation-provider";
export {
  AutomationConstants,
  AutomationSelectors,
  AutomationWrapper,
  type AutomationWrapperProps,
  useAutomationId,
  withAutomation,
} from "./automation-wrapper";

export {
  DEFAULT_REWARD_CONFIGS,
  loadRewardConfig,
  type RewardBonuses,
  type RewardBreakdown,
  type RewardCalculationResult,
  RewardCalculator,
  type RewardCalculatorProps,
  type RewardConfig,
  type RewardMetrics,
  type RewardPenalties,
  type RewardThresholds,
  type RewardWeights,
  useRewardCalculator,
} from "./reward-calculator";
export {
  type DOMState,
  type FormState,
  type InteractionEvent,
  type ModalState,
  type NavigationState,
  type ObservationState,
  type ProjectState,
  type StateMetrics,
  StateObserver,
  type StateObserverProps,
  type TaskState,
  type ViewState,
  type WorkspaceState,
} from "./state-observer";
