"""Training episode management and logging utilities."""

import logging
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import numpy as np

from .config import EnvironmentConfig
from .reward_calculator import RewardCalculator

logger = logging.getLogger(__name__)


class TrainingEpisodeManager:
    """Manages training episodes, logging, and performance tracking."""
    
    def __init__(self, config: EnvironmentConfig, log_dir: str = "./training_logs"):
        """Initialize training episode manager."""
        self.config = config
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Episode tracking
        self.current_episode = 0
        self.episode_data: Dict[str, Any] = {}
        self.episode_rewards: List[float] = []
        self.episode_actions: List[Dict[str, Any]] = []
        self.episode_start_time = 0.0
        
        # Performance metrics
        self.total_episodes = 0
        self.total_steps = 0
        self.total_reward = 0.0
        self.best_episode_reward = float('-inf')
        self.worst_episode_reward = float('inf')
        
        # Running averages
        self.reward_history: List[float] = []
        self.episode_length_history: List[int] = []
        self.success_rate_history: List[float] = []
        
        logger.info(f"TrainingEpisodeManager initialized, logs will be saved to {self.log_dir}")
    
    def start_episode(self, episode_number: Optional[int] = None) -> None:
        """Start a new training episode."""
        if episode_number is not None:
            self.current_episode = episode_number
        else:
            self.current_episode += 1
        
        self.episode_start_time = time.time()
        self.episode_data = {
            "episode_number": self.current_episode,
            "start_time": self.episode_start_time,
            "config": self.config.dict() if hasattr(self.config, 'dict') else str(self.config),
        }
        self.episode_rewards.clear()
        self.episode_actions.clear()
        
        logger.info(f"Started episode {self.current_episode}")
    
    def log_step(
        self,
        step_number: int,
        action: int,
        action_name: str,
        reward: float,
        observation: Union[np.ndarray, Dict[str, Any]],
        info: Dict[str, Any]
    ) -> None:
        """Log information for a single step."""
        step_data = {
            "step": step_number,
            "action": action,
            "action_name": action_name,
            "reward": reward,
            "timestamp": time.time(),
            "info": info,
        }
        
        # Add observation summary (avoid storing large arrays)
        if isinstance(observation, np.ndarray):
            step_data["observation_shape"] = observation.shape
            step_data["observation_type"] = "visual"
        elif isinstance(observation, dict):
            if "visual" in observation and "structured" in observation:
                step_data["observation_type"] = "hybrid"
                step_data["visual_shape"] = observation["visual"].shape
                step_data["structured_data"] = observation["structured"]
            elif "task_counts" in observation:
                step_data["observation_type"] = "structured"
                step_data["structured_data"] = observation
            else:
                step_data["observation_type"] = "unknown"
        
        self.episode_rewards.append(reward)
        self.episode_actions.append(step_data)
        
        logger.debug(f"Episode {self.current_episode}, Step {step_number}: {action_name} -> {reward:.3f}")
    
    def end_episode(
        self,
        final_reward: float,
        episode_length: int,
        termination_reason: str,
        reward_calculator: Optional[RewardCalculator] = None
    ) -> Dict[str, Any]:
        """End the current episode and calculate statistics."""
        episode_end_time = time.time()
        episode_duration = episode_end_time - self.episode_start_time
        total_episode_reward = sum(self.episode_rewards)
        
        # Calculate episode bonus if reward calculator is available
        episode_bonus = 0.0
        if reward_calculator:
            episode_bonus = reward_calculator.calculate_episode_bonus()
            total_episode_reward += episode_bonus
        
        # Update episode data
        self.episode_data.update({
            "end_time": episode_end_time,
            "duration": episode_duration,
            "episode_length": episode_length,
            "total_reward": total_episode_reward,
            "episode_bonus": episode_bonus,
            "average_reward": total_episode_reward / max(1, episode_length),
            "termination_reason": termination_reason,
            "actions": self.episode_actions,
            "reward_breakdown": reward_calculator.get_episode_statistics() if reward_calculator else {},
        })
        
        # Update global statistics
        self.total_episodes += 1
        self.total_steps += episode_length
        self.total_reward += total_episode_reward
        
        if total_episode_reward > self.best_episode_reward:
            self.best_episode_reward = total_episode_reward
        if total_episode_reward < self.worst_episode_reward:
            self.worst_episode_reward = total_episode_reward
        
        # Update running averages
        self.reward_history.append(total_episode_reward)
        self.episode_length_history.append(episode_length)
        
        if reward_calculator:
            stats = reward_calculator.get_episode_statistics()
            self.success_rate_history.append(stats.get("success_rate", 0.0))
        
        # Keep only recent history (last 100 episodes)
        if len(self.reward_history) > 100:
            self.reward_history = self.reward_history[-100:]
            self.episode_length_history = self.episode_length_history[-100:]
            self.success_rate_history = self.success_rate_history[-100:]
        
        # Save episode data
        self._save_episode_data()
        
        # Calculate and return episode summary
        episode_summary = self._calculate_episode_summary()
        
        logger.info(f"Episode {self.current_episode} completed: "
                   f"Reward={total_episode_reward:.2f}, "
                   f"Length={episode_length}, "
                   f"Duration={episode_duration:.1f}s, "
                   f"Reason={termination_reason}")
        
        return episode_summary
    
    def _calculate_episode_summary(self) -> Dict[str, Any]:
        """Calculate summary statistics for the current episode."""
        recent_rewards = self.reward_history[-10:] if len(self.reward_history) >= 10 else self.reward_history
        recent_lengths = self.episode_length_history[-10:] if len(self.episode_length_history) >= 10 else self.episode_length_history
        recent_success_rates = self.success_rate_history[-10:] if len(self.success_rate_history) >= 10 else self.success_rate_history
        
        summary = {
            "episode_number": self.current_episode,
            "episode_reward": self.episode_data["total_reward"],
            "episode_length": self.episode_data["episode_length"],
            "episode_duration": self.episode_data["duration"],
            
            # Recent performance (last 10 episodes)
            "recent_avg_reward": np.mean(recent_rewards) if recent_rewards else 0.0,
            "recent_avg_length": np.mean(recent_lengths) if recent_lengths else 0.0,
            "recent_avg_success_rate": np.mean(recent_success_rates) if recent_success_rates else 0.0,
            
            # Overall statistics
            "total_episodes": self.total_episodes,
            "total_steps": self.total_steps,
            "average_reward": self.total_reward / max(1, self.total_episodes),
            "best_episode_reward": self.best_episode_reward,
            "worst_episode_reward": self.worst_episode_reward,
            
            # Performance trends
            "reward_trend": self._calculate_trend(self.reward_history[-20:]) if len(self.reward_history) >= 5 else 0.0,
            "length_trend": self._calculate_trend(self.episode_length_history[-20:]) if len(self.episode_length_history) >= 5 else 0.0,
        }
        
        return summary
    
    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate trend (slope) of recent values."""
        if len(values) < 2:
            return 0.0
        
        x = np.arange(len(values))
        y = np.array(values)
        
        # Simple linear regression slope
        n = len(values)
        slope = (n * np.sum(x * y) - np.sum(x) * np.sum(y)) / (n * np.sum(x * x) - np.sum(x) ** 2)
        
        return slope
    
    def _save_episode_data(self) -> None:
        """Save episode data to JSON file."""
        try:
            episode_file = self.log_dir / f"episode_{self.current_episode:06d}.json"
            
            # Convert numpy arrays to lists for JSON serialization
            episode_data_copy = self._prepare_data_for_json(self.episode_data)
            
            with open(episode_file, 'w') as f:
                json.dump(episode_data_copy, f, indent=2)
            
            logger.debug(f"Saved episode data to {episode_file}")
            
        except Exception as e:
            logger.error(f"Error saving episode data: {e}")
    
    def _prepare_data_for_json(self, data: Any) -> Any:
        """Prepare data for JSON serialization by converting numpy arrays."""
        if isinstance(data, np.ndarray):
            return data.tolist()
        elif isinstance(data, np.integer):
            return int(data)
        elif isinstance(data, np.floating):
            return float(data)
        elif isinstance(data, dict):
            return {key: self._prepare_data_for_json(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._prepare_data_for_json(item) for item in data]
        else:
            return data
    
    def save_training_summary(self) -> None:
        """Save overall training summary."""
        try:
            summary = {
                "total_episodes": self.total_episodes,
                "total_steps": self.total_steps,
                "total_reward": self.total_reward,
                "average_reward": self.total_reward / max(1, self.total_episodes),
                "best_episode_reward": self.best_episode_reward,
                "worst_episode_reward": self.worst_episode_reward,
                "config": self.config.dict() if hasattr(self.config, 'dict') else str(self.config),
                "reward_history": self.reward_history,
                "episode_length_history": self.episode_length_history,
                "success_rate_history": self.success_rate_history,
                "timestamp": time.time(),
            }
            
            summary_file = self.log_dir / "training_summary.json"
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"Saved training summary to {summary_file}")
            
        except Exception as e:
            logger.error(f"Error saving training summary: {e}")
    
    def load_training_history(self, log_dir: Optional[str] = None) -> bool:
        """Load training history from previous sessions."""
        try:
            load_dir = Path(log_dir) if log_dir else self.log_dir
            summary_file = load_dir / "training_summary.json"
            
            if not summary_file.exists():
                logger.info("No previous training history found")
                return False
            
            with open(summary_file, 'r') as f:
                summary = json.load(f)
            
            # Restore state
            self.total_episodes = summary.get("total_episodes", 0)
            self.total_steps = summary.get("total_steps", 0)
            self.total_reward = summary.get("total_reward", 0.0)
            self.best_episode_reward = summary.get("best_episode_reward", float('-inf'))
            self.worst_episode_reward = summary.get("worst_episode_reward", float('inf'))
            self.reward_history = summary.get("reward_history", [])
            self.episode_length_history = summary.get("episode_length_history", [])
            self.success_rate_history = summary.get("success_rate_history", [])
            
            # Set current episode to continue from where we left off
            self.current_episode = self.total_episodes
            
            logger.info(f"Loaded training history: {self.total_episodes} episodes, "
                       f"avg reward: {self.total_reward / max(1, self.total_episodes):.2f}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading training history: {e}")
            return False
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        if not self.reward_history:
            return {"error": "No training data available"}
        
        recent_rewards = self.reward_history[-10:] if len(self.reward_history) >= 10 else self.reward_history
        
        return {
            "episodes_completed": self.total_episodes,
            "total_steps": self.total_steps,
            "average_reward": self.total_reward / max(1, self.total_episodes),
            "recent_average_reward": np.mean(recent_rewards),
            "best_reward": self.best_episode_reward,
            "worst_reward": self.worst_episode_reward,
            "reward_std": np.std(self.reward_history),
            "average_episode_length": np.mean(self.episode_length_history) if self.episode_length_history else 0,
            "average_success_rate": np.mean(self.success_rate_history) if self.success_rate_history else 0,
            "improvement_trend": self._calculate_trend(self.reward_history[-20:]) if len(self.reward_history) >= 5 else 0.0,
        }