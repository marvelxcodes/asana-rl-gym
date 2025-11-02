import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsanaSidebar } from '../asana-sidebar';

describe('AsanaSidebar', () => {
  it('renders all main navigation items', () => {
    render(<AsanaSidebar />);

    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-my-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('nav-inbox')).toBeInTheDocument();
  });

  it('renders insights section with collapsible toggle', async () => {
    const user = userEvent.setup();
    render(<AsanaSidebar />);

    const insightsToggle = screen.getByTestId('insights-toggle');
    expect(insightsToggle).toBeInTheDocument();

    // Check that insights items are visible by default
    expect(screen.getByTestId('nav-reporting')).toBeInTheDocument();
    expect(screen.getByTestId('nav-portfolios')).toBeInTheDocument();
    expect(screen.getByTestId('nav-goals')).toBeInTheDocument();

    // Click to collapse
    await user.click(insightsToggle);

    // Insights items should be hidden
    expect(screen.queryByTestId('nav-reporting')).not.toBeInTheDocument();
  });

  it('renders projects section with collapsible toggle', async () => {
    const user = userEvent.setup();
    render(<AsanaSidebar />);

    const projectsToggle = screen.getByTestId('projects-toggle');
    expect(projectsToggle).toBeInTheDocument();

    // Check that projects section is visible by default
    expect(screen.getByText('Organize and plan your work with projects')).toBeInTheDocument();
    expect(screen.getByTestId('new-project-button')).toBeInTheDocument();

    // Click to collapse
    await user.click(projectsToggle);

    // Projects section should be hidden
    expect(screen.queryByText('Organize and plan your work with projects')).not.toBeInTheDocument();
  });

  it('renders upgrade button', () => {
    render(<AsanaSidebar />);

    const upgradeButton = screen.getByTestId('upgrade-button');
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toHaveTextContent('Upgrade');
  });

  it('uses correct workspace ID in navigation links', () => {
    const workspaceId = 'test-workspace-123';
    render(<AsanaSidebar currentWorkspaceId={workspaceId} />);

    const homeLink = screen.getByTestId('nav-home');
    expect(homeLink).toHaveAttribute('href', `/0/${workspaceId}/home`);
  });

  it('uses correct project ID in My tasks link', () => {
    const projectId = 'test-project-456';
    render(<AsanaSidebar currentProjectId={projectId} />);

    const myTasksLink = screen.getByTestId('nav-my-tasks');
    expect(myTasksLink).toHaveAttribute('href', expect.stringContaining(projectId));
  });

  it('has correct navigation URLs for all links', () => {
    const workspaceId = '1132775624246007';
    const projectId = 'demo-project';

    render(<AsanaSidebar currentWorkspaceId={workspaceId} currentProjectId={projectId} />);

    // Main nav
    expect(screen.getByTestId('nav-home')).toHaveAttribute('href', `/0/${workspaceId}/home`);
    expect(screen.getByTestId('nav-my-tasks')).toHaveAttribute('href', `/0/${workspaceId}/project/${projectId}/list/view-123`);
    expect(screen.getByTestId('nav-inbox')).toHaveAttribute('href', `/0/${workspaceId}/inbox/inbox-123`);

    // Insights
    expect(screen.getByTestId('nav-reporting')).toHaveAttribute('href', `/0/reporting/${workspaceId}`);
    expect(screen.getByTestId('nav-portfolios')).toHaveAttribute('href', `/0/portfolios/${workspaceId}`);
    expect(screen.getByTestId('nav-goals')).toHaveAttribute('href', `/0/${workspaceId}/goals`);
  });

  it('opens new project modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<AsanaSidebar />);

    const newProjectButton = screen.getByTestId('new-project-button');
    await user.click(newProjectButton);

    // Modal should open - we'd need to check for modal presence
    // This depends on the AsanaNewProjectModal implementation
  });

  it('applies hover styles to navigation items', () => {
    render(<AsanaSidebar />);

    const homeLink = screen.getByTestId('nav-home');
    expect(homeLink).toHaveClass('transition-all', 'duration-200', 'hover:bg-white/10');
  });

  it('maintains collapsed/expanded state for sections', async () => {
    const user = userEvent.setup();
    render(<AsanaSidebar />);

    const insightsToggle = screen.getByTestId('insights-toggle');

    // Initially expanded
    expect(screen.getByTestId('nav-reporting')).toBeInTheDocument();

    // Collapse
    await user.click(insightsToggle);
    expect(screen.queryByTestId('nav-reporting')).not.toBeInTheDocument();

    // Expand again
    await user.click(insightsToggle);
    expect(screen.getByTestId('nav-reporting')).toBeInTheDocument();
  });
});
