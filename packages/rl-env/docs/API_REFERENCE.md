# API Reference

This document provides detailed API documentation for the Asana Replica RL Environment.

## Core Classes

### AsanaReplicaEnv

The main Gymnasium environment class.

```python
class AsanaReplicaEnv(gym.Env):
    def __init__(self, config: Optional[Union[Dict[str, Any], EnvironmentConfig]] = None)
```

#### Methods

##### `reset(seed=None, options=None) -> Tuple[Any, Dict[str, Any]]`

Reset the environment to initial state.

**Parameters:**
- `seed` (int, optional): Random seed for reproducibility
- `options` (dict, optional): Additional reset options

**Returns:**
- `observation`: Initial observation
- `info`: Environment information dictionary

##### `step(action: int) -> Tuple[Any, float, bool, bool, Dict[str, Any]]`

Execute one step in the environment.

**Parameters:**
- `action` (int): Action to execute (0-49)

**Returns:**
- `observation`: New observation after action
- `reward` (float): Reward for the action
- `terminated` (bool): Whether episode terminated
- `truncated` (bool): Whether episode was truncated
- `info` (dict): Additional information

##### `render(mode: str = "human") -> Optional[np.ndarray]`

Render the environment.

**Parameters:**
- `mode` (str): Render mode ("human" or "rgb_array")

**Returns:**
- RGB array if mode is "rgb_array", None otherwise

##### `close() -> None`

Close the environment and clean up resources.

##### `get_action_meanings() -> Dict[int, str]`

Get human-readable meanings for all actions.

**Returns:**
- Dictionary mapping action IDs to action names

##### `get_current_state_info() -> Dict[str, Any]`

Get detailed information about current environment state.

**Returns:**
- Dictionary with current state information

### EnvironmentConfig

Configuration class for the RL environment.

```python
class EnvironmentConfig(BaseModel):
    # Application settings
    base_url: str = "http://localhost:3000"
    login_required: bool = True
    test_user_email: str = "test@example.com"
    test_user_password: str = "password123"
    
    # Browser settings
    browser: Literal["chrome", "firefox"] = "chrome"
    headless: bool = True
    window_width: int = 1920
    window_height: int = 1080
    
    # Environment settings
    observation_mode: Literal["visual", "structured", "hybrid"] = "hybrid"
    max_episode_steps: int = 1000
    action_timeout: float = 10.0
    
    # Reward settings
    reward_config: RewardConfig = RewardConfig()
    reward_config_file: Optional[str] = None
    
    # Observation settings
    screenshot_width: int = 800
    screenshot_height: int = 600
    
    # Logging and debugging
    debug_mode: bool = False
    save_screenshots: bool = False
    screenshot_dir: str = "./screenshots"
```

#### Methods

##### `from_dict(config_dict: Dict[str, Any]) -> EnvironmentConfig`

Create configuration from dictionary.

##### `load_reward_config(config_file: str) -> RewardConfig`

Load reward configuration from JSON file.

### RewardConfig

Configuration for reward calculation.

```python
class RewardConfig(BaseModel):
    # Task completion rewards
    task_completion_reward: float = 10.0
    task_creation_reward: float = 2.0
    task_assignment_reward: float = 1.0
    
    # Project management rewards
    project_creation_reward: float = 5.0
    project_organization_reward: float = 3.0
    
    # Efficiency rewards
    quick_action_bonus: float = 0.5
    workflow_efficiency_multiplier: float = 1.2
    
    # Penalties
    invalid_action_penalty: float = -1.0
    timeout_penalty: float = -5.0
    navigation_penalty: float = -0.1
    
    # Collaboration rewards
    comment_creation_reward: float = 1.5
    team_interaction_bonus: float = 2.0
    
    # Time-based modifiers
    deadline_bonus_multiplier: float = 1.5
    overdue_penalty_multiplier: float = 0.5
```

## Utility Classes

### BrowserAutomation

Browser automation utilities using Selenium WebDriver.

```python
class BrowserAutomation:
    def __init__(self, config: EnvironmentConfig)
```

#### Key Methods

##### `start_browser() -> None`

Start the browser with configured options.

##### `close_browser() -> None`

Close the browser and clean up resources.

##### `navigate_to_url(url: str) -> bool`

Navigate to a specific URL.

##### `click_element(selector: str, by: By = By.CSS_SELECTOR) -> bool`

Click an element.

##### `type_text(selector: str, text: str, by: By = By.CSS_SELECTOR, clear_first: bool = True) -> bool`

Type text into an input element.

##### `drag_and_drop(source_selector: str, target_selector: str, by: By = By.CSS_SELECTOR) -> bool`

Perform drag and drop operation.

##### `get_page_screenshot() -> Optional[np.ndarray]`

Take a screenshot of the current page.

### ActionExecutor

Executes actions in the Asana replica application.

```python
class ActionExecutor:
    def __init__(self, browser: BrowserAutomation, config: EnvironmentConfig)
```

#### Methods

##### `execute_action(action_id: int, action_name: str) -> bool`

Execute a specific action.

**Parameters:**
- `action_id` (int): Numeric action identifier
- `action_name` (str): Human-readable action name

**Returns:**
- True if action was executed successfully

### StateObserver

Observes and extracts state information from the application.

```python
class StateObserver:
    def __init__(self, browser: BrowserAutomation, config: EnvironmentConfig)
```

#### Methods

##### `get_observation() -> Union[np.ndarray, Dict[str, Any]]`

Get current observation based on configured observation mode.

##### `get_detailed_state_info() -> Dict[str, Any]`

Get detailed state information for debugging and analysis.

##### `extract_task_details() -> List[Dict[str, Any]]`

Extract detailed information about visible tasks.

##### `extract_project_details() -> List[Dict[str, Any]]`

Extract detailed information about visible projects.

### RewardCalculator

Calculates rewards for RL agent actions.

```python
class RewardCalculator:
    def __init__(self, reward_config: RewardConfig)
```

#### Methods

##### `reset() -> None`

Reset reward calculator for new episode.

##### `calculate_reward(action_name: str, action_success: bool, observation: Union[np.ndarray, Dict[str, Any]], step_time: float) -> float`

Calculate reward for the current step.

**Parameters:**
- `action_name` (str): Name of the action executed
- `action_success` (bool): Whether the action was successful
- `observation`: Current environment observation
- `step_time` (float): Time taken to execute the action

**Returns:**
- Calculated reward value

##### `get_last_reward_breakdown() -> Dict[str, float]`

Get detailed breakdown of the last calculated reward.

##### `get_episode_statistics() -> Dict[str, Any]`

Get statistics for the current episode.

##### `calculate_episode_bonus() -> float`

Calculate bonus reward at the end of episode based on overall performance.

### TrainingEpisodeManager

Manages training episodes, logging, and performance tracking.

```python
class TrainingEpisodeManager:
    def __init__(self, config: EnvironmentConfig, log_dir: str = "./training_logs")
```

#### Methods

##### `start_episode(episode_number: Optional[int] = None) -> None`

Start a new training episode.

##### `log_step(step_number: int, action: int, action_name: str, reward: float, observation: Union[np.ndarray, Dict[str, Any]], info: Dict[str, Any]) -> None`

Log information for a single step.

##### `end_episode(final_reward: float, episode_length: int, termination_reason: str, reward_calculator: Optional[RewardCalculator] = None) -> Dict[str, Any]`

End the current episode and calculate statistics.

##### `save_training_summary() -> None`

Save overall training summary.

##### `load_training_history(log_dir: Optional[str] = None) -> bool`

Load training history from previous sessions.

##### `get_performance_metrics() -> Dict[str, Any]`

Get current performance metrics.

### RewardScenarioManager

Manages different reward scenarios for various training objectives.

```python
class RewardScenarioManager:
    def __init__(self)
```

#### Methods

##### `get_scenario_config(scenario_name: str) -> RewardConfig`

Get reward configuration for a specific scenario.

**Parameters:**
- `scenario_name` (str): Name of the scenario ("efficiency-training", "collaboration", "project-creation")

**Returns:**
- RewardConfig object for the scenario

## Action Space

The environment provides 50 discrete actions:

### Navigation Actions (0-9)
- 0: navigate_to_dashboard
- 1: navigate_to_projects
- 2: navigate_to_project_list
- 3: navigate_to_project_board
- 4: navigate_to_project_timeline
- 5: navigate_to_project_calendar
- 6: switch_workspace
- 7: scroll_up
- 8: scroll_down
- 9: refresh_page

### Project Actions (10-19)
- 10: create_new_project
- 11: open_project
- 12: edit_project
- 13: archive_project
- 14: change_project_color
- 15: add_project_member
- 16: remove_project_member
- 17: duplicate_project
- 18: delete_project
- 19: set_project_status

### Task Actions (20-34)
- 20: create_new_task
- 21: open_task_detail
- 22: edit_task_name
- 23: edit_task_description
- 24: set_task_assignee
- 25: set_task_due_date
- 26: set_task_priority
- 27: change_task_status_todo
- 28: change_task_status_in_progress
- 29: change_task_status_completed
- 30: add_task_dependency
- 31: remove_task_dependency
- 32: add_task_tag
- 33: delete_task
- 34: duplicate_task

### Collaboration Actions (35-44)
- 35: add_comment
- 36: reply_to_comment
- 37: edit_comment
- 38: delete_comment
- 39: mention_user
- 40: attach_file
- 41: create_subtask
- 42: convert_to_project
- 43: follow_task
- 44: unfollow_task

### View and Filter Actions (45-49)
- 45: filter_by_assignee
- 46: filter_by_status
- 47: filter_by_due_date
- 48: sort_tasks
- 49: search_tasks

## Observation Space

### Visual Mode
- **Type**: Box(low=0, high=255, shape=(height, width, 3), dtype=uint8)
- **Description**: RGB screenshots of the browser window

### Structured Mode
- **Type**: Dict with the following keys:
  - `task_counts`: Box(low=0, high=1000, shape=(3,), dtype=int32) - [todo, in_progress, completed]
  - `project_count`: Box(low=0, high=100, shape=(1,), dtype=int32)
  - `current_view`: Discrete(5) - 0=dashboard, 1=list, 2=board, 3=timeline, 4=calendar
  - `user_position`: Box(low=0, high=1, shape=(2,), dtype=float32) - normalized scroll position
  - `page_elements`: Box(low=0, high=1, shape=(20,), dtype=float32) - element visibility flags

### Hybrid Mode
- **Type**: Dict with keys:
  - `visual`: Same as Visual Mode
  - `structured`: Same as Structured Mode

## Error Handling

The environment includes comprehensive error handling:

- **Browser Errors**: Automatic browser restart and state recovery
- **Action Errors**: Invalid action handling with negative rewards
- **Network Errors**: Retry logic with exponential backoff
- **Timeout Errors**: Configurable timeouts with appropriate penalties

## Performance Considerations

- Use headless mode for faster training
- Structured observations are faster than visual
- Limit episode length for quicker iteration
- Enable screenshot saving only for debugging
- Use appropriate action timeouts based on network conditions