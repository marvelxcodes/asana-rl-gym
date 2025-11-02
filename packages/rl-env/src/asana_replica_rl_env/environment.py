"""Main Gymnasium environment for Asana Replica RL training."""

import logging
import time
from typing import Dict, Any, Tuple, Optional, Union
import numpy as np
import gymnasium as gym
from gymnasium import spaces

from .config import EnvironmentConfig
from .browser_automation import BrowserAutomation
from .reward_calculator import RewardCalculator
from .action_executor import ActionExecutor
from .state_observer import StateObserver

logger = logging.getLogger(__name__)


class AsanaReplicaEnv(gym.Env):
    """
    Gymnasium environment for training RL agents on Asana replica project management tasks.
    
    This environment provides a standardized interface for RL agents to interact with
    the Asana replica web application through browser automation.
    """
    
    metadata = {
        "render_modes": ["human", "rgb_array"],
        "render_fps": 4,
    }
    
    def __init__(self, config: Optional[Union[Dict[str, Any], EnvironmentConfig]] = None):
        """
        Initialize the Asana Replica RL environment.
        
        Args:
            config: Environment configuration as dict or EnvironmentConfig object
        """
        super().__init__()
        
        # Initialize configuration
        if config is None:
            self.config = EnvironmentConfig()
        elif isinstance(config, dict):
            self.config = EnvironmentConfig.from_dict(config)
        else:
            self.config = config
        
        # Initialize components
        self.browser = BrowserAutomation(self.config)
        self.reward_calculator = RewardCalculator(self.config.reward_config)
        self.action_executor = ActionExecutor(self.browser, self.config)
        self.state_observer = StateObserver(self.browser, self.config)
        
        # Environment state
        self.current_step = 0
        self.episode_start_time = 0.0
        self.last_action_time = 0.0
        self.is_logged_in = False
        self.current_project_id: Optional[str] = None
        
        # Define action and observation spaces
        self._setup_action_space()
        self._setup_observation_space()
        
        logger.info("AsanaReplicaEnv initialized successfully")
    
    def _setup_action_space(self) -> None:
        """Set up the action space for the environment."""
        # Define discrete actions that agents can take
        # Actions are mapped to specific UI interactions
        self.action_space = spaces.Discrete(50)  # 50 different actions
        
        # Action mapping (will be used by ActionExecutor)
        self.action_mapping = {
            # Navigation actions (0-9)
            0: "navigate_to_dashboard",
            1: "navigate_to_projects",
            2: "navigate_to_project_list",
            3: "navigate_to_project_board",
            4: "navigate_to_project_timeline",
            5: "navigate_to_project_calendar",
            6: "switch_workspace",
            7: "scroll_up",
            8: "scroll_down",
            9: "refresh_page",
            
            # Project actions (10-19)
            10: "create_new_project",
            11: "open_project",
            12: "edit_project",
            13: "archive_project",
            14: "change_project_color",
            15: "add_project_member",
            16: "remove_project_member",
            17: "duplicate_project",
            18: "delete_project",
            19: "set_project_status",
            
            # Task actions (20-34)
            20: "create_new_task",
            21: "open_task_detail",
            22: "edit_task_name",
            23: "edit_task_description",
            24: "set_task_assignee",
            25: "set_task_due_date",
            26: "set_task_priority",
            27: "change_task_status_todo",
            28: "change_task_status_in_progress",
            29: "change_task_status_completed",
            30: "add_task_dependency",
            31: "remove_task_dependency",
            32: "add_task_tag",
            33: "delete_task",
            34: "duplicate_task",
            
            # Collaboration actions (35-44)
            35: "add_comment",
            36: "reply_to_comment",
            37: "edit_comment",
            38: "delete_comment",
            39: "mention_user",
            40: "attach_file",
            41: "create_subtask",
            42: "convert_to_project",
            43: "follow_task",
            44: "unfollow_task",
            
            # View and filter actions (45-49)
            45: "filter_by_assignee",
            46: "filter_by_status",
            47: "filter_by_due_date",
            48: "sort_tasks",
            49: "search_tasks",
        }
    
    def _setup_observation_space(self) -> None:
        """Set up the observation space for the environment."""
        if self.config.observation_mode == "visual":
            # Visual observations: RGB screenshots
            self.observation_space = spaces.Box(
                low=0,
                high=255,
                shape=(self.config.screenshot_height, self.config.screenshot_width, 3),
                dtype=np.uint8
            )
        elif self.config.observation_mode == "structured":
            # Structured observations: DOM-based features
            self.observation_space = spaces.Dict({
                "task_counts": spaces.Box(low=0, high=1000, shape=(3,), dtype=np.int32),  # todo, in_progress, completed
                "project_count": spaces.Box(low=0, high=100, shape=(1,), dtype=np.int32),
                "current_view": spaces.Discrete(5),  # dashboard, list, board, timeline, calendar
                "user_position": spaces.Box(low=0, high=1, shape=(2,), dtype=np.float32),  # normalized x, y
                "page_elements": spaces.Box(low=0, high=1, shape=(20,), dtype=np.float32),  # element visibility flags
            })
        else:  # hybrid mode
            # Combination of visual and structured observations
            self.observation_space = spaces.Dict({
                "visual": spaces.Box(
                    low=0,
                    high=255,
                    shape=(self.config.screenshot_height, self.config.screenshot_width, 3),
                    dtype=np.uint8
                ),
                "structured": spaces.Dict({
                    "task_counts": spaces.Box(low=0, high=1000, shape=(3,), dtype=np.int32),
                    "project_count": spaces.Box(low=0, high=100, shape=(1,), dtype=np.int32),
                    "current_view": spaces.Discrete(5),
                    "user_position": spaces.Box(low=0, high=1, shape=(2,), dtype=np.float32),
                    "page_elements": spaces.Box(low=0, high=1, shape=(20,), dtype=np.float32),
                })
            })
    
    def reset(self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[Any, Dict[str, Any]]:
        """
        Reset the environment to initial state.
        
        Args:
            seed: Random seed for reproducibility
            options: Additional options for reset
            
        Returns:
            Tuple of (observation, info)
        """
        super().reset(seed=seed)
        
        logger.info("Resetting environment")
        
        # Reset environment state
        self.current_step = 0
        self.episode_start_time = time.time()
        self.last_action_time = self.episode_start_time
        
        try:
            # Start browser if not already started
            if self.browser.driver is None:
                self.browser.start_browser()
            
            # Navigate to application
            success = self.browser.navigate_to_url(self.config.base_url)
            if not success:
                raise RuntimeError(f"Failed to navigate to {self.config.base_url}")
            
            # Login if required
            if self.config.login_required and not self.is_logged_in:
                self._perform_login()
            
            # Navigate to dashboard
            self.browser.navigate_to_url(f"{self.config.base_url}/dashboard")
            
            # Get initial observation
            observation = self.state_observer.get_observation()
            
            # Reset reward calculator
            self.reward_calculator.reset()
            
            info = {
                "episode_step": self.current_step,
                "episode_time": 0.0,
                "logged_in": self.is_logged_in,
                "current_url": self.browser.get_current_url(),
            }
            
            logger.info("Environment reset successfully")
            return observation, info
            
        except Exception as e:
            logger.error(f"Error during environment reset: {e}")
            # Return default observation and error info
            observation = self._get_default_observation()
            info = {"error": str(e), "episode_step": 0}
            return observation, info
    
    def step(self, action: int) -> Tuple[Any, float, bool, bool, Dict[str, Any]]:
        """
        Execute one step in the environment.
        
        Args:
            action: Action to execute (integer from action space)
            
        Returns:
            Tuple of (observation, reward, terminated, truncated, info)
        """
        self.current_step += 1
        current_time = time.time()
        step_start_time = current_time
        
        # Validate action
        if not self.action_space.contains(action):
            logger.warning(f"Invalid action: {action}")
            observation = self.state_observer.get_observation()
            reward = self.config.reward_config.invalid_action_penalty
            info = {
                "error": "Invalid action",
                "episode_step": self.current_step,
                "action_name": "invalid",
            }
            return observation, reward, False, False, info
        
        # Get action name
        action_name = self.action_mapping.get(action, f"unknown_action_{action}")
        logger.debug(f"Executing action {action}: {action_name}")
        
        try:
            # Execute action
            action_success = self.action_executor.execute_action(action, action_name)
            
            # Get new observation
            observation = self.state_observer.get_observation()
            
            # Calculate reward
            reward = self.reward_calculator.calculate_reward(
                action_name=action_name,
                action_success=action_success,
                observation=observation,
                step_time=current_time - step_start_time
            )
            
            # Check termination conditions
            terminated = self._check_terminated()
            truncated = self._check_truncated()
            
            # Update timing
            self.last_action_time = current_time
            
            # Prepare info
            info = {
                "episode_step": self.current_step,
                "episode_time": current_time - self.episode_start_time,
                "action_name": action_name,
                "action_success": action_success,
                "reward_components": self.reward_calculator.get_last_reward_breakdown(),
                "current_url": self.browser.get_current_url(),
            }
            
            return observation, reward, terminated, truncated, info
            
        except Exception as e:
            logger.error(f"Error during step execution: {e}")
            
            # Return safe defaults
            observation = self._get_default_observation()
            reward = self.config.reward_config.invalid_action_penalty
            info = {
                "error": str(e),
                "episode_step": self.current_step,
                "action_name": action_name,
            }
            
            return observation, reward, True, False, info
    
    def render(self, mode: str = "human") -> Optional[np.ndarray]:
        """
        Render the environment.
        
        Args:
            mode: Render mode ("human" or "rgb_array")
            
        Returns:
            RGB array if mode is "rgb_array", None otherwise
        """
        if mode == "rgb_array":
            screenshot = self.browser.get_page_screenshot()
            return screenshot
        elif mode == "human":
            # For human mode, we could open a window showing the browser
            # For now, just take a screenshot and save it
            screenshot = self.browser.get_page_screenshot()
            if screenshot is not None and self.config.save_screenshots:
                self.browser._save_debug_screenshot(screenshot)
            return None
        else:
            raise ValueError(f"Unsupported render mode: {mode}")
    
    def close(self) -> None:
        """Close the environment and clean up resources."""
        logger.info("Closing environment")
        
        if self.browser:
            self.browser.close_browser()
        
        logger.info("Environment closed successfully")
    
    def _perform_login(self) -> bool:
        """Perform login to the application."""
        try:
            # Navigate to login page
            login_url = f"{self.config.base_url}/login"
            if not self.browser.navigate_to_url(login_url):
                return False
            
            # Wait for login form
            if not self.browser.wait_for_element('input[type="email"]', timeout=5.0):
                logger.error("Login form not found")
                return False
            
            # Fill in credentials
            email_success = self.browser.type_text('input[type="email"]', self.config.test_user_email)
            password_success = self.browser.type_text('input[type="password"]', self.config.test_user_password)
            
            if not (email_success and password_success):
                logger.error("Failed to enter login credentials")
                return False
            
            # Submit form
            submit_success = self.browser.click_element('button[type="submit"]')
            if not submit_success:
                logger.error("Failed to click login button")
                return False
            
            # Wait for redirect to dashboard
            time.sleep(2.0)  # Give time for login to process
            
            # Check if we're logged in by looking for dashboard elements
            if self.browser.wait_for_element('[data-testid="dashboard"]', timeout=10.0):
                self.is_logged_in = True
                logger.info("Login successful")
                return True
            else:
                logger.error("Login failed - dashboard not found")
                return False
                
        except Exception as e:
            logger.error(f"Error during login: {e}")
            return False
    
    def _check_terminated(self) -> bool:
        """Check if the episode should be terminated."""
        # Episode terminates if we encounter a critical error
        # or if the browser becomes unresponsive
        try:
            current_url = self.browser.get_current_url()
            if not current_url or "error" in current_url.lower():
                return True
        except Exception:
            return True
        
        return False
    
    def _check_truncated(self) -> bool:
        """Check if the episode should be truncated."""
        # Episode truncates if we exceed max steps or time limit
        if self.current_step >= self.config.max_episode_steps:
            return True
        
        # Optional: Add time-based truncation
        episode_time = time.time() - self.episode_start_time
        max_episode_time = self.config.max_episode_steps * 10.0  # 10 seconds per step max
        if episode_time > max_episode_time:
            return True
        
        return False
    
    def _get_default_observation(self) -> Any:
        """Get a default observation when errors occur."""
        if self.config.observation_mode == "visual":
            # Return black image
            return np.zeros((self.config.screenshot_height, self.config.screenshot_width, 3), dtype=np.uint8)
        elif self.config.observation_mode == "structured":
            # Return zero values for all structured features
            return {
                "task_counts": np.zeros(3, dtype=np.int32),
                "project_count": np.zeros(1, dtype=np.int32),
                "current_view": 0,
                "user_position": np.zeros(2, dtype=np.float32),
                "page_elements": np.zeros(20, dtype=np.float32),
            }
        else:  # hybrid
            return {
                "visual": np.zeros((self.config.screenshot_height, self.config.screenshot_width, 3), dtype=np.uint8),
                "structured": {
                    "task_counts": np.zeros(3, dtype=np.int32),
                    "project_count": np.zeros(1, dtype=np.int32),
                    "current_view": 0,
                    "user_position": np.zeros(2, dtype=np.float32),
                    "page_elements": np.zeros(20, dtype=np.float32),
                }
            }
    
    def get_action_meanings(self) -> Dict[int, str]:
        """Get human-readable meanings for all actions."""
        return self.action_mapping.copy()
    
    def get_current_state_info(self) -> Dict[str, Any]:
        """Get detailed information about current environment state."""
        return {
            "current_step": self.current_step,
            "episode_time": time.time() - self.episode_start_time if self.episode_start_time > 0 else 0,
            "is_logged_in": self.is_logged_in,
            "current_url": self.browser.get_current_url() if self.browser.driver else None,
            "browser_active": self.browser.driver is not None,
            "current_project_id": self.current_project_id,
        }