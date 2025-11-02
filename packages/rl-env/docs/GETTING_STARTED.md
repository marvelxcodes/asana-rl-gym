# Getting Started with Asana Replica RL Environment

This guide will help you set up and start using the Asana Replica RL Environment for training reinforcement learning agents on project management tasks.

## Prerequisites

- Python 3.8 or higher
- Chrome or Firefox browser installed
- Asana replica web application running (typically at `http://localhost:3000`)

## Installation

### Option 1: Install from source (recommended for development)

```bash
# Clone the repository and navigate to the RL environment package
cd packages/rl-env

# Install in development mode
pip install -e .

# Or install with development dependencies
pip install -e ".[dev]"
```

### Option 2: Install from requirements.txt

```bash
cd packages/rl-env
pip install -r requirements.txt
```

## Quick Start

### 1. Test the Environment

First, verify that the environment works correctly:

```bash
# Test with default settings
asana-rl-env test

# Test with custom URL and browser
asana-rl-env test --url http://localhost:3000 --browser chrome --headless
```

### 2. Basic Usage in Python

```python
import gymnasium as gym
from asana_replica_rl_env import AsanaReplicaEnv

# Create environment with default configuration
env = AsanaReplicaEnv()

# Reset environment
observation, info = env.reset()

# Take random actions
for _ in range(100):
    action = env.action_space.sample()
    observation, reward, terminated, truncated, info = env.step(action)
    
    if terminated or truncated:
        observation, info = env.reset()

env.close()
```

### 3. Run Example Training Scripts

The package includes several example training scripts:

```bash
# Basic random training
python examples/basic_training.py

# Efficiency-focused training
python examples/efficiency_training.py

# Collaboration-focused training
python examples/collaboration_training.py
```

## Configuration

### Environment Configuration

The environment can be configured using the `EnvironmentConfig` class:

```python
from asana_replica_rl_env import EnvironmentConfig, AsanaReplicaEnv

config = EnvironmentConfig(
    base_url="http://localhost:3000",
    browser="chrome",
    headless=True,
    observation_mode="hybrid",
    max_episode_steps=1000,
    debug_mode=False,
)

env = AsanaReplicaEnv(config)
```

### Key Configuration Options

- **`base_url`**: URL of the Asana replica application
- **`browser`**: Browser type ("chrome" or "firefox")
- **`headless`**: Run browser without GUI (recommended for training)
- **`observation_mode`**: Type of observations ("visual", "structured", or "hybrid")
- **`max_episode_steps`**: Maximum steps per episode
- **`reward_config`**: Reward configuration (see Reward System section)

### Observation Modes

1. **Visual**: RGB screenshots of the browser window
2. **Structured**: DOM-based features (task counts, UI elements, etc.)
3. **Hybrid**: Combination of visual and structured observations

## Action Space

The environment provides 50 discrete actions covering:

- **Navigation** (0-9): Dashboard, projects, views, scrolling
- **Project Management** (10-19): Create, edit, organize projects
- **Task Management** (20-34): Create, edit, assign, complete tasks
- **Collaboration** (35-44): Comments, mentions, file attachments
- **View & Filter** (45-49): Filtering, sorting, searching

View all available actions:

```bash
asana-rl-env actions
```

## Reward System

The environment includes configurable reward systems for different training scenarios:

### Built-in Scenarios

1. **Efficiency Training**: Focuses on task completion speed and workflow optimization
2. **Collaboration**: Emphasizes team interaction and communication
3. **Project Creation**: Rewards project setup and organization

### Using Reward Scenarios

```python
from asana_replica_rl_env.reward_calculator import RewardScenarioManager

# Load a specific scenario
scenario_manager = RewardScenarioManager()
reward_config = scenario_manager.get_scenario_config("efficiency-training")

# Use in environment configuration
config = EnvironmentConfig(reward_config=reward_config)
env = AsanaReplicaEnv(config)
```

### Custom Reward Configuration

Create custom reward configurations using JSON files:

```json
{
  "task_completion_reward": 15.0,
  "task_creation_reward": 3.0,
  "project_creation_reward": 8.0,
  "quick_action_bonus": 1.0,
  "invalid_action_penalty": -2.0,
  "comment_creation_reward": 2.0
}
```

Load custom configuration:

```python
config = EnvironmentConfig(reward_config_file="my_rewards.json")
```

## Training Management

The environment includes training management utilities for logging and performance tracking:

```python
from asana_replica_rl_env.training_manager import TrainingEpisodeManager

# Create training manager
training_manager = TrainingEpisodeManager(config, log_dir="./logs")

# Training loop
for episode in range(num_episodes):
    training_manager.start_episode(episode + 1)
    
    # ... run episode ...
    
    episode_summary = training_manager.end_episode(
        final_reward=total_reward,
        episode_length=steps,
        termination_reason="completed",
        reward_calculator=env.reward_calculator
    )

# Save training summary
training_manager.save_training_summary()
```

## CLI Usage

The package includes a command-line interface for common tasks:

```bash
# Test environment
asana-rl-env test --url http://localhost:3000 --headless

# Run training
asana-rl-env train --scenario efficiency-training --episodes 20

# List available actions
asana-rl-env actions

# Create configuration file
asana-rl-env config --output my_config.json
```

## Troubleshooting

### Common Issues

1. **Browser not found**: Install Chrome or Firefox, or use webdriver-manager to auto-download drivers
2. **Application not accessible**: Ensure the Asana replica app is running at the specified URL
3. **Selenium errors**: Check browser compatibility and update webdriver-manager

### Debug Mode

Enable debug mode for detailed logging:

```python
config = EnvironmentConfig(debug_mode=True, save_screenshots=True)
```

Or via CLI:

```bash
asana-rl-env test --debug
```

### Performance Tips

1. Use headless mode for faster training
2. Use structured observations for better performance
3. Limit episode length for faster iteration
4. Save screenshots only when debugging

## Next Steps

- Explore the example training scripts in the `examples/` directory
- Read the [API Reference](API_REFERENCE.md) for detailed documentation
- Check out [Training Scenarios](TRAINING_SCENARIOS.md) for advanced usage
- See [Integration Guide](INTEGRATION_GUIDE.md) for using with RL libraries

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the example scripts
3. Enable debug mode for detailed error information
4. Check the logs in the training directory