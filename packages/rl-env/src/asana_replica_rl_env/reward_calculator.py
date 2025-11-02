"""Reward calculation system for RL training scenarios."""

import logging
import time
from typing import Dict, Any, List, Optional, Union
import numpy as np

from .config import RewardConfig

logger = logging.getLogger(__name__)


class RewardCalculator:
    """Calculates rewards for RL agent actions based on configurable scenarios."""
    
    def __init__(self, reward_config: RewardConfig):
        """Initialize reward calculator with configuration."""
        self.config = reward_config
        
        # Track state for reward calculation
        self.previous_task_counts = np.zeros(3, dtype=np.int32)  # [todo, in_progress, completed]
        self.previous_project_count = 0
        self.action_history: List[Dict[str, Any]] = []
        self.episode_start_time = time.time()
        self.last_reward_breakdown: Dict[str, float] = {}
        
        # Performance tracking
        self.tasks_completed_this_episode = 0
        self.tasks_created_this_episode = 0
        self.projects_created_this_episode = 0
        self.comments_added_this_episode = 0
        self.invalid_actions_count = 0
        self.total_actions_count = 0
        
        logger.info("RewardCalculator initialized")
    
    def reset(self) -> None:
        """Reset reward calculator for new episode."""
        self.previous_task_counts = np.zeros(3, dtype=np.int32)
        self.previous_project_count = 0
        self.action_history.clear()
        self.episode_start_time = time.time()
        self.last_reward_breakdown.clear()
        
        # Reset performance tracking
        self.tasks_completed_this_episode = 0
        self.tasks_created_this_episode = 0
        self.projects_created_this_episode = 0
        self.comments_added_this_episode = 0
        self.invalid_actions_count = 0
        self.total_actions_count = 0
        
        logger.debug("RewardCalculator reset for new episode")
    
    def calculate_reward(
        self,
        action_name: str,
        action_success: bool,
        observation: Union[np.ndarray, Dict[str, Any]],
        step_time: float
    ) -> float:
        """
        Calculate reward for the current step.
        
        Args:
            action_name: Name of the action executed
            action_success: Whether the action was successful
            observation: Current environment observation
            step_time: Time taken to execute the action
            
        Returns:
            Calculated reward value
        """
        self.total_actions_count += 1
        
        # Initialize reward components
        reward_components = {
            "base_action": 0.0,
            "task_completion": 0.0,
            "task_creation": 0.0,
            "project_management": 0.0,
            "efficiency_bonus": 0.0,
            "collaboration": 0.0,
            "penalty": 0.0,
        }
        
        # Extract current state from observation
        current_state = self._extract_state_from_observation(observation)
        
        # Calculate base action reward/penalty
        if not action_success:
            reward_components["penalty"] += self.config.invalid_action_penalty
            self.invalid_actions_count += 1
        else:
            reward_components["base_action"] += self._calculate_base_action_reward(action_name)
        
        # Calculate task-related rewards
        task_rewards = self._calculate_task_rewards(current_state, action_name)
        reward_components.update(task_rewards)
        
        # Calculate project-related rewards
        project_rewards = self._calculate_project_rewards(current_state, action_name)
        reward_components.update(project_rewards)
        
        # Calculate efficiency bonuses
        efficiency_bonus = self._calculate_efficiency_bonus(action_name, step_time)
        reward_components["efficiency_bonus"] += efficiency_bonus
        
        # Calculate collaboration rewards
        collaboration_reward = self._calculate_collaboration_reward(action_name)
        reward_components["collaboration"] += collaboration_reward
        
        # Calculate time-based penalties
        time_penalty = self._calculate_time_penalty(step_time)
        reward_components["penalty"] += time_penalty
        
        # Update state tracking
        self._update_state_tracking(current_state, action_name, action_success)
        
        # Calculate total reward
        total_reward = sum(reward_components.values())
        
        # Store reward breakdown for debugging
        self.last_reward_breakdown = reward_components.copy()
        self.last_reward_breakdown["total"] = total_reward
        
        logger.debug(f"Reward for {action_name}: {total_reward:.3f} (components: {reward_components})")
        
        return total_reward
    
    def _extract_state_from_observation(self, observation: Union[np.ndarray, Dict[str, Any]]) -> Dict[str, Any]:
        """Extract relevant state information from observation."""
        if isinstance(observation, dict):
            if "structured" in observation:
                # Hybrid observation
                structured = observation["structured"]
                return {
                    "task_counts": structured.get("task_counts", np.zeros(3, dtype=np.int32)),
                    "project_count": structured.get("project_count", np.zeros(1, dtype=np.int32))[0],
                    "current_view": structured.get("current_view", 0),
                    "page_elements": structured.get("page_elements", np.zeros(20, dtype=np.float32)),
                }
            else:
                # Pure structured observation
                return {
                    "task_counts": observation.get("task_counts", np.zeros(3, dtype=np.int32)),
                    "project_count": observation.get("project_count", np.zeros(1, dtype=np.int32))[0],
                    "current_view": observation.get("current_view", 0),
                    "page_elements": observation.get("page_elements", np.zeros(20, dtype=np.float32)),
                }
        else:
            # Visual observation - return default state
            return {
                "task_counts": np.zeros(3, dtype=np.int32),
                "project_count": 0,
                "current_view": 0,
                "page_elements": np.zeros(20, dtype=np.float32),
            }
    
    def _calculate_base_action_reward(self, action_name: str) -> float:
        """Calculate base reward for successful actions."""
        # Different actions have different base values
        action_rewards = {
            # High-value actions
            "create_new_task": 0.5,
            "create_new_project": 1.0,
            "change_task_status_completed": 0.8,
            "add_comment": 0.3,
            
            # Medium-value actions
            "edit_task_name": 0.2,
            "edit_task_description": 0.2,
            "set_task_assignee": 0.3,
            "set_task_due_date": 0.3,
            "set_task_priority": 0.2,
            
            # Low-value actions
            "navigate_to_project_list": 0.1,
            "navigate_to_project_board": 0.1,
            "scroll_up": 0.05,
            "scroll_down": 0.05,
            
            # Neutral actions
            "refresh_page": 0.0,
        }
        
        return action_rewards.get(action_name, 0.1)  # Default small positive reward
    
    def _calculate_task_rewards(self, current_state: Dict[str, Any], action_name: str) -> Dict[str, float]:
        """Calculate task-related rewards."""
        rewards = {"task_completion": 0.0, "task_creation": 0.0}
        
        current_task_counts = current_state["task_counts"]
        
        # Check for task completion (increase in completed tasks)
        completed_diff = current_task_counts[2] - self.previous_task_counts[2]
        if completed_diff > 0:
            rewards["task_completion"] = completed_diff * self.config.task_completion_reward
            self.tasks_completed_this_episode += completed_diff
            
            # Bonus for completing tasks quickly
            episode_time = time.time() - self.episode_start_time
            if episode_time < 300:  # 5 minutes
                rewards["task_completion"] *= self.config.deadline_bonus_multiplier
        
        # Check for task creation (increase in total tasks)
        total_current = np.sum(current_task_counts)
        total_previous = np.sum(self.previous_task_counts)
        tasks_created = total_current - total_previous
        
        if tasks_created > 0:
            rewards["task_creation"] = tasks_created * self.config.task_creation_reward
            self.tasks_created_this_episode += tasks_created
        
        # Bonus for task assignment actions
        if action_name == "set_task_assignee":
            rewards["task_creation"] += self.config.task_assignment_reward
        
        return rewards
    
    def _calculate_project_rewards(self, current_state: Dict[str, Any], action_name: str) -> Dict[str, float]:
        """Calculate project-related rewards."""
        rewards = {"project_management": 0.0}
        
        current_project_count = current_state["project_count"]
        
        # Check for project creation
        projects_created = current_project_count - self.previous_project_count
        if projects_created > 0:
            rewards["project_management"] = projects_created * self.config.project_creation_reward
            self.projects_created_this_episode += projects_created
        
        # Bonus for project organization actions
        organization_actions = [
            "edit_project", "change_project_color", "add_project_member",
            "set_project_status", "archive_project"
        ]
        if action_name in organization_actions:
            rewards["project_management"] += self.config.project_organization_reward
        
        return rewards
    
    def _calculate_efficiency_bonus(self, action_name: str, step_time: float) -> float:
        """Calculate efficiency-based bonuses."""
        bonus = 0.0
        
        # Quick action bonus
        if step_time < 2.0:  # Action completed in under 2 seconds
            bonus += self.config.quick_action_bonus
        
        # Workflow efficiency bonus
        if len(self.action_history) >= 3:
            recent_actions = [entry["action_name"] for entry in self.action_history[-3:]]
            
            # Bonus for efficient workflows
            efficient_sequences = [
                ["create_new_task", "set_task_assignee", "set_task_due_date"],
                ["create_new_project", "create_new_task", "set_task_assignee"],
                ["open_task_detail", "edit_task_description", "add_comment"],
            ]
            
            for sequence in efficient_sequences:
                if recent_actions == sequence:
                    bonus += self.config.workflow_efficiency_multiplier
                    break
        
        return bonus
    
    def _calculate_collaboration_reward(self, action_name: str) -> float:
        """Calculate collaboration-related rewards."""
        collaboration_actions = {
            "add_comment": self.config.comment_creation_reward,
            "reply_to_comment": self.config.comment_creation_reward * 0.8,
            "mention_user": self.config.team_interaction_bonus,
            "add_project_member": self.config.team_interaction_bonus,
            "set_task_assignee": self.config.team_interaction_bonus * 0.5,
        }
        
        reward = collaboration_actions.get(action_name, 0.0)
        
        if action_name == "add_comment":
            self.comments_added_this_episode += 1
        
        return reward
    
    def _calculate_time_penalty(self, step_time: float) -> float:
        """Calculate time-based penalties."""
        penalty = 0.0
        
        # Timeout penalty
        if step_time > self.config.action_timeout:
            penalty += self.config.timeout_penalty
        
        # Navigation penalty for excessive scrolling/navigation
        navigation_actions = ["scroll_up", "scroll_down", "refresh_page", "navigate_to_dashboard"]
        recent_navigation = sum(1 for entry in self.action_history[-5:] 
                              if entry["action_name"] in navigation_actions)
        
        if recent_navigation > 3:  # More than 3 navigation actions in last 5 steps
            penalty += self.config.navigation_penalty * (recent_navigation - 3)
        
        return penalty
    
    def _update_state_tracking(self, current_state: Dict[str, Any], action_name: str, action_success: bool) -> None:
        """Update internal state tracking."""
        # Update previous state
        self.previous_task_counts = current_state["task_counts"].copy()
        self.previous_project_count = current_state["project_count"]
        
        # Add to action history
        action_entry = {
            "action_name": action_name,
            "success": action_success,
            "timestamp": time.time(),
            "step_number": self.total_actions_count,
        }
        self.action_history.append(action_entry)
        
        # Keep only recent history (last 20 actions)
        if len(self.action_history) > 20:
            self.action_history = self.action_history[-20:]
    
    def get_last_reward_breakdown(self) -> Dict[str, float]:
        """Get detailed breakdown of the last calculated reward."""
        return self.last_reward_breakdown.copy()
    
    def get_episode_statistics(self) -> Dict[str, Any]:
        """Get statistics for the current episode."""
        episode_time = time.time() - self.episode_start_time
        success_rate = (self.total_actions_count - self.invalid_actions_count) / max(1, self.total_actions_count)
        
        return {
            "episode_time": episode_time,
            "total_actions": self.total_actions_count,
            "invalid_actions": self.invalid_actions_count,
            "success_rate": success_rate,
            "tasks_completed": self.tasks_completed_this_episode,
            "tasks_created": self.tasks_created_this_episode,
            "projects_created": self.projects_created_this_episode,
            "comments_added": self.comments_added_this_episode,
            "actions_per_minute": self.total_actions_count / max(1, episode_time / 60),
        }
    
    def calculate_episode_bonus(self) -> float:
        """Calculate bonus reward at the end of episode based on overall performance."""
        stats = self.get_episode_statistics()
        bonus = 0.0
        
        # Completion rate bonus
        if stats["tasks_completed"] > 0:
            completion_rate = stats["tasks_completed"] / max(1, stats["tasks_created"])
            bonus += completion_rate * 10.0  # Up to 10 points for 100% completion
        
        # Efficiency bonus
        if stats["success_rate"] > 0.8:  # 80% success rate
            bonus += (stats["success_rate"] - 0.8) * 25.0  # Up to 5 points for perfect success
        
        # Productivity bonus
        if stats["actions_per_minute"] > 2.0:  # More than 2 actions per minute
            bonus += min(5.0, (stats["actions_per_minute"] - 2.0) * 2.0)
        
        # Collaboration bonus
        if stats["comments_added"] > 0:
            bonus += min(3.0, stats["comments_added"] * 0.5)
        
        return bonus


class RewardScenarioManager:
    """Manages different reward scenarios for various training objectives."""
    
    def __init__(self):
        """Initialize scenario manager."""
        self.scenarios = {
            "efficiency-training": self._create_efficiency_scenario(),
            "collaboration": self._create_collaboration_scenario(),
            "project-creation": self._create_project_creation_scenario(),
        }
    
    def get_scenario_config(self, scenario_name: str) -> RewardConfig:
        """Get reward configuration for a specific scenario."""
        if scenario_name in self.scenarios:
            return self.scenarios[scenario_name]
        else:
            logger.warning(f"Unknown scenario: {scenario_name}, using default")
            return RewardConfig()
    
    def _create_efficiency_scenario(self) -> RewardConfig:
        """Create reward configuration focused on efficiency and speed."""
        return RewardConfig(
            task_completion_reward=15.0,  # High reward for completing tasks
            task_creation_reward=3.0,
            project_creation_reward=8.0,
            quick_action_bonus=1.0,  # Bonus for fast actions
            workflow_efficiency_multiplier=2.0,  # High bonus for efficient workflows
            invalid_action_penalty=-2.0,  # Higher penalty for mistakes
            timeout_penalty=-8.0,
            navigation_penalty=-0.2,  # Penalty for excessive navigation
        )
    
    def _create_collaboration_scenario(self) -> RewardConfig:
        """Create reward configuration focused on collaboration features."""
        return RewardConfig(
            comment_creation_reward=5.0,  # High reward for comments
            team_interaction_bonus=4.0,  # High bonus for team interactions
            task_assignment_reward=3.0,  # Reward for assigning tasks
            task_completion_reward=8.0,  # Lower task completion reward
            project_creation_reward=6.0,
            invalid_action_penalty=-1.0,  # Lower penalty to encourage exploration
        )
    
    def _create_project_creation_scenario(self) -> RewardConfig:
        """Create reward configuration focused on project setup and organization."""
        return RewardConfig(
            project_creation_reward=20.0,  # Very high reward for creating projects
            project_organization_reward=8.0,  # High reward for organizing projects
            task_creation_reward=5.0,  # Higher reward for creating tasks
            task_completion_reward=6.0,  # Lower completion reward
            workflow_efficiency_multiplier=1.5,
            invalid_action_penalty=-1.5,
        )