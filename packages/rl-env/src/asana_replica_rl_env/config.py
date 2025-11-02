"""Configuration classes for the Asana Replica RL Environment."""

from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, validator


class RewardConfig(BaseModel):
    """Configuration for reward calculation."""
    
    # Task completion rewards
    task_completion_reward: float = Field(default=10.0, description="Reward for completing a task")
    task_creation_reward: float = Field(default=2.0, description="Reward for creating a task")
    task_assignment_reward: float = Field(default=1.0, description="Reward for assigning a task")
    
    # Project management rewards
    project_creation_reward: float = Field(default=5.0, description="Reward for creating a project")
    project_organization_reward: float = Field(default=3.0, description="Reward for organizing projects")
    
    # Efficiency rewards
    quick_action_bonus: float = Field(default=0.5, description="Bonus for quick actions")
    workflow_efficiency_multiplier: float = Field(default=1.2, description="Multiplier for efficient workflows")
    
    # Penalties
    invalid_action_penalty: float = Field(default=-1.0, description="Penalty for invalid actions")
    timeout_penalty: float = Field(default=-5.0, description="Penalty for action timeouts")
    navigation_penalty: float = Field(default=-0.1, description="Small penalty for excessive navigation")
    
    # Collaboration rewards
    comment_creation_reward: float = Field(default=1.5, description="Reward for adding comments")
    team_interaction_bonus: float = Field(default=2.0, description="Bonus for team interactions")
    
    # Time-based modifiers
    deadline_bonus_multiplier: float = Field(default=1.5, description="Multiplier for meeting deadlines")
    overdue_penalty_multiplier: float = Field(default=0.5, description="Penalty multiplier for overdue tasks")


class EnvironmentConfig(BaseModel):
    """Configuration for the RL environment."""
    
    # Application settings
    base_url: str = Field(default="http://localhost:3000", description="Base URL of the Asana replica app")
    login_required: bool = Field(default=True, description="Whether login is required")
    test_user_email: str = Field(default="test@example.com", description="Test user email for login")
    test_user_password: str = Field(default="password123", description="Test user password")
    
    # Browser settings
    browser: Literal["chrome", "firefox"] = Field(default="chrome", description="Browser type to use")
    headless: bool = Field(default=True, description="Run browser in headless mode")
    window_width: int = Field(default=1920, description="Browser window width")
    window_height: int = Field(default=1080, description="Browser window height")
    
    # Environment settings
    observation_mode: Literal["visual", "structured", "hybrid"] = Field(
        default="hybrid", description="Type of observations to provide"
    )
    max_episode_steps: int = Field(default=1000, description="Maximum steps per episode")
    action_timeout: float = Field(default=10.0, description="Timeout for actions in seconds")
    
    # Reward settings
    reward_config: RewardConfig = Field(default_factory=RewardConfig, description="Reward configuration")
    reward_config_file: Optional[str] = Field(default=None, description="Path to reward config JSON file")
    
    # Observation settings
    screenshot_width: int = Field(default=800, description="Screenshot width for visual observations")
    screenshot_height: int = Field(default=600, description="Screenshot height for visual observations")
    
    # Logging and debugging
    debug_mode: bool = Field(default=False, description="Enable debug logging")
    save_screenshots: bool = Field(default=False, description="Save screenshots for debugging")
    screenshot_dir: str = Field(default="./screenshots", description="Directory to save screenshots")
    
    @validator('base_url')
    def validate_base_url(cls, v: str) -> str:
        """Validate base URL format."""
        if not v.startswith(('http://', 'https://')):
            raise ValueError('base_url must start with http:// or https://')
        return v.rstrip('/')
    
    @validator('window_width', 'window_height')
    def validate_dimensions(cls, v: int) -> int:
        """Validate window dimensions."""
        if v < 100:
            raise ValueError('Window dimensions must be at least 100 pixels')
        return v
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> "EnvironmentConfig":
        """Create config from dictionary."""
        return cls(**config_dict)
    
    @classmethod
    def load_reward_config(cls, config_file: str) -> RewardConfig:
        """Load reward configuration from JSON file."""
        import json
        with open(config_file, 'r') as f:
            config_data = json.load(f)
        return RewardConfig(**config_data)