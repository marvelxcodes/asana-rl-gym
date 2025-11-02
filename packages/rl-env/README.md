# Asana Replica RL Environment

A Gymnasium-compatible reinforcement learning environment for training AI agents on project management tasks using the Asana replica web application.

## Features

- **Gymnasium Interface**: Standard RL environment interface compatible with popular RL libraries
- **Web Automation**: Selenium WebDriver integration for browser-based interactions
- **Configurable Rewards**: Flexible reward system for different training scenarios
- **Multi-Browser Support**: Chrome and Firefox WebDriver support
- **Observation Modes**: Visual (screenshots) and structured (DOM-based) observations

## Installation

```bash
# Install the package in development mode
pip install -e .

# Install with development dependencies
pip install -e ".[dev]"
```

## Quick Start

```python
import gymnasium as gym
from asana_replica_rl_env import AsanaReplicaEnv

# Create environment
env = AsanaReplicaEnv(config={
    "base_url": "http://localhost:3000",
    "browser": "chrome",
    "headless": True,
    "reward_config": "efficiency-training"
})

# Standard RL loop
observation, info = env.reset()
for _ in range(1000):
    action = env.action_space.sample()  # Random action
    observation, reward, terminated, truncated, info = env.step(action)
    if terminated or truncated:
        observation, info = env.reset()

env.close()
```

## Configuration

The environment supports various configuration options:

- `base_url`: URL of the Asana replica application
- `browser`: Browser type ("chrome" or "firefox")
- `headless`: Run browser in headless mode
- `reward_config`: Reward configuration file or preset name
- `observation_mode`: "visual", "structured", or "hybrid"
- `max_episode_steps`: Maximum steps per episode

## Reward Configurations

The environment includes several pre-configured reward scenarios:

- `efficiency-training`: Rewards efficient task completion and project management
- `collaboration`: Focuses on team collaboration and communication
- `project-creation`: Emphasizes project setup and organization skills

Custom reward configurations can be provided via JSON files.