import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type OfflineStatus, OfflineStatusBadge } from '../OfflineStatusBadge';

describe('OfflineStatusBadge', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<OfflineStatusBadge status="online-only" />);

      expect(screen.getByText('Online Only')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(
        <OfflineStatusBadge
          status="online-only"
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className="custom-class"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should spread additional props to root element', () => {
      render(
        <OfflineStatusBadge
          status="online-only"
          data-testid="status-badge"
          aria-label="Status indicator"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('aria-label', 'Status indicator');
    });
  });

  describe('status variants', () => {
    it('should render "Online Only" label for online-only status', () => {
      render(<OfflineStatusBadge status="online-only" />);

      expect(screen.getByText('Online Only')).toBeInTheDocument();
    });

    it('should render "Downloading" label for downloading status', () => {
      render(<OfflineStatusBadge status="downloading" />);

      expect(screen.getByText('Downloading')).toBeInTheDocument();
    });

    it('should render "Available Offline" label for available-offline status', () => {
      render(<OfflineStatusBadge status="available-offline" />);

      expect(screen.getByText('Available Offline')).toBeInTheDocument();
    });

    it('should render "Sync Required" label for sync-required status', () => {
      render(<OfflineStatusBadge status="sync-required" />);

      expect(screen.getByText('Sync Required')).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('should apply correct classes for online-only status', () => {
      render(
        <OfflineStatusBadge status="online-only" data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('border-current/20');
      expect(badge).toHaveClass('text-current');
    });

    it('should apply correct classes for downloading status', () => {
      render(
        <OfflineStatusBadge status="downloading" data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('border-info');
      expect(badge).toHaveClass('bg-info/10');
      expect(badge).toHaveClass('text-info');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('should apply correct classes for available-offline status', () => {
      render(
        <OfflineStatusBadge
          status="available-offline"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('border-success');
      expect(badge).toHaveClass('bg-success/10');
      expect(badge).toHaveClass('text-success');
    });

    it('should apply correct classes for sync-required status', () => {
      render(
        <OfflineStatusBadge
          status="sync-required"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('border-warning');
      expect(badge).toHaveClass('bg-warning/10');
      expect(badge).toHaveClass('text-warning');
    });

    it('should always include base Badge variant classes', () => {
      render(
        <OfflineStatusBadge status="online-only" data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge.className).toContain('inline-flex');
    });
  });

  describe('status transitions', () => {
    it('should update label when status prop changes', () => {
      const { rerender } = render(
        <OfflineStatusBadge status="online-only" data-testid="status-badge" />,
      );

      expect(screen.getByText('Online Only')).toBeInTheDocument();

      rerender(
        <OfflineStatusBadge status="downloading" data-testid="status-badge" />,
      );

      expect(screen.getByText('Downloading')).toBeInTheDocument();
      expect(screen.queryByText('Online Only')).not.toBeInTheDocument();
    });

    it('should update classes when status prop changes', () => {
      const { rerender } = render(
        <OfflineStatusBadge status="online-only" data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('border-current/20');
      expect(badge).not.toHaveClass('animate-pulse');

      rerender(
        <OfflineStatusBadge status="downloading" data-testid="status-badge" />,
      );

      expect(badge).toHaveClass('animate-pulse');
      expect(badge).not.toHaveClass('border-current/20');
    });

    it('should handle all status transitions', () => {
      const statuses: OfflineStatus[] = [
        'online-only',
        'downloading',
        'available-offline',
        'sync-required',
      ];

      const firstStatus = statuses[0] ?? 'online-only';

      const { rerender } = render(
        <OfflineStatusBadge status={firstStatus} data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');

      for (const status of statuses) {
        rerender(
          <OfflineStatusBadge status={status} data-testid="status-badge" />,
        );

        const expectedLabels: Record<OfflineStatus, string> = {
          'online-only': 'Online Only',
          'downloading': 'Downloading',
          'available-offline': 'Available Offline',
          'sync-required': 'Sync Required',
        };

        expect(screen.getByText(expectedLabels[status])).toBeInTheDocument();
        expect(badge).toBeInTheDocument();
      }
    });
  });

  describe('combined classes', () => {
    it('should merge custom className with variant classes', () => {
      render(
        <OfflineStatusBadge
          status="downloading"
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className="extra-class"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('extra-class');
      expect(badge).toHaveClass('border-info');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('should allow overriding variant classes with custom className', () => {
      render(
        <OfflineStatusBadge
          status="downloading"
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className="custom-animation"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('custom-animation');
      expect(badge.className).toContain('animate-pulse');
    });
  });

  describe('accessibility', () => {
    it('should be accessible as a generic element', () => {
      render(
        <OfflineStatusBadge
          status="available-offline"
          data-testid="status-badge"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should support custom ARIA attributes', () => {
      render(
        <OfflineStatusBadge
          status="sync-required"
          data-testid="status-badge"
          aria-live="polite"
          role="status"
        />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveAttribute('aria-live', 'polite');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should have visible text for screen readers', () => {
      render(<OfflineStatusBadge status="available-offline" />);

      const text = screen.getByText('Available Offline');
      expect(text).toBeVisible();
    });
  });

  describe('Badge component integration', () => {
    it('should render as a Badge with outline variant', () => {
      render(
        <OfflineStatusBadge status="online-only" data-testid="status-badge" />,
      );

      const badge = screen.getByTestId('status-badge');
      expect(badge.className).toContain('inline-flex');
      expect(badge.className).toContain('border');
    });
  });
});
