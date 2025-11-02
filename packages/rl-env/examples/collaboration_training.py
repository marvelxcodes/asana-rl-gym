#!/usr/bin/env python3
"""
Collaboration-focused training example for the Asana Replica RL Environment.

This script demonstrates training with the collaboration reward configuration,
focusing on team interaction and communication features.
"""

import logging
import time
from typing import Dict, Any, List

import gymnasium as gym
import numpy as np

from asana_replica_rl_env import AsanaReplicaEnv, EnvironmentConfig
from asana_replica_rl_env.training_manager import TrainingEpisodeManager
from asana_replica_rl_env.reward_calculator import RewardScenarioManager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CollaborationAgent:
    """
    An agent that focuses on collaboration and team interaction actions.
    """
    
    def __init__(self, action_meanings: Dict[int, str]):
        """Initialize the collaboration-focused agent."""
        self.action_meanings = action_meanings
        
        # Define collaboration-focused action priorities
        self.collaboration_actions = [
            "add_comment",
            "reply_to_comment",
            "mention_user",
            "set_task_assignee",
            "add_project_member",
        ]
        
        self.task_management_actions = [
            "create_new_task",
            "edit_task_description",
            "set_task_due_date",
            "set_task_priority",
        ]
        
        self.project_actions = [
            "create_new_project",
            "edit_project",
            "add_project_member",
        ]
        
        # Track interaction patterns
        self.recent_actions: List[str] = []
        self.comment_count = 0
        self.assignment_count = 0
    
    def select_action(self, observation: Any, step_count: int) -> int:
        """
        Select action with focus on collaboration.
        
        Args:
            observation: Current environment observation
            step_count: Current step number in episode
            
        Returns:
            Selected action ID
        """
        # Update recent actions history
        if len(self.recent_actions) > 10:
            self.recent_actions = self.recent_actions[-10:]
        
        # Early episode: Set up projects and tasks
        if step_count < 15:
            setup_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if action_name in self.project_actions + ["navigate_to_projects", "create_new_task"]
            ]
            if setup_actions:
                return np.random.choice(setup_actions)
        
        # Mid episode: Focus on collaboration
        elif step_count < 80:
            # Prioritize collaboration actions
            collab_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if action_name in self.collaboration_actions
            ]
            
            # Mix in some task management
            task_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if action_name in self.task_management_actions
            ]
            
            # Weighted selection favoring collaboration
            all_actions = collab_actions + task_actions
            weights = [3.0] * len(collab_actions) + [1.0] * len(task_actions)
            
            if all_actions:
                weights = np.array(weights) / np.sum(weights)
                return np.random.choice(all_actions, p=weights)
        
        # Late episode: Complete tasks and add final comments
        else:
            completion_actions = [
                action_id for action_id, action_name in self.action_meanings.items()
                if "completed" in action_name or action_name in ["add_comment", "edit_task_description"]
            ]
            if completion_actions:
                return np.random.choice(completion_actions)
        
        # Fallback: random action
        return np.random.choice(list(self.action_meanings.keys()))
    
    def update_action_history(self, action_name: str) -> None:
        """Update action history for pattern tracking."""
        self.recent_actions.append(action_name)
        
        if action_name == "add_comment":
            self.comment_count += 1
        elif action_name == "set_task_assignee":
            self.assignment_count += 1


def main():
    """Run collaboration-focused training."""
    
    # Load collaboration reward configuration
    scenario_manager = RewardScenarioManager()
    reward_config = scenario_manager.get_scenario_config("collaboration")
    
    # Configure environment
    config = EnvironmentConfig(
        base_url="http://localhost:3000",
        browser="chrome",
        headless=True,
        observation_mode="hybrid",
        max_episode_steps=150,
        reward_config=reward_config,
        debug_mode=True,
    )
    
    # Create environment
    env = AsanaReplicaEnv(config)
    
    # Create training manager
    training_manager = TrainingEpisodeManager(config, log_dir="./logs/collaboration_training")
    
    # Create agent
    agent = CollaborationAgent(env.get_action_meanings())
    
    # Training parameters
    num_episodes = 15
    
    logger.info(f"Starting collaboration training for {num_episodes} episodes")
    logger.info(f"Reward configuration: collaboration")
    
    # Track collaboration metrics
    episode_rewards: List[float] = []
    collaboration_scores: List[float] = []
    
    try:
        for episode in range(num_episodes):
            logger.info(f"\n--- Episode {episode + 1}/{num_episodes} ---")
            
            # Reset agent state
            agent.recent_actions.clear()
            agent.comment_count = 0
            agent.assignment_count = 0
            
            # Start episode
            training_manager.start_episode(episode + 1)
            
            # Reset environment
            observation, info = env.reset()
            logger.info(f"Episode started")
            
            episode_reward = 0.0
            step_count = 0
            collaboration_reward_total = 0.0
            
            while True:
                # Agent selects action
                action = agent.select_action(observation, step_count)
                action_name = env.get_action_meanings()[action]
                
                # Update agent's action history
                agent.update_action_history(action_name)
                
                # Execute action
                observation, reward, terminated, truncated, info = env.step(action)
                
                # Track collaboration rewards
                if info.get("reward_components"):
                    collab_reward = info["reward_components"].get("collaboration", 0.0)
                    collaboration_reward_total += collab_reward
                
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
                
                # Log collaboration actions
                if action_name in agent.collaboration_actions:
                    logger.info(f"Step {step_count}: COLLABORATION - {action_name} -> {reward:.3f}")
                
                # Periodic progress report
                if step_count % 25 == 0:
                    logger.info(f"Step {step_count}: Comments: {agent.comment_count}, "
                               f"Assignments: {agent.assignment_count}, "
                               f"Collab Reward: {collaboration_reward_total:.2f}")
                
                # Check termination
                if terminated or truncated:
                    termination_reason = "terminated" if terminated else "truncated"
                    logger.info(f"Episode ended: {termination_reason}")
                    break
            
            # Calculate collaboration score
            collaboration_score = collaboration_reward_total / max(1, step_count)
            
            # End episode
            episode_summary = training_manager.end_episode(
                final_reward=episode_reward,
                episode_length=step_count,
                termination_reason=termination_reason,
                reward_calculator=env.reward_calculator
            )
            
            # Track metrics
            episode_rewards.append(episode_reward)
            collaboration_scores.append(collaboration_score)
            
            # Print episode summary
            logger.info(f"Episode {episode + 1} Summary:")
            logger.info(f"  Total Reward: {episode_summary['episode_reward']:.2f}")
            logger.info(f"  Collaboration Score: {collaboration_score:.3f}")
            logger.info(f"  Comments Added: {agent.comment_count}")
            logger.info(f"  Task Assignments: {agent.assignment_count}")
            logger.info(f"  Collaboration Actions: {len([a for a in agent.recent_actions if a in agent.collaboration_actions])}")
            
            # Show improvement trend
            if len(collaboration_scores) >= 3:
                recent_collab_avg = np.mean(collaboration_scores[-3:])
                logger.info(f"  Recent Collaboration Avg: {recent_collab_avg:.3f}")
            
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
            logger.info("\n--- Final Collaboration Training Results ---")
            logger.info(f"Episodes Completed: {len(episode_rewards)}")
            logger.info(f"Average Reward: {np.mean(episode_rewards):.2f} ± {np.std(episode_rewards):.2f}")
            logger.info(f"Average Collaboration Score: {np.mean(collaboration_scores):.3f}")
            logger.info(f"Best Episode Reward: {np.max(episode_rewards):.2f}")
            logger.info(f"Best Collaboration Score: {np.max(collaboration_scores):.3f}")
            
            # Analyze collaboration improvement
            if len(collaboration_scores) >= 6:
                first_third = collaboration_scores[:len(collaboration_scores)//3]
                last_third = collaboration_scores[-len(collaboration_scores)//3:]
                improvement = np.mean(last_third) - np.mean(first_third)
                logger.info(f"Collaboration Improvement: {improvement:+.3f}")
        
        # Close environment
        env.close()
        logger.info("Collaboration training completed successfully")


if __name__ == "__main__":
    main()