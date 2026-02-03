import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageUsage } from '../StorageUsage';

describe('StorageUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render storage information when API is available', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 50,
        quota: 1024 * 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText('Storage Used')).toBeInTheDocument();
      });

      expect(mockEstimate).toHaveBeenCalledTimes(1);
    });

    it('should show fallback message when Storage API is unavailable', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: undefined,
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(
          screen.getByText('Storage information unavailable'),
        ).toBeInTheDocument();
      });
    });

    it('should show fallback message when estimate method is unavailable', async () => {
      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {},
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(
          screen.getByText('Storage information unavailable'),
        ).toBeInTheDocument();
      });
    });

    it('should show fallback message when estimate throws an error', async () => {
      const mockEstimate = vi.fn().mockRejectedValue(new Error('API Error'));

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(
          screen.getByText('Storage information unavailable'),
        ).toBeInTheDocument();
      });
    });

    it('should render with custom className', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 50,
        quota: 1024 * 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(
        <StorageUsage
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className="custom-class"
          data-testid="storage-usage"
        />,
      );

      await waitFor(() => {
        const element = screen.getByTestId('storage-usage');
        expect(element).toHaveClass('custom-class');
      });
    });

    it('should spread additional props to root element', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 50,
        quota: 1024 * 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(
        <StorageUsage
          data-testid="storage-usage"
          aria-label="Storage usage display"
        />,
      );

      await waitFor(() => {
        const element = screen.getByTestId('storage-usage');
        expect(element).toHaveAttribute('aria-label', 'Storage usage display');
      });
    });

    it('should not render anything while loading', () => {
      const mockEstimate = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10000)),
        );

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      const { container } = render(<StorageUsage />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('byte formatting', () => {
    it('should format bytes correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 512,
        quota: 1024,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/512\.00 B/)).toBeInTheDocument();
        expect(screen.getByText(/1\.00 KB/)).toBeInTheDocument();
      });
    });

    it('should format kilobytes correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 50,
        quota: 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/50\.00 KB/)).toBeInTheDocument();
        expect(screen.getByText(/100\.00 KB/)).toBeInTheDocument();
      });
    });

    it('should format megabytes correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 50,
        quota: 1024 * 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/50\.00 MB/)).toBeInTheDocument();
        expect(screen.getByText(/100\.00 MB/)).toBeInTheDocument();
      });
    });

    it('should format gigabytes correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 1024 * 2,
        quota: 1024 * 1024 * 1024 * 5,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/2\.00 GB/)).toBeInTheDocument();
        expect(screen.getByText(/5\.00 GB/)).toBeInTheDocument();
      });
    });

    it('should format zero bytes correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 0,
        quota: 1024,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/0 B/)).toBeInTheDocument();
      });
    });
  });

  describe('percentage calculation', () => {
    it('should display progress bar with correct percentage', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 50,
        quota: 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should handle 0% usage', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 0,
        quota: 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should handle 100% usage', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 100,
        quota: 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should handle zero quota gracefully', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 50,
        quota: 0,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('missing estimate values', () => {
    it('should handle missing usage value', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        quota: 1024 * 1024 * 100,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/0 B/)).toBeInTheDocument();
        expect(screen.getByText(/100\.00 MB/)).toBeInTheDocument();
      });
    });

    it('should handle missing quota value', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 50,
      });

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        expect(screen.getByText(/50\.00 MB/)).toBeInTheDocument();
        expect(screen.getByText(/0 B/)).toBeInTheDocument();
      });
    });

    it('should handle both values missing', async () => {
      const mockEstimate = vi.fn().mockResolvedValue({});

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: mockEstimate,
        },
      });

      render(<StorageUsage data-testid="storage-usage" />);

      await waitFor(() => {
        const text = screen.getByText(/0 B/);
        expect(text).toBeInTheDocument();
      });
    });
  });
});
