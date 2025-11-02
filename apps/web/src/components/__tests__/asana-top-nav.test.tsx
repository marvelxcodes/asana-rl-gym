import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsanaTopNav } from '../asana-top-nav';

describe('AsanaTopNav', () => {
  it('renders correctly with default props', () => {
    render(<AsanaTopNav />);

    expect(screen.getByTestId('asana-top-nav')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('create-button-top')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();
  });

  it('displays correct user initials', () => {
    render(<AsanaTopNav userInitials="AB" />);

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('calls onToggleSidebar when hamburger menu is clicked', async () => {
    const user = userEvent.setup();
    const onToggleSidebar = vi.fn();

    render(<AsanaTopNav onToggleSidebar={onToggleSidebar} />);

    await user.click(screen.getByTestId('toggle-sidebar'));

    expect(onToggleSidebar).toHaveBeenCalledOnce();
  });

  it('renders search input with correct placeholder', () => {
    render(<AsanaTopNav />);

    const searchInput = screen.getByPlaceholderText('Search');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays keyboard shortcut indicator', () => {
    render(<AsanaTopNav />);

    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders Create button with dropdown menu', async () => {
    const user = userEvent.setup();
    render(<AsanaTopNav />);

    const createButton = screen.getByTestId('create-button-top');
    expect(createButton).toHaveTextContent('Create');

    await user.click(createButton);

    // Check for dropdown menu items
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
  });

  it('applies focus styles to search input', async () => {
    const user = userEvent.setup();
    render(<AsanaTopNav />);

    const searchInput = screen.getByTestId('search-input');
    await user.click(searchInput);

    expect(searchInput).toHaveFocus();
  });

  it('renders help button', () => {
    render(<AsanaTopNav />);

    const helpButton = screen.getByTestId('help-button');
    expect(helpButton).toBeInTheDocument();
  });

  it('renders user menu button with avatar', () => {
    render(<AsanaTopNav userInitials="RK" userName="Rama Krishna" />);

    const userMenuButton = screen.getByTestId('user-menu-button');
    expect(userMenuButton).toBeInTheDocument();
    expect(screen.getByText('RK')).toBeInTheDocument();
  });
});
