#!/usr/bin/env python3
"""
Command-line interface for the Asana Replica RL Environment.

This CLI provides easy access to environment testing, training, and configuration.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any, Optional

from .environment import AsanaReplicaEnv
from .config import EnvironmentConfig, RewardConfig
from .reward_calculator import RewardScenarioManager
from .training_manager import TrainingEpisodeManager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_environment(args: argparse.Namespace) -> None:
    """Test the environment with basic functionality."""
    logger.info("Testing Asana Replica RL Environment")
    
    # Create configuration
    config = EnvironmentConfig(
        base_url=args.url,
        browser=args.browser,
        headless=args.headless,
        observation_mode=args.observation_mode,
        max_episode_steps=args.max_steps,
        debug_mode=args.debug,
    )
    
    # Create environment
    env = AsanaReplicaEnv(config)
    
    try:
        logger.info("Initializing environment...")
        observation, info = env.reset()
        logger.info(f"Environment initialized successfully. Info: {info}")
        
        # Test a few random actions
        logger.info("Testing random actions...")
        for i in range(min(10, args.max_steps)):
            action = env.action_space.sample()
            action_name = env.get_action_meanings()[action]
            
            logger.info(f"Step {i+1}: Executing {action_name}")
            observation, reward, terminated, truncated, info = env.step(action)
            
            logger.info(f"  Reward: {reward:.3f}")
            if info.get("reward_components"):
                logger.info(f"  Reward breakdown: {info['reward_components']}")
            
            if terminated or truncated:
                logger.info(f"  Episode ended: {'terminated' if terminated else 'truncated'}")
                break
        
        logger.info("Environment test completed successfully")
        
    except Exception as e:
        logger.error(f"Environment test failed: {e}")
        sys.exit(1)
    
    finally:
        env.close()


def run_training(args: argparse.Namespace) -> None:
    """Run training with specified configuration."""
    logger.info(f"Starting training with scenario: {args.scenario}")
    
    # Load reward configuration
    scenario_manager = RewardScenarioManager()
    reward_config = scenario_manager.get_scenario_config(args.scenario)
    
    # Create environment configuration
    config = EnvironmentConfig(
        base_url=args.url,
        browser=args.browser,
        headless=args.headless,
        observation_mode=args.observation_mode,
        max_episode_steps=args.max_steps,
        reward_config=reward_config,
        debug_mode=args.debug,
    )
    
    # Create environment and training manager
    env = AsanaReplicaEnv(config)
    training_manager = TrainingEpisodeManager(config, log_dir=args.log_dir)
    
    try:
        # Load previous training history if requested
        if args.resume:
            training_manager.load_training_history()
        
        logger.info(f"Training for {args.episodes} episodes")
        
        for episode in range(args.episodes):
            logger.info(f"\n--- Episode {episode + 1}/{args.episodes} ---")
            
            # Start episode
            training_manager.start_episode()
            
            # Reset environment
            observation, info = env.reset()
            
            episode_reward = 0.0
            step_count = 0
            
            while True:
                # Random action (replace with your RL algorithm)
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
                
                if step_count % 20 == 0:
                    logger.info(f"Step {step_count}: {action_name} -> {reward:.3f}")
                
                if terminated or truncated:
                    break
            
            # End episode
            episode_summary = training_manager.end_episode(
                final_reward=episode_reward,
                episode_length=step_count,
                termination_reason="terminated" if terminated else "truncated",
                reward_calculator=env.reward_calculator
            )
            
            logger.info(f"Episode {episode + 1} completed: Reward={episode_reward:.2f}, Length={step_count}")
        
        # Save final results
        training_manager.save_training_summary()
        metrics = training_manager.get_performance_metrics()
        
        logger.info("\n--- Training Summary ---")
        for key, value in metrics.items():
            if isinstance(value, float):
                logger.info(f"{key}: {value:.3f}")
            else:
                logger.info(f"{key}: {value}")
        
    except KeyboardInterrupt:
        logger.info("Training interrupted by user")
    
    except Exception as e:
        logger.error(f"Training failed: {e}")
        sys.exit(1)
    
    finally:
        env.close()


def list_actions(args: argparse.Namespace) -> None:
    """List all available actions."""
    config = EnvironmentConfig()
    env = AsanaReplicaEnv(config)
    
    action_meanings = env.get_action_meanings()
    
    print("\nAvailable Actions:")
    print("=" * 50)
    
    # Group actions by category
    categories = {
        "Navigation": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        "Project Management": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        "Task Management": [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
        "Collaboration": [35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
        "View & Filter": [45, 46, 47, 48, 49],
    }
    
    for category, action_ids in categories.items():
        print(f"\n{category}:")
        print("-" * len(category))
        for action_id in action_ids:
            if action_id in action_meanings:
                print(f"  {action_id:2d}: {action_meanings[action_id]}")
    
    env.close()


def create_config(args: argparse.Namespace) -> None:
    """Create a configuration file."""
    config = EnvironmentConfig(
        base_url=args.url,
        browser=args.browser,
        headless=args.headless,
        observation_mode=args.observation_mode,
        max_episode_steps=args.max_steps,
    )
    
    config_dict = config.dict() if hasattr(config, 'dict') else {
        "base_url": config.base_url,
        "browser": config.browser,
        "headless": config.headless,
        "observation_mode": config.observation_mode,
        "max_episode_steps": config.max_episode_steps,
    }
    
    output_file = Path(args.output)
    with open(output_file, 'w') as f:
        json.dump(config_dict, f, indent=2)
    
    logger.info(f"Configuration saved to {output_file}")


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Asana Replica RL Environment CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test the environment
  asana-rl-env test --url http://localhost:3000

  # Run training with efficiency scenario
  asana-rl-env train --scenario efficiency-training --episodes 10

  # List all available actions
  asana-rl-env actions

  # Create a configuration file
  asana-rl-env config --output my_config.json
        """
    )
    
    # Global arguments
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    # Subcommands
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Test command
    test_parser = subparsers.add_parser("test", help="Test environment functionality")
    test_parser.add_argument("--url", default="http://localhost:3000", help="Application URL")
    test_parser.add_argument("--browser", choices=["chrome", "firefox"], default="chrome", help="Browser type")
    test_parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    test_parser.add_argument("--observation-mode", choices=["visual", "structured", "hybrid"], 
                           default="hybrid", help="Observation mode")
    test_parser.add_argument("--max-steps", type=int, default=50, help="Maximum steps for test")
    
    # Train command
    train_parser = subparsers.add_parser("train", help="Run training")
    train_parser.add_argument("--scenario", choices=["efficiency-training", "collaboration", "project-creation"],
                            default="efficiency-training", help="Training scenario")
    train_parser.add_argument("--episodes", type=int, default=10, help="Number of episodes")
    train_parser.add_argument("--url", default="http://localhost:3000", help="Application URL")
    train_parser.add_argument("--browser", choices=["chrome", "firefox"], default="chrome", help="Browser type")
    train_parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    train_parser.add_argument("--observation-mode", choices=["visual", "structured", "hybrid"],
                            default="structured", help="Observation mode")
    train_parser.add_argument("--max-steps", type=int, default=200, help="Maximum steps per episode")
    train_parser.add_argument("--log-dir", default="./training_logs", help="Directory for training logs")
    train_parser.add_argument("--resume", action="store_true", help="Resume from previous training")
    
    # Actions command
    actions_parser = subparsers.add_parser("actions", help="List available actions")
    
    # Config command
    config_parser = subparsers.add_parser("config", help="Create configuration file")
    config_parser.add_argument("--output", default="env_config.json", help="Output configuration file")
    config_parser.add_argument("--url", default="http://localhost:3000", help="Application URL")
    config_parser.add_argument("--browser", choices=["chrome", "firefox"], default="chrome", help="Browser type")
    config_parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    config_parser.add_argument("--observation-mode", choices=["visual", "structured", "hybrid"],
                             default="hybrid", help="Observation mode")
    config_parser.add_argument("--max-steps", type=int, default=1000, help="Maximum steps per episode")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Set logging level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Execute command
    if args.command == "test":
        test_environment(args)
    elif args.command == "train":
        run_training(args)
    elif args.command == "actions":
        list_actions(args)
    elif args.command == "config":
        create_config(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()