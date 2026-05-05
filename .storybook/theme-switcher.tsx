import type { Decorator } from '@storybook/nextjs-vite';
import { useLayoutEffect } from 'react';
import { cx } from '@codaco/fresco-ui/utils/cva';

const THEME_KEY = 'theme';
const STORAGE_KEY = 'storybook-theme-preference';
const INTERVIEW_ATTR = 'data-theme-interview';

const themes = {
  dashboard: {
    name: 'Dashboard',
  },
  interview: {
    name: 'Interview',
  },
} as const;

type ThemeKey = keyof typeof themes;

function getStoredTheme(): ThemeKey | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in themes) {
      return stored as ThemeKey;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to read theme from localStorage:', error);
  }
  return null;
}

function setStoredTheme(theme: ThemeKey) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to save theme to localStorage:', error);
  }
}

function ThemeWrapper({
  selectedTheme,
  children,
}: {
  selectedTheme: ThemeKey;
  children: React.ReactNode;
}) {
  // Tie the interview theme attribute to `<html>` so `1rem` tracks the
  // responsive font-size override in tailwind-config's interview theme.
  // Toggling document.documentElement directly (rather than a React-
  // managed wrapper) keeps the write/remove deterministic between
  // stories in the same Chromatic worker iframe.
  useLayoutEffect(() => {
    setStoredTheme(selectedTheme);
    if (selectedTheme === 'interview') {
      document.documentElement.setAttribute(INTERVIEW_ATTR, '');
    } else {
      document.documentElement.removeAttribute(INTERVIEW_ATTR);
    }
    return () => {
      document.documentElement.removeAttribute(INTERVIEW_ATTR);
    };
  }, [selectedTheme]);

  const isInterview = selectedTheme === 'interview';

  return (
    <div
      className={cx(
        'bg-background text-text publish-colors',
        isInterview && 'scheme-dark',
      )}
    >
      {children}
    </div>
  );
}

export const withTheme: Decorator = (Story, context) => {
  const selectedTheme =
    (context.parameters.forceTheme as ThemeKey) ??
    (context.globals[THEME_KEY] as ThemeKey) ??
    'dashboard';

  return (
    <ThemeWrapper selectedTheme={selectedTheme}>
      <Story />
    </ThemeWrapper>
  );
};

export const globalTypes = {
  [THEME_KEY]: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: getStoredTheme() ?? 'dashboard',
    toolbar: {
      icon: 'paintbrush' as const,
      items: Object.entries(themes).map(([key, { name }]) => ({
        value: key,
        title: name,
      })),
      showName: true,
      dynamicTitle: true,
    },
  },
};

export function getInitialTheme(): ThemeKey {
  return getStoredTheme() ?? 'dashboard';
}
