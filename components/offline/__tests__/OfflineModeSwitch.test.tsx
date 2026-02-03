import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineModeSwitch } from '../OfflineModeSwitch';

const OFFLINE_MODE_KEY = 'offlineModeEnabled';

describe('OfflineModeSwitch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render after mounting', async () => {
      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByTestId('offline-switch')).toBeInTheDocument();
      });
    });

    it('should render with custom className', async () => {
      render(
        <OfflineModeSwitch
          // eslint-disable-next-line better-tailwindcss/no-unknown-classes
          className="custom-class"
          data-testid="offline-switch"
        />,
      );

      await waitFor(() => {
        const element = screen.getByTestId('offline-switch');
        expect(element).toHaveClass('custom-class');
      });
    });

    it('should spread additional props to root element', async () => {
      render(
        <OfflineModeSwitch
          data-testid="offline-switch"
          aria-label="Toggle offline mode"
        />,
      );

      await waitFor(() => {
        const element = screen.getByTestId('offline-switch');
        expect(element).toHaveAttribute('aria-label', 'Toggle offline mode');
      });
    });
  });

  describe('localStorage initialization', () => {
    it('should default to unchecked when localStorage is empty', async () => {
      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should initialize as checked when localStorage is "true"', async () => {
      localStorage.setItem(OFFLINE_MODE_KEY, 'true');

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should initialize as unchecked when localStorage is "false"', async () => {
      localStorage.setItem(OFFLINE_MODE_KEY, 'false');

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'false');
      });
    });

    it('should treat invalid localStorage values as unchecked', async () => {
      localStorage.setItem(OFFLINE_MODE_KEY, 'invalid-value');

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'false');
      });
    });
  });

  describe('user interaction', () => {
    it('should toggle to checked when clicked', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);

      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle to unchecked when clicked twice', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      await user.click(switchElement);

      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('should support multiple toggles', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');

      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'false');

      await user.click(switchElement);
      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('localStorage persistence', () => {
    it('should save "true" to localStorage when toggled on', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('switch'));

      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('true');
    });

    it('should save "false" to localStorage when toggled off', async () => {
      const user = userEvent.setup();
      localStorage.setItem(OFFLINE_MODE_KEY, 'true');

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('switch'));

      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('false');
    });

    it('should persist state across multiple toggles', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('true');

      await user.click(switchElement);
      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('false');

      await user.click(switchElement);
      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('true');
    });

    it('should maintain localStorage state between component remounts', async () => {
      const user = userEvent.setup();

      const { unmount } = render(
        <OfflineModeSwitch data-testid="offline-switch" />,
      );

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('switch'));

      expect(localStorage.getItem(OFFLINE_MODE_KEY)).toBe('true');

      unmount();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('keyboard interaction', () => {
    it('should toggle when Space key is pressed', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      await user.keyboard(' ');

      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle when Enter key is pressed', async () => {
      const user = userEvent.setup();

      render(<OfflineModeSwitch data-testid="offline-switch" />);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');
      switchElement.focus();

      await user.keyboard('{Enter}');

      expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });
  });
});
