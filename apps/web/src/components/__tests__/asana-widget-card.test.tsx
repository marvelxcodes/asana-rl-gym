import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AsanaWidgetCard } from '../asana-widget-card';

describe('AsanaWidgetCard', () => {
  it('renders children correctly', () => {
    render(
      <AsanaWidgetCard>
        <div>Test Content</div>
      </AsanaWidgetCard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <AsanaWidgetCard title="My Widget">
        <div>Content</div>
      </AsanaWidgetCard>
    );

    expect(screen.getByText('My Widget')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(
      <AsanaWidgetCard>
        <div>Content</div>
      </AsanaWidgetCard>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders header actions when provided', () => {
    render(
      <AsanaWidgetCard
        title="My Widget"
        headerActions={<button>Action</button>}
      >
        <div>Content</div>
      </AsanaWidgetCard>
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <AsanaWidgetCard className="custom-class">
        <div>Content</div>
      </AsanaWidgetCard>
    );

    const card = screen.getByTestId('widget-card');
    expect(card).toHaveClass('custom-class');
  });

  it('has correct base styles', () => {
    render(
      <AsanaWidgetCard>
        <div>Content</div>
      </AsanaWidgetCard>
    );

    const card = screen.getByTestId('widget-card');
    expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-6');
  });

  it('has shadow and transition classes', () => {
    render(
      <AsanaWidgetCard>
        <div>Content</div>
      </AsanaWidgetCard>
    );

    const card = screen.getByTestId('widget-card');
    expect(card).toHaveClass('transition-shadow', 'duration-200');
  });

  it('renders with data-testid attribute', () => {
    render(
      <AsanaWidgetCard>
        <div>Content</div>
      </AsanaWidgetCard>
    );

    expect(screen.getByTestId('widget-card')).toBeInTheDocument();
  });

  it('renders title with correct heading level', () => {
    render(
      <AsanaWidgetCard title="Widget Title">
        <div>Content</div>
      </AsanaWidgetCard>
    );

    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toHaveTextContent('Widget Title');
  });

  it('applies correct typography styles to title', () => {
    render(
      <AsanaWidgetCard title="Widget Title">
        <div>Content</div>
      </AsanaWidgetCard>
    );

    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
  });
});
