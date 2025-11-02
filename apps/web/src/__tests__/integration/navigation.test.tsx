import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsanaLayout } from '@/components/asana-layout';

describe('Navigation Integration Tests', () => {
  it('should render complete layout with all navigation elements', () => {
    render(
      <AsanaLayout title="Test Page">
        <div>Content</div>
      </AsanaLayout>
    );

    // Top nav elements
    expect(screen.getByTestId('asana-top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();

    // Sidebar elements
    expect(screen.getByTestId('asana-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-my-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('nav-inbox')).toBeInTheDocument();

    // Content
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should toggle sidebar visibility when hamburger menu is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AsanaLayout title="Test Page">
        <div>Content</div>
      </AsanaLayout>
    );

    const sidebar = screen.getByTestId('asana-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Click hamburger menu
    const toggleButton = screen.getByTestId('toggle-sidebar');
    await user.click(toggleButton);

    // Sidebar should be hidden
    expect(screen.queryByTestId('asana-sidebar')).not.toBeInTheDocument();

    // Click again to show
    await user.click(toggleButton);
    expect(screen.getByTestId('asana-sidebar')).toBeInTheDocument();
  });

  it('should maintain sidebar state across interactions', async () => {
    const user = userEvent.setup();
    render(
      <AsanaLayout title="Test Page">
        <div>Content</div>
      </AsanaLayout>
    );

    // Collapse insights section
    const insightsToggle = screen.getByTestId('insights-toggle');
    await user.click(insightsToggle);
    expect(screen.queryByTestId('nav-reporting')).not.toBeInTheDocument();

    // Collapse projects section
    const projectsToggle = screen.getByTestId('projects-toggle');
    await user.click(projectsToggle);
    expect(screen.queryByTestId('new-project-button')).not.toBeInTheDocument();

    // Insights should still be collapsed
    expect(screen.queryByTestId('nav-reporting')).not.toBeInTheDocument();
  });

  it('should have consistent navigation structure', () => {
    const workspaceId = '1132775624246007';
    const projectId = 'demo-project';

    render(
      <AsanaLayout
        title="Test Page"
        currentWorkspaceId={workspaceId}
        currentProjectId={projectId}
      >
        <div>Content</div>
      </AsanaLayout>
    );

    // Verify all navigation links are present and have correct hrefs
    const homeLink = screen.getByTestId('nav-home');
    const myTasksLink = screen.getByTestId('nav-my-tasks');
    const inboxLink = screen.getByTestId('nav-inbox');
    const reportingLink = screen.getByTestId('nav-reporting');
    const portfoliosLink = screen.getByTestId('nav-portfolios');
    const goalsLink = screen.getByTestId('nav-goals');

    expect(homeLink).toHaveAttribute('href', `/0/${workspaceId}/home`);
    expect(myTasksLink).toHaveAttribute('href', expect.stringContaining(projectId));
    expect(inboxLink).toHaveAttribute('href', expect.stringContaining('inbox'));
    expect(reportingLink).toHaveAttribute('href', expect.stringContaining('reporting'));
    expect(portfoliosLink).toHaveAttribute('href', expect.stringContaining('portfolios'));
    expect(goalsLink).toHaveAttribute('href', expect.stringContaining('goals'));
  });

  it('should render search functionality in top nav', () => {
    render(
      <AsanaLayout title="Test Page">
        <div>Content</div>
      </AsanaLayout>
    );

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search');
  });

  it('should have upgrade button accessible', () => {
    render(
      <AsanaLayout title="Test Page">
        <div>Content</div>
      </AsanaLayout>
    );

    const upgradeButton = screen.getByTestId('upgrade-button');
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toHaveTextContent('Upgrade');
  });
});
