"""State observation system for extracting environment state."""

import logging
import re
from typing import Dict, Any, List, Optional, Union
import numpy as np
from selenium.webdriver.common.by import By

from .browser_automation import BrowserAutomation
from .config import EnvironmentConfig

logger = logging.getLogger(__name__)


class StateObserver:
    """Observes and extracts state information from the Asana replica application."""
    
    def __init__(self, browser: BrowserAutomation, config: EnvironmentConfig):
        """Initialize state observer."""
        self.browser = browser
        self.config = config
        
        # Selectors for extracting state information
        self.state_selectors = {
            # Task counting
            "todo_tasks": '[data-testid="task-card"][data-status="todo"]',
            "in_progress_tasks": '[data-testid="task-card"][data-status="in_progress"]',
            "completed_tasks": '[data-testid="task-card"][data-status="completed"]',
            "all_tasks": '[data-testid="task-card"]',
            
            # Project counting
            "project_cards": '[data-testid="project-card"]',
            
            # View detection
            "list_view_active": '[data-testid="view-list"].active',
            "board_view_active": '[data-testid="view-board"].active',
            "timeline_view_active": '[data-testid="view-timeline"].active',
            "calendar_view_active": '[data-testid="view-calendar"].active',
            "dashboard_view": '[data-testid="dashboard"]',
            
            # UI elements visibility
            "create_task_btn": '[data-testid="create-task-btn"]',
            "create_project_btn": '[data-testid="create-project-btn"]',
            "search_input": '[data-testid="search-input"]',
            "filter_buttons": '[data-testid^="filter-"]',
            "task_detail_modal": '[data-testid="task-detail-modal"]',
            "project_settings": '[data-testid="project-settings"]',
            "user_menu": '[data-testid="user-menu"]',
            "workspace_selector": '[data-testid="workspace-selector"]',
            "notification_bell": '[data-testid="notification-bell"]',
            "sidebar": '[data-testid="sidebar"]',
            
            # Content indicators
            "loading_spinner": '[data-testid="loading"]',
            "error_message": '[data-testid="error"]',
            "empty_state": '[data-testid="empty-state"]',
            "success_message": '[data-testid="success"]',
        }
    
    def get_observation(self) -> Union[np.ndarray, Dict[str, Any]]:
        """
        Get current observation based on configured observation mode.
        
        Returns:
            Observation in the format specified by observation_mode
        """
        try:
            if self.config.observation_mode == "visual":
                return self._get_visual_observation()
            elif self.config.observation_mode == "structured":
                return self._get_structured_observation()
            else:  # hybrid
                return self._get_hybrid_observation()
                
        except Exception as e:
            logger.error(f"Error getting observation: {e}")
            return self._get_default_observation()
    
    def _get_visual_observation(self) -> np.ndarray:
        """Get visual observation (screenshot)."""
        screenshot = self.browser.get_page_screenshot()
        if screenshot is not None:
            return screenshot
        else:
            # Return black image as fallback
            return np.zeros((self.config.screenshot_height, self.config.screenshot_width, 3), dtype=np.uint8)
    
    def _get_structured_observation(self) -> Dict[str, Any]:
        """Get structured observation (DOM-based features)."""
        return {
            "task_counts": self._get_task_counts(),
            "project_count": self._get_project_count(),
            "current_view": self._get_current_view(),
            "user_position": self._get_user_position(),
            "page_elements": self._get_page_elements_visibility(),
        }
    
    def _get_hybrid_observation(self) -> Dict[str, Any]:
        """Get hybrid observation (visual + structured)."""
        return {
            "visual": self._get_visual_observation(),
            "structured": self._get_structured_observation(),
        }
    
    def _get_task_counts(self) -> np.ndarray:
        """Get counts of tasks by status."""
        try:
            todo_count = len(self.browser.find_elements(self.state_selectors["todo_tasks"]))
            in_progress_count = len(self.browser.find_elements(self.state_selectors["in_progress_tasks"]))
            completed_count = len(self.browser.find_elements(self.state_selectors["completed_tasks"]))
            
            return np.array([todo_count, in_progress_count, completed_count], dtype=np.int32)
            
        except Exception as e:
            logger.error(f"Error getting task counts: {e}")
            return np.zeros(3, dtype=np.int32)
    
    def _get_project_count(self) -> np.ndarray:
        """Get count of projects."""
        try:
            project_count = len(self.browser.find_elements(self.state_selectors["project_cards"]))
            return np.array([project_count], dtype=np.int32)
            
        except Exception as e:
            logger.error(f"Error getting project count: {e}")
            return np.zeros(1, dtype=np.int32)
    
    def _get_current_view(self) -> int:
        """Get current view mode as integer."""
        try:
            # Check which view is active
            if self.browser.is_element_present(self.state_selectors["dashboard_view"]):
                return 0  # dashboard
            elif self.browser.is_element_present(self.state_selectors["list_view_active"]):
                return 1  # list
            elif self.browser.is_element_present(self.state_selectors["board_view_active"]):
                return 2  # board
            elif self.browser.is_element_present(self.state_selectors["timeline_view_active"]):
                return 3  # timeline
            elif self.browser.is_element_present(self.state_selectors["calendar_view_active"]):
                return 4  # calendar
            else:
                return 0  # default to dashboard
                
        except Exception as e:
            logger.error(f"Error getting current view: {e}")
            return 0
    
    def _get_user_position(self) -> np.ndarray:
        """Get normalized user position on page (scroll position)."""
        try:
            # Get scroll position
            scroll_x = self.browser.execute_javascript("return window.pageXOffset;") or 0
            scroll_y = self.browser.execute_javascript("return window.pageYOffset;") or 0
            
            # Get page dimensions
            page_width = self.browser.execute_javascript("return document.body.scrollWidth;") or 1
            page_height = self.browser.execute_javascript("return document.body.scrollHeight;") or 1
            
            # Normalize to [0, 1]
            normalized_x = min(1.0, max(0.0, scroll_x / page_width))
            normalized_y = min(1.0, max(0.0, scroll_y / page_height))
            
            return np.array([normalized_x, normalized_y], dtype=np.float32)
            
        except Exception as e:
            logger.error(f"Error getting user position: {e}")
            return np.zeros(2, dtype=np.float32)
    
    def _get_page_elements_visibility(self) -> np.ndarray:
        """Get visibility flags for important page elements."""
        try:
            # Define elements to check (20 elements total)
            elements_to_check = [
                "create_task_btn",
                "create_project_btn", 
                "search_input",
                "task_detail_modal",
                "project_settings",
                "user_menu",
                "workspace_selector",
                "notification_bell",
                "sidebar",
                "loading_spinner",
                "error_message",
                "empty_state",
                "success_message",
            ]
            
            # Add filter buttons (up to 7 more elements)
            filter_elements = self.browser.find_elements(self.state_selectors["filter_buttons"])
            for i, _ in enumerate(filter_elements[:7]):
                elements_to_check.append(f"filter_button_{i}")
            
            # Pad to exactly 20 elements
            while len(elements_to_check) < 20:
                elements_to_check.append("placeholder")
            
            # Check visibility for each element
            visibility_flags = []
            for element_key in elements_to_check:
                if element_key.startswith("filter_button_"):
                    # Special handling for filter buttons
                    idx = int(element_key.split("_")[-1])
                    if idx < len(filter_elements):
                        visibility_flags.append(1.0)
                    else:
                        visibility_flags.append(0.0)
                elif element_key == "placeholder":
                    visibility_flags.append(0.0)
                else:
                    selector = self.state_selectors.get(element_key)
                    if selector and self.browser.is_element_present(selector):
                        visibility_flags.append(1.0)
                    else:
                        visibility_flags.append(0.0)
            
            return np.array(visibility_flags[:20], dtype=np.float32)
            
        except Exception as e:
            logger.error(f"Error getting page elements visibility: {e}")
            return np.zeros(20, dtype=np.float32)
    
    def _get_default_observation(self) -> Union[np.ndarray, Dict[str, Any]]:
        """Get default observation when errors occur."""
        if self.config.observation_mode == "visual":
            return np.zeros((self.config.screenshot_height, self.config.screenshot_width, 3), dtype=np.uint8)
        elif self.config.observation_mode == "structured":
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
    
    def get_detailed_state_info(self) -> Dict[str, Any]:
        """Get detailed state information for debugging and analysis."""
        try:
            current_url = self.browser.get_current_url()
            page_title = self.browser.execute_javascript("return document.title;") or ""
            
            # Extract additional state information
            state_info = {
                "url": current_url,
                "page_title": page_title,
                "task_counts": self._get_task_counts().tolist(),
                "project_count": self._get_project_count().tolist(),
                "current_view": self._get_current_view(),
                "scroll_position": self._get_user_position().tolist(),
                "visible_elements": self._get_visible_element_names(),
                "page_load_state": self.browser.execute_javascript("return document.readyState;"),
                "has_errors": self._check_for_errors(),
                "is_loading": self._check_if_loading(),
            }
            
            return state_info
            
        except Exception as e:
            logger.error(f"Error getting detailed state info: {e}")
            return {"error": str(e)}
    
    def _get_visible_element_names(self) -> List[str]:
        """Get names of currently visible elements."""
        visible_elements = []
        
        for element_name, selector in self.state_selectors.items():
            if self.browser.is_element_present(selector):
                visible_elements.append(element_name)
        
        return visible_elements
    
    def _check_for_errors(self) -> bool:
        """Check if there are any error messages on the page."""
        error_selectors = [
            self.state_selectors["error_message"],
            '[data-testid="error"]',
            '.error',
            '[role="alert"]',
        ]
        
        for selector in error_selectors:
            if self.browser.is_element_present(selector):
                return True
        
        return False
    
    def _check_if_loading(self) -> bool:
        """Check if the page is currently loading."""
        loading_selectors = [
            self.state_selectors["loading_spinner"],
            '[data-testid="loading"]',
            '.loading',
            '.spinner',
        ]
        
        for selector in loading_selectors:
            if self.browser.is_element_present(selector):
                return True
        
        return False
    
    def extract_task_details(self) -> List[Dict[str, Any]]:
        """Extract detailed information about visible tasks."""
        try:
            tasks = []
            task_elements = self.browser.find_elements(self.state_selectors["all_tasks"])
            
            for i, task_element in enumerate(task_elements):
                try:
                    task_info = {
                        "index": i,
                        "name": self.browser.get_element_attribute(f'{self.state_selectors["all_tasks"]}:nth-child({i+1})', "data-task-name") or "",
                        "status": self.browser.get_element_attribute(f'{self.state_selectors["all_tasks"]}:nth-child({i+1})', "data-status") or "",
                        "priority": self.browser.get_element_attribute(f'{self.state_selectors["all_tasks"]}:nth-child({i+1})', "data-priority") or "",
                        "assignee": self.browser.get_element_attribute(f'{self.state_selectors["all_tasks"]}:nth-child({i+1})', "data-assignee") or "",
                        "due_date": self.browser.get_element_attribute(f'{self.state_selectors["all_tasks"]}:nth-child({i+1})', "data-due-date") or "",
                        "is_visible": True,
                    }
                    tasks.append(task_info)
                    
                except Exception as e:
                    logger.debug(f"Error extracting task {i} details: {e}")
                    continue
            
            return tasks
            
        except Exception as e:
            logger.error(f"Error extracting task details: {e}")
            return []
    
    def extract_project_details(self) -> List[Dict[str, Any]]:
        """Extract detailed information about visible projects."""
        try:
            projects = []
            project_elements = self.browser.find_elements(self.state_selectors["project_cards"])
            
            for i, project_element in enumerate(project_elements):
                try:
                    project_info = {
                        "index": i,
                        "name": self.browser.get_element_attribute(f'{self.state_selectors["project_cards"]}:nth-child({i+1})', "data-project-name") or "",
                        "status": self.browser.get_element_attribute(f'{self.state_selectors["project_cards"]}:nth-child({i+1})', "data-status") or "",
                        "color": self.browser.get_element_attribute(f'{self.state_selectors["project_cards"]}:nth-child({i+1})', "data-color") or "",
                        "task_count": self.browser.get_element_attribute(f'{self.state_selectors["project_cards"]}:nth-child({i+1})', "data-task-count") or "0",
                        "is_visible": True,
                    }
                    projects.append(project_info)
                    
                except Exception as e:
                    logger.debug(f"Error extracting project {i} details: {e}")
                    continue
            
            return projects
            
        except Exception as e:
            logger.error(f"Error extracting project details: {e}")
            return []