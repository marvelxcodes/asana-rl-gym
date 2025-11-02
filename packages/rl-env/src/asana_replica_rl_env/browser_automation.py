"""Browser automation utilities using Selenium WebDriver."""

import time
import logging
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
import numpy as np
from PIL import Image
import io

from .config import EnvironmentConfig

logger = logging.getLogger(__name__)


class BrowserAutomation:
    """Browser automation utilities for interacting with the Asana replica application."""
    
    def __init__(self, config: EnvironmentConfig):
        """Initialize browser automation with configuration."""
        self.config = config
        self.driver: Optional[webdriver.Remote] = None
        self.wait: Optional[WebDriverWait] = None
        self.action_chains: Optional[ActionChains] = None
        
    def start_browser(self) -> None:
        """Start the browser with configured options."""
        try:
            if self.config.browser == "chrome":
                self._start_chrome()
            elif self.config.browser == "firefox":
                self._start_firefox()
            else:
                raise ValueError(f"Unsupported browser: {self.config.browser}")
                
            # Set up WebDriverWait and ActionChains
            self.wait = WebDriverWait(self.driver, self.config.action_timeout)
            self.action_chains = ActionChains(self.driver)
            
            # Set window size
            self.driver.set_window_size(self.config.window_width, self.config.window_height)
            
            logger.info(f"Started {self.config.browser} browser successfully")
            
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            raise
    
    def _start_chrome(self) -> None:
        """Start Chrome browser with options."""
        options = ChromeOptions()
        
        if self.config.headless:
            options.add_argument("--headless")
        
        # Add common Chrome options for automation
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-web-security")
        options.add_argument("--allow-running-insecure-content")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")  # Faster loading
        
        # Set up Chrome service
        service = ChromeService(ChromeDriverManager().install())
        
        self.driver = webdriver.Chrome(service=service, options=options)
    
    def _start_firefox(self) -> None:
        """Start Firefox browser with options."""
        options = FirefoxOptions()
        
        if self.config.headless:
            options.add_argument("--headless")
        
        # Add common Firefox options for automation
        options.set_preference("dom.webnotifications.enabled", False)
        options.set_preference("media.volume_scale", "0.0")
        
        # Set up Firefox service
        service = FirefoxService(GeckoDriverManager().install())
        
        self.driver = webdriver.Firefox(service=service, options=options)
    
    def close_browser(self) -> None:
        """Close the browser and clean up resources."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Browser closed successfully")
            except Exception as e:
                logger.error(f"Error closing browser: {e}")
            finally:
                self.driver = None
                self.wait = None
                self.action_chains = None
    
    def navigate_to_url(self, url: str) -> bool:
        """Navigate to a specific URL."""
        try:
            self.driver.get(url)
            # Wait for page to load
            self.wait.until(lambda driver: driver.execute_script("return document.readyState") == "complete")
            logger.debug(f"Navigated to: {url}")
            return True
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {e}")
            return False
    
    def find_element(self, selector: str, by: By = By.CSS_SELECTOR, timeout: Optional[float] = None) -> Optional[Any]:
        """Find an element using the specified selector."""
        try:
            wait_time = timeout or self.config.action_timeout
            wait = WebDriverWait(self.driver, wait_time)
            element = wait.until(EC.presence_of_element_located((by, selector)))
            return element
        except TimeoutException:
            logger.debug(f"Element not found: {selector}")
            return None
        except Exception as e:
            logger.error(f"Error finding element {selector}: {e}")
            return None
    
    def find_elements(self, selector: str, by: By = By.CSS_SELECTOR) -> List[Any]:
        """Find multiple elements using the specified selector."""
        try:
            elements = self.driver.find_elements(by, selector)
            return elements
        except Exception as e:
            logger.error(f"Error finding elements {selector}: {e}")
            return []
    
    def click_element(self, selector: str, by: By = By.CSS_SELECTOR) -> bool:
        """Click an element."""
        try:
            element = self.find_element(selector, by)
            if element and element.is_enabled() and element.is_displayed():
                # Scroll element into view
                self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
                time.sleep(0.1)  # Brief pause for scroll
                element.click()
                logger.debug(f"Clicked element: {selector}")
                return True
            else:
                logger.debug(f"Element not clickable: {selector}")
                return False
        except Exception as e:
            logger.error(f"Error clicking element {selector}: {e}")
            return False
    
    def type_text(self, selector: str, text: str, by: By = By.CSS_SELECTOR, clear_first: bool = True) -> bool:
        """Type text into an input element."""
        try:
            element = self.find_element(selector, by)
            if element:
                if clear_first:
                    element.clear()
                element.send_keys(text)
                logger.debug(f"Typed text into {selector}: {text}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error typing text into {selector}: {e}")
            return False
    
    def drag_and_drop(self, source_selector: str, target_selector: str, by: By = By.CSS_SELECTOR) -> bool:
        """Perform drag and drop operation."""
        try:
            source = self.find_element(source_selector, by)
            target = self.find_element(target_selector, by)
            
            if source and target:
                self.action_chains.drag_and_drop(source, target).perform()
                logger.debug(f"Dragged {source_selector} to {target_selector}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error in drag and drop: {e}")
            return False
    
    def scroll_page(self, direction: str = "down", pixels: int = 300) -> bool:
        """Scroll the page in the specified direction."""
        try:
            if direction == "down":
                self.driver.execute_script(f"window.scrollBy(0, {pixels});")
            elif direction == "up":
                self.driver.execute_script(f"window.scrollBy(0, -{pixels});")
            elif direction == "left":
                self.driver.execute_script(f"window.scrollBy(-{pixels}, 0);")
            elif direction == "right":
                self.driver.execute_script(f"window.scrollBy({pixels}, 0);")
            else:
                return False
            
            logger.debug(f"Scrolled {direction} by {pixels} pixels")
            return True
        except Exception as e:
            logger.error(f"Error scrolling: {e}")
            return False
    
    def get_page_screenshot(self) -> Optional[np.ndarray]:
        """Take a screenshot of the current page."""
        try:
            # Take screenshot as PNG bytes
            screenshot_bytes = self.driver.get_screenshot_as_png()
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(screenshot_bytes))
            
            # Resize if needed
            if (image.width != self.config.screenshot_width or 
                image.height != self.config.screenshot_height):
                image = image.resize((self.config.screenshot_width, self.config.screenshot_height))
            
            # Convert to numpy array
            screenshot_array = np.array(image)
            
            # Save screenshot if debugging
            if self.config.save_screenshots:
                self._save_debug_screenshot(image)
            
            return screenshot_array
            
        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return None
    
    def _save_debug_screenshot(self, image: Image.Image) -> None:
        """Save screenshot for debugging purposes."""
        try:
            screenshot_dir = Path(self.config.screenshot_dir)
            screenshot_dir.mkdir(exist_ok=True)
            
            timestamp = int(time.time())
            filename = f"screenshot_{timestamp}.png"
            filepath = screenshot_dir / filename
            
            image.save(filepath)
            logger.debug(f"Saved debug screenshot: {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving debug screenshot: {e}")
    
    def get_page_source(self) -> str:
        """Get the current page source."""
        try:
            return self.driver.page_source
        except Exception as e:
            logger.error(f"Error getting page source: {e}")
            return ""
    
    def execute_javascript(self, script: str) -> Any:
        """Execute JavaScript code in the browser."""
        try:
            return self.driver.execute_script(script)
        except Exception as e:
            logger.error(f"Error executing JavaScript: {e}")
            return None
    
    def wait_for_element(self, selector: str, by: By = By.CSS_SELECTOR, timeout: Optional[float] = None) -> bool:
        """Wait for an element to be present and visible."""
        try:
            wait_time = timeout or self.config.action_timeout
            wait = WebDriverWait(self.driver, wait_time)
            wait.until(EC.visibility_of_element_located((by, selector)))
            return True
        except TimeoutException:
            return False
        except Exception as e:
            logger.error(f"Error waiting for element {selector}: {e}")
            return False
    
    def get_element_text(self, selector: str, by: By = By.CSS_SELECTOR) -> Optional[str]:
        """Get text content of an element."""
        try:
            element = self.find_element(selector, by)
            if element:
                return element.text
            return None
        except Exception as e:
            logger.error(f"Error getting element text {selector}: {e}")
            return None
    
    def get_element_attribute(self, selector: str, attribute: str, by: By = By.CSS_SELECTOR) -> Optional[str]:
        """Get attribute value of an element."""
        try:
            element = self.find_element(selector, by)
            if element:
                return element.get_attribute(attribute)
            return None
        except Exception as e:
            logger.error(f"Error getting element attribute {selector}.{attribute}: {e}")
            return None
    
    def is_element_present(self, selector: str, by: By = By.CSS_SELECTOR) -> bool:
        """Check if an element is present on the page."""
        try:
            element = self.driver.find_element(by, selector)
            return element is not None
        except NoSuchElementException:
            return False
        except Exception as e:
            logger.error(f"Error checking element presence {selector}: {e}")
            return False
    
    def get_current_url(self) -> str:
        """Get the current page URL."""
        try:
            return self.driver.current_url
        except Exception as e:
            logger.error(f"Error getting current URL: {e}")
            return ""