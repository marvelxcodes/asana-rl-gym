"""Action execution system for UI interactions."""

import logging
import time
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By

from .browser_automation import BrowserAutomation
from .config import EnvironmentConfig

logger = logging.getLogger(__name__)


class ActionExecutor:
    """Executes actions in the Asana replica application through browser automation."""
    
    def __init__(self, browser: BrowserAutomation, config: EnvironmentConfig):
        """Initialize action executor."""
        self.browser = browser
        self.config = config
        
        # Common selectors for UI elements (using data-testid attributes)
        self.selectors = {
            # Navigation
            "dashboard_link": '[data-testid="nav-dashboard"]',
            "projects_link": '[data-testid="nav-projects"]',
            "workspace_selector": '[data-testid="workspace-selector"]',
            
            # Project elements
            "create_project_btn": '[data-testid="create-project-btn"]',
            "project_card": '[data-testid="project-card"]',
            "project_name_input": '[data-testid="project-name-input"]',
            "project_description_input": '[data-testid="project-description-input"]',
            
            # Task elements
            "create_task_btn": '[data-testid="create-task-btn"]',
            "task_card": '[data-testid="task-card"]',
            "task_name_input": '[data-testid="task-name-input"]',
            "task_description_input": '[data-testid="task-description-input"]',
            "task_assignee_select": '[data-testid="task-assignee-select"]',
            "task_due_date_input": '[data-testid="task-due-date-input"]',
            "task_priority_select": '[data-testid="task-priority-select"]',
            
            # Status columns (for Kanban board)
            "todo_column": '[data-testid="status-column-todo"]',
            "in_progress_column": '[data-testid="status-column-in-progress"]',
            "completed_column": '[data-testid="status-column-completed"]',
            
            # View switchers
            "list_view_btn": '[data-testid="view-list"]',
            "board_view_btn": '[data-testid="view-board"]',
            "timeline_view_btn": '[data-testid="view-timeline"]',
            "calendar_view_btn": '[data-testid="view-calendar"]',
            
            # Comments
            "comment_input": '[data-testid="comment-input"]',
            "comment_submit_btn": '[data-testid="comment-submit"]',
            
            # Filters and search
            "search_input": '[data-testid="search-input"]',
            "filter_assignee": '[data-testid="filter-assignee"]',
            "filter_status": '[data-testid="filter-status"]',
            "filter_due_date": '[data-testid="filter-due-date"]',
        }
    
    def execute_action(self, action_id: int, action_name: str) -> bool:
        """
        Execute a specific action.
        
        Args:
            action_id: Numeric action identifier
            action_name: Human-readable action name
            
        Returns:
            True if action was executed successfully, False otherwise
        """
        try:
            # Map action name to execution method
            action_method = getattr(self, f"_action_{action_name}", None)
            
            if action_method is None:
                logger.warning(f"No implementation for action: {action_name}")
                return False
            
            # Execute the action with timeout
            start_time = time.time()
            success = action_method()
            execution_time = time.time() - start_time
            
            if execution_time > self.config.action_timeout:
                logger.warning(f"Action {action_name} took {execution_time:.2f}s (timeout: {self.config.action_timeout}s)")
            
            logger.debug(f"Action {action_name} executed in {execution_time:.2f}s, success: {success}")
            return success
            
        except Exception as e:
            logger.error(f"Error executing action {action_name}: {e}")
            return False
    
    # Navigation actions
    def _action_navigate_to_dashboard(self) -> bool:
        """Navigate to dashboard."""
        return self.browser.navigate_to_url(f"{self.config.base_url}/dashboard")
    
    def _action_navigate_to_projects(self) -> bool:
        """Navigate to projects page."""
        return self.browser.navigate_to_url(f"{self.config.base_url}/projects")
    
    def _action_navigate_to_project_list(self) -> bool:
        """Switch to list view."""
        return self.browser.click_element(self.selectors["list_view_btn"])
    
    def _action_navigate_to_project_board(self) -> bool:
        """Switch to board view."""
        return self.browser.click_element(self.selectors["board_view_btn"])
    
    def _action_navigate_to_project_timeline(self) -> bool:
        """Switch to timeline view."""
        return self.browser.click_element(self.selectors["timeline_view_btn"])
    
    def _action_navigate_to_project_calendar(self) -> bool:
        """Switch to calendar view."""
        return self.browser.click_element(self.selectors["calendar_view_btn"])
    
    def _action_switch_workspace(self) -> bool:
        """Open workspace selector."""
        return self.browser.click_element(self.selectors["workspace_selector"])
    
    def _action_scroll_up(self) -> bool:
        """Scroll page up."""
        return self.browser.scroll_page("up", 300)
    
    def _action_scroll_down(self) -> bool:
        """Scroll page down."""
        return self.browser.scroll_page("down", 300)
    
    def _action_refresh_page(self) -> bool:
        """Refresh the current page."""
        try:
            self.browser.driver.refresh()
            time.sleep(1.0)  # Wait for page to load
            return True
        except Exception:
            return False
    
    # Project actions
    def _action_create_new_project(self) -> bool:
        """Create a new project."""
        # Click create project button
        if not self.browser.click_element(self.selectors["create_project_btn"]):
            return False
        
        # Wait for modal/form to appear
        if not self.browser.wait_for_element(self.selectors["project_name_input"], timeout=3.0):
            return False
        
        # Fill in project name
        project_name = f"RL Project {int(time.time())}"
        return self.browser.type_text(self.selectors["project_name_input"], project_name)
    
    def _action_open_project(self) -> bool:
        """Open the first available project."""
        project_cards = self.browser.find_elements(self.selectors["project_card"])
        if project_cards:
            return self.browser.click_element(self.selectors["project_card"])
        return False
    
    def _action_edit_project(self) -> bool:
        """Edit current project."""
        # Look for edit button or project settings
        edit_selectors = ['[data-testid="project-edit-btn"]', '[data-testid="project-settings"]']
        for selector in edit_selectors:
            if self.browser.click_element(selector):
                return True
        return False
    
    def _action_archive_project(self) -> bool:
        """Archive current project."""
        return self.browser.click_element('[data-testid="project-archive-btn"]')
    
    def _action_change_project_color(self) -> bool:
        """Change project color."""
        return self.browser.click_element('[data-testid="project-color-picker"]')
    
    def _action_add_project_member(self) -> bool:
        """Add member to project."""
        return self.browser.click_element('[data-testid="add-member-btn"]')
    
    def _action_remove_project_member(self) -> bool:
        """Remove member from project."""
        return self.browser.click_element('[data-testid="remove-member-btn"]')
    
    def _action_duplicate_project(self) -> bool:
        """Duplicate current project."""
        return self.browser.click_element('[data-testid="duplicate-project-btn"]')
    
    def _action_delete_project(self) -> bool:
        """Delete current project."""
        return self.browser.click_element('[data-testid="delete-project-btn"]')
    
    def _action_set_project_status(self) -> bool:
        """Set project status."""
        return self.browser.click_element('[data-testid="project-status-select"]')
    
    # Task actions
    def _action_create_new_task(self) -> bool:
        """Create a new task."""
        # Click create task button
        if not self.browser.click_element(self.selectors["create_task_btn"]):
            return False
        
        # Wait for task form
        if not self.browser.wait_for_element(self.selectors["task_name_input"], timeout=3.0):
            return False
        
        # Fill in task name
        task_name = f"RL Task {int(time.time())}"
        return self.browser.type_text(self.selectors["task_name_input"], task_name)
    
    def _action_open_task_detail(self) -> bool:
        """Open task detail modal."""
        task_cards = self.browser.find_elements(self.selectors["task_card"])
        if task_cards:
            return self.browser.click_element(self.selectors["task_card"])
        return False
    
    def _action_edit_task_name(self) -> bool:
        """Edit task name."""
        if self.browser.click_element(self.selectors["task_name_input"]):
            new_name = f"Updated Task {int(time.time())}"
            return self.browser.type_text(self.selectors["task_name_input"], new_name, clear_first=True)
        return False
    
    def _action_edit_task_description(self) -> bool:
        """Edit task description."""
        if self.browser.click_element(self.selectors["task_description_input"]):
            description = "Updated by RL agent"
            return self.browser.type_text(self.selectors["task_description_input"], description)
        return False
    
    def _action_set_task_assignee(self) -> bool:
        """Set task assignee."""
        return self.browser.click_element(self.selectors["task_assignee_select"])
    
    def _action_set_task_due_date(self) -> bool:
        """Set task due date."""
        return self.browser.click_element(self.selectors["task_due_date_input"])
    
    def _action_set_task_priority(self) -> bool:
        """Set task priority."""
        return self.browser.click_element(self.selectors["task_priority_select"])
    
    def _action_change_task_status_todo(self) -> bool:
        """Move task to todo status."""
        return self._move_task_to_column("todo")
    
    def _action_change_task_status_in_progress(self) -> bool:
        """Move task to in progress status."""
        return self._move_task_to_column("in_progress")
    
    def _action_change_task_status_completed(self) -> bool:
        """Move task to completed status."""
        return self._move_task_to_column("completed")
    
    def _move_task_to_column(self, status: str) -> bool:
        """Move a task to a specific status column."""
        # Find first available task
        task_cards = self.browser.find_elements(self.selectors["task_card"])
        if not task_cards:
            return False
        
        # Get target column
        column_selector = self.selectors.get(f"{status}_column")
        if not column_selector:
            return False
        
        # Perform drag and drop
        return self.browser.drag_and_drop(
            self.selectors["task_card"],
            column_selector
        )
    
    def _action_add_task_dependency(self) -> bool:
        """Add task dependency."""
        return self.browser.click_element('[data-testid="add-dependency-btn"]')
    
    def _action_remove_task_dependency(self) -> bool:
        """Remove task dependency."""
        return self.browser.click_element('[data-testid="remove-dependency-btn"]')
    
    def _action_add_task_tag(self) -> bool:
        """Add tag to task."""
        return self.browser.click_element('[data-testid="add-tag-btn"]')
    
    def _action_delete_task(self) -> bool:
        """Delete task."""
        return self.browser.click_element('[data-testid="delete-task-btn"]')
    
    def _action_duplicate_task(self) -> bool:
        """Duplicate task."""
        return self.browser.click_element('[data-testid="duplicate-task-btn"]')
    
    # Collaboration actions
    def _action_add_comment(self) -> bool:
        """Add comment to task."""
        comment_text = f"RL agent comment {int(time.time())}"
        
        # Type comment
        if not self.browser.type_text(self.selectors["comment_input"], comment_text):
            return False
        
        # Submit comment
        return self.browser.click_element(self.selectors["comment_submit_btn"])
    
    def _action_reply_to_comment(self) -> bool:
        """Reply to existing comment."""
        return self.browser.click_element('[data-testid="reply-comment-btn"]')
    
    def _action_edit_comment(self) -> bool:
        """Edit existing comment."""
        return self.browser.click_element('[data-testid="edit-comment-btn"]')
    
    def _action_delete_comment(self) -> bool:
        """Delete comment."""
        return self.browser.click_element('[data-testid="delete-comment-btn"]')
    
    def _action_mention_user(self) -> bool:
        """Mention user in comment."""
        # Type @ symbol to trigger mention
        return self.browser.type_text(self.selectors["comment_input"], "@", clear_first=False)
    
    def _action_attach_file(self) -> bool:
        """Attach file to task."""
        return self.browser.click_element('[data-testid="attach-file-btn"]')
    
    def _action_create_subtask(self) -> bool:
        """Create subtask."""
        return self.browser.click_element('[data-testid="create-subtask-btn"]')
    
    def _action_convert_to_project(self) -> bool:
        """Convert task to project."""
        return self.browser.click_element('[data-testid="convert-to-project-btn"]')
    
    def _action_follow_task(self) -> bool:
        """Follow task for notifications."""
        return self.browser.click_element('[data-testid="follow-task-btn"]')
    
    def _action_unfollow_task(self) -> bool:
        """Unfollow task."""
        return self.browser.click_element('[data-testid="unfollow-task-btn"]')
    
    # View and filter actions
    def _action_filter_by_assignee(self) -> bool:
        """Filter tasks by assignee."""
        return self.browser.click_element(self.selectors["filter_assignee"])
    
    def _action_filter_by_status(self) -> bool:
        """Filter tasks by status."""
        return self.browser.click_element(self.selectors["filter_status"])
    
    def _action_filter_by_due_date(self) -> bool:
        """Filter tasks by due date."""
        return self.browser.click_element(self.selectors["filter_due_date"])
    
    def _action_sort_tasks(self) -> bool:
        """Sort tasks."""
        return self.browser.click_element('[data-testid="sort-tasks-btn"]')
    
    def _action_search_tasks(self) -> bool:
        """Search tasks."""
        search_query = "RL"
        return self.browser.type_text(self.selectors["search_input"], search_query)