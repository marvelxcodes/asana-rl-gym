# RL Automation Infrastructure

This directory contains the automation infrastructure for enabling Reinforcement Learning (RL) agent interaction with the Asana replica application.

## Overview

The automation system provides three main components:

1. **Stable CSS Selectors & Data Attributes** - Consistent element identification
2. **State Observation System** - DOM state capture and structured data extraction
3. **Reward Calculation System** - Configurable reward functions for different training scenarios

## Components

### AutomationWrapper

A wrapper component that adds stable data attributes to any element for reliable automation.

```tsx
import { AutomationWrapper } from "@/components/automation";

<AutomationWrapper
  testId="task-create-button"
  role="button"
  action="create"
  state="default"
  metadata={{ taskCount: 5 }}
>
  <Button>Create Task</Button>
</AutomationWrapper>
```

### StateObserver

Captures and exposes DOM state for RL agents, including screenshots and structured data.

```tsx
import { StateObserver } from "@/components/automation";

<StateObserver
  observerId="main-app"
  captureScreenshots={true}
  captureInterval={1000}
  onStateChange={(state) => console.log(state)}
>
  <App />
</StateObserver>
```

### RewardCalculator

Calculates rewards based on agent actions and system state changes.

```tsx
import { RewardCalculator } from "@/components/automation";

<RewardCalculator
  config={customRewardConfig}
  debugMode={true}
  onRewardCalculated={(result) => console.log(result)}
/>
```

### AutomationProvider

Main provider that wraps the entire application with automation infrastructure.

```tsx
import { AutomationProvider } from "@/components/automation";

<AutomationProvider
  enabled={true}
  debugMode={process.env.NODE_ENV === "development"}
  captureScreenshots={false}
>
  <App />
</AutomationProvider>
```

## Selectors

The system provides consistent CSS selectors for all interactive elements:

```typescript
import { AutomationSelectors } from "@/components/automation";

// Task selectors
AutomationSelectors.task.card("task-123")
AutomationSelectors.task.status("task-123")
AutomationSelectors.task.priority("task-123")

// Project selectors
AutomationSelectors.project.card("project-456")
AutomationSelectors.project.menu("project-456")

// Navigation selectors
AutomationSelectors.navigation.sidebar()
AutomationSelectors.navigation.navItem("projects")
```

## Reward Configuration

Rewards can be configured through JSON files in the `public/reward-configs/` directory:

```json
{
  "scenario": "taskManagement",
  "weights": {
    "taskCompletion": 10.0,
    "efficiency": 5.0,
    "timeToComplete": 3.0,
    "userExperience": 2.0,
    "errorRate": -2.0
  },
  "penalties": {
    "invalidAction": -1.0,
    "timeout": -5.0,
    "error": -2.0,
    "inefficiency": -1.0,
    "overdue": -3.0
  },
  "bonuses": {
    "fastCompletion": 2.0,
    "perfectExecution": 5.0,
    "helpfulAction": 1.0,
    "innovation": 3.0
  },
  "thresholds": {
    "fastCompletionTime": 30000,
    "highEfficiencyRate": 0.8,
    "maxErrorRate": 0.1,
    "overdueThreshold": 1
  }
}
```

## Global API

The automation system exposes a global API for RL agents:

```javascript
// State observation
window.automationAPI.getCurrentState()
window.automationAPI.captureState()

// Reward calculation
window.automationAPI.getCurrentReward()
window.automationAPI.calculateReward(customConfig)

// Interaction tracking
window.automationAPI.getInteractions()
window.automationAPI.clearInteractions()

// Action simulation
window.automationAPI.simulateClick(selector)
window.automationAPI.simulateInput(selector, value)
window.automationAPI.simulateDrag(sourceSelector, targetSelector)
```

## Data Attributes

All interactive elements include automation-specific data attributes:

- `data-testid`: Unique identifier for the element
- `data-automation-role`: Element role (button, input, card, etc.)
- `data-automation-action`: Expected action (click, drag, type, etc.)
- `data-automation-state`: Current state (default, loading, error, etc.)
- `data-automation-*`: Custom metadata attributes

## State Structure

The observation state includes:

```typescript
interface ObservationState {
  timestamp: number;
  observerId: string;
  domState: {
    tasks: TaskState[];
    projects: ProjectState[];
    workspaces: WorkspaceState[];
    currentView: ViewState;
    navigation: NavigationState;
    modals: ModalState[];
    forms: FormState[];
  };
  screenshot?: string;
  interactions: InteractionEvent[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    totalProjects: number;
    activeProjects: number;
    completionRate: number;
    efficiency: number;
  };
}
```

## Usage Examples

### Basic Setup

```tsx
// In your main layout or app component
import { AutomationProvider } from "@/components/automation";

export default function App() {
  return (
    <AutomationProvider
      enabled={process.env.AUTOMATION_ENABLED === "true"}
      debugMode={process.env.NODE_ENV === "development"}
    >
      <YourAppContent />
    </AutomationProvider>
  );
}
```

### Adding Automation to Components

```tsx
import { AutomationWrapper, useAutomationId } from "@/components/automation";

function TaskCard({ task }) {
  const testId = useAutomationId("task-card", task.id);
  
  return (
    <AutomationWrapper
      testId={testId}
      role="card"
      action="click"
      metadata={{ status: task.status, priority: task.priority }}
    >
      <Card onClick={() => openTask(task.id)}>
        {/* Task content */}
      </Card>
    </AutomationWrapper>
  );
}
```

### Custom Reward Configuration

```tsx
import { loadRewardConfig } from "@/components/automation";

// Load custom configuration
const config = await loadRewardConfig("/reward-configs/custom.json");

// Use with RewardCalculator
<RewardCalculator config={config} />
```

## Environment Variables

- `NEXT_PUBLIC_AUTOMATION_ENABLED`: Enable/disable automation system
- `NODE_ENV`: Automatically enables debug mode in development

## CSS Classes

The system adds CSS classes for styling automation elements:

- `.automation-enabled`: Added to document root when automation is active
- `.automation-debug`: Added in debug mode
- `.automation-wrapper`: Base wrapper class
- `.automation-disabled`: Applied to disabled elements
- `.automation-interaction-highlight`: Applied during interactions

## Performance Considerations

- State capture runs at configurable intervals (default: 1000ms)
- Screenshot capture is optional and disabled by default
- Interaction history is limited to last 100 events
- Debug mode should only be used in development

## Browser Compatibility

The automation system works with:
- Chrome/Chromium (recommended for RL agents)
- Firefox
- Safari (limited screenshot support)
- Edge

## Security Notes

- Automation API is only exposed when explicitly enabled
- No sensitive data is included in state observations
- All interactions are logged for debugging purposes
- Production deployments should disable debug mode