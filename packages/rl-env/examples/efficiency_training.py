#!/usr/bin/env python3
"""
Efficiency-focused training example for the Asana Replica RL Environment.

This script demonstrates training with the efficiency reward configuration,
focusing on task completion speed and workflow optimization.
"""

import logging
import time
from typing import Dict, Any, List

import gymnasium as gym
import numpy as np

from asana_replica_rl_env import AsanaReplicaEnv, EnvironmentConfig, RewardConfig
from asana_replica_rl_env.training_manager import TrainingEpisodeManager
from asana_replica_rl_env.reward_calculator import RewardScenarioManager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SimpleTaskCompletionAgent:
    """
    A simple agent that prioritizes task completion actions.
    
    This agent demonstrates a basic strategy for the efficiency training scenario.
    """
    
    def __init__(self, action_meanings: Dict[int, str]):
        """Initialize the agent with action mappings."""
        self.action_meanings = action_meanings
        
        # Define action priorities for efficiency training
        self.high_priority_actions = [
            "create_new_task",
            "change_task_status_completed",
            "set_task_assignee",
            "set_task_due_date",
            "edit_task_name",
        ]
        
        self.medium_priority_actions = [
            "create_new_project",
            "open_task_detail",
            "edit_task_description",
            "set_task_priority",
        ]
        
        self.low_priority_actions = [
            "navigate_to_project_list",
            "navigate_to_project_board",
            "add_comment",
        ]
        
        # Build action priority mapping
        self.action_priorities = {}
        for action_id, action_name in action_meanings.items():
            if action_name in self.high_priority_actions:
                self.action_priorities[action_id] = 3
            elif action_name in self.medium_priority_actions:
                self.action_priorities[action_id] = 2
            elif action_name in self.low_priority_actions:
                self.action_priorities[action_id] = 1
            else:
                self.action_priorities[action_id] = 0
    
    def select_action(self, observation: Any, step_count: int) -> int:
        """
        Select action based on simple heuristics.
        
        Args:
            observation: Current environment observation
            step_count: Current step number in episode
            
        Returns:
            Selected action ID
        """
        # Early in episode, focus on setup actions
        if step_count < 10:
            setup_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if action_name in ["create_new_project", "create_new_task", "navigate_to_projects"]
            ]
            if setup_actions:
                return np.random.choice(setup_actions)
        
        # Mid-episode, focus on task management
        elif step_count < 50:
            task_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if action_name in self.high_priority_actions
            ]
            if task_actions:
                return np.random.choice(task_actions)
        
        # Late in episode, focus on completion
        else:
            completion_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if "completed" in action_name or "finish" in action_name
            ]
            if completion_actions:
                return np.random.choice(completion_actions)
        
        # Fallback: weighted random selection based on priorities
        action_ids = list(self.action_meanings.keys())
        weights = [self.action_priorities.get(action_id, 0.1) for action_id in action_ids]
        
        # Normalize weights
        weights = np.array(weights)
        weights = weights / np.sum(weights)
        
        return np.random.choice(action_ids, p=weights)


def main():
    """Run efficiency-focused training."""
    
    # Load efficiency reward configuration
    scenario_manager = RewardScenarioManager()
    reward_config = scenario_manager.get_scenario_config("efficiency-training")
    
    # Configure environment
    config = EnvironmentConfig(
        base_url="http://localhost:3000",
        browser="chrome",
        headless=True,
        observation_mode="structured",  # Use structured observations for this example
        max_episode_steps=200,
        reward_config=reward_config,
        debug_mode=True,
    )
    
    # Create environment
    env = AsanaReplicaEnv(config)
    
    # Create training manager
    training_manager = TrainingEpisodeManager(config, log_dir="./logs/efficiency_training")
    
    # Create agent
    agent = SimpleTaskCompletionAgent(env.get_action_meanings())
    
    # Training parameters
    num_episodes = 20
    
    logger.info(f"Starting efficiency training for {num_episodes} episodes")
    logger.info(f"Reward configuration: efficiency-training")
    logger.info(f"Action space: {env.action_space}")
    
    # Track performance metrics
    episode_rewards: List[float] = []
    episode_lengths: List[int] = []
    task_completion_rates: List[float] = []
    
    try:
        for episode in range(num_episodes):
            logger.info(f"\n--- Episode {episode + 1}/{num_episodes} ---")
            
            # Start episode
            training_manager.start_episode(episode + 1)
            
            # Reset environment
            observation, info = env.reset()
            logger.info(f"Episode started. Initial state: {info}")
            
            episode_reward = 0.0
            step_count = 0
            initial_task_counts = None
            
            while True:
                # Extract task counts for completion tracking
                if isinstance(observation, dict) and "structured" in observation:
                    current_task_counts = observation["structured"]["task_counts"]
                elif isinstance(observation, dict) and "task_counts" in observation:
                    current_task_counts = observation["task_counts"]
                else:
                    current_task_counts = np.zeros(3)
                
                if initial_task_counts is None:
                    initial_task_counts = current_task_counts.copy()
                
                # Agent selects action
                action = agent.select_action(observation, step_count)
                action_name = env.get_action_meanings()[action]
                
                # Execute action
                observation, reward, terminated, truncated, info = env.step(action)
                
                # Log step
                training_manager.log_step(
                    step_number=step_count,
                    action=action,
                    action_name=action_name,
                    reward=reward,
                    observation=observation,
                    info=info
                )
                
                episode_reward += reward
                step_count += 1
                
                # Log progress every 20 steps
                if step_count % 20 == 0:
                    logger.info(f"Step {step_count}: Recent action: {action_name}, "
                               f"Reward: {reward:.3f}, Cumulative: {episode_reward:.3f}")
                    
                    if info.get("reward_components"):
                        components = info["reward_components"]
                        logger.info(f"  Reward breakdown: completion={components.get('task_completion', 0):.2f}, "
                                   f"creation={components.get('task_creation', 0):.2f}, "
                                   f"efficiency={components.get('efficiency_bonus', 0):.2f}")
                
                # Check termination
                if terminated or truncated:
                    termination_reason = "terminated" if terminated else "truncated"
                    logger.info(f"Episode ended: {termination_reason}")
                    break
            
            # Calculate task completion rate
            final_task_counts = current_task_counts
            tasks_completed = final_task_counts[2] - initial_task_counts[2]  # Completed tasks
            total_tasks = np.sum(final_task_counts)
            completion_rate = tasks_completed / max(1, total_tasks) if total_tasks > 0 else 0.0
            
            # End episode
            episode_summary = training_manager.end_episode(
                final_reward=episode_reward,
                episode_length=step_count,
                termination_reason=termination_reason,
                reward_calculator=env.reward_calculator
            )
            
            # Track metrics
            episode_rewards.append(episode_reward)
            episode_lengths.append(step_count)
            task_completion_rates.append(completion_rate)
            
            # Print episode summary
            logger.info(f"Episode {episode + 1} Summary:")
            logger.info(f"  Total Reward: {episode_summary['episode_reward']:.2f}")
            logger.info(f"  Episode Length: {episode_summary['episode_length']}")
            logger.info(f"  Tasks Completed: {tasks_completed}")
            logger.info(f"  Completion Rate: {completion_rate:.2%}")
            logger.info(f"  Efficiency Score: {episode_reward / step_count:.3f}")
            
            # Show improvement trend
            if len(episode_rewards) >= 5:
                recent_avg = np.mean(episode_rewards[-5:])
                overall_avg = np.mean(episode_rewards)
                logger.info(f"  Recent Avg Reward: {recent_avg:.2f} (Overall: {overall_avg:.2f})")
            
            # Brief pause between episodes
            time.sleep(0.5)
    
    except KeyboardInterrupt:
        logger.info("Training interrupted by user")
    
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise
    
    finally:
        # Save training summary
        training_manager.save_training_summary()
        
        # Calculate and display final metrics
        if episode_rewards:
            logger.info("\n--- Final Training Results ---")
            logger.info(f"Episodes Completed: {len(episode_rewards)}")
            logger.info(f"Average Reward: {np.mean(episode_rewards):.2f} ± {np.std(episode_rewards):.2f}")
            logger.info(f"Best Episode Reward: {np.max(episode_rewards):.2f}")
            logger.info(f"Average Episode Length: {np.mean(episode_lengths):.1f}")
            logger.info(f"Average Task Completion Rate: {np.mean(task_completion_rates):.2%}")
            
            # Show improvement over time
            if len(episode_rewards) >= 10:
                first_half = episode_rewards[:len(episode_rewards)//2]
                second_half = episode_rewards[len(episode_rewards)//2:]
                improvement = np.mean(second_half) - np.mean(first_half)
                logger.info(f"Improvement (first vs second half): {improvement:+.2f}")
        
        # Close environment
        env.close()
        logger.info("Efficiency training completed successfully")


if __name__ == "__main__":
    main()