#!/usr/bin/env python3
"""
Basic training example for the Asana Replica RL Environment.

This script demonstrates how to use the environment for basic RL training
with random actions and reward tracking.
"""

import logging
import time
from typing import Dict, Any

import gymnasium as gym
import numpy as np

from asana_replica_rl_env import AsanaReplicaEnv, EnvironmentConfig
from asana_replica_rl_env.training_manager import TrainingEpisodeManager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def main():
    """Run basic training with random actions."""
    
    # Configure environment
    config = EnvironmentConfig(
        base_url="http://localhost:3000",
        browser="chrome",
        headless=True,
        observation_mode="hybrid",
        max_episode_steps=100,
        debug_mode=True,
        save_screenshots=False,
    )
    
    # Create environment
    env = AsanaReplicaEnv(config)
    
    # Create training manager
    training_manager = TrainingEpisodeManager(config, log_dir="./logs/basic_training")
    
    # Training parameters
    num_episodes = 10
    
    logger.info(f"Starting basic training for {num_episodes} episodes")
    logger.info(f"Action space: {env.action_space}")
    logger.info(f"Observation space: {env.observation_space}")
    
    try:
        for episode in range(num_episodes):
            logger.info(f"\n--- Episode {episode + 1}/{num_episodes} ---")
            
            # Start episode
            training_manager.start_episode(episode + 1)
            
            # Reset environment
            observation, info = env.reset()
            logger.info(f"Episode started. Info: {info}")
            
            episode_reward = 0.0
            step_count = 0
            
            while True:
                # Take random action
                action = env.action_space.sample()
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
                
                logger.info(f"Step {step_count}: {action_name} -> Reward: {reward:.3f}, "
                           f"Cumulative: {episode_reward:.3f}")
                
                if info.get("reward_components"):
                    logger.debug(f"Reward breakdown: {info['reward_components']}")
                
                # Check termination
                if terminated or truncated:
                    termination_reason = "terminated" if terminated else "truncated"
                    logger.info(f"Episode ended: {termination_reason}")
                    break
            
            # End episode
            episode_summary = training_manager.end_episode(
                final_reward=episode_reward,
                episode_length=step_count,
                termination_reason=termination_reason,
                reward_calculator=env.reward_calculator
            )
            
            # Print episode summary
            logger.info(f"Episode {episode + 1} Summary:")
            logger.info(f"  Total Reward: {episode_summary['episode_reward']:.2f}")
            logger.info(f"  Episode Length: {episode_summary['episode_length']}")
            logger.info(f"  Average Reward: {episode_summary['episode_reward'] / episode_summary['episode_length']:.3f}")
            logger.info(f"  Recent Avg Reward: {episode_summary['recent_avg_reward']:.2f}")
            
            # Brief pause between episodes
            time.sleep(1.0)
    
    except KeyboardInterrupt:
        logger.info("Training interrupted by user")
    
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise
    
    finally:
        # Save training summary
        training_manager.save_training_summary()
        
        # Get final performance metrics
        metrics = training_manager.get_performance_metrics()
        logger.info("\n--- Final Training Metrics ---")
        for key, value in metrics.items():
            if isinstance(value, float):
                logger.info(f"{key}: {value:.3f}")
            else:
                logger.info(f"{key}: {value}")
        
        # Close environment
        env.close()
        logger.info("Training completed successfully")


if __name__ == "__main__":
    main()