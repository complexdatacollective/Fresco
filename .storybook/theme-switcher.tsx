import type { Decorator } from '@storybook/nextjs-vite';
import { useLayoutEffect, useState } from 'react';

const THEME_KEY = 'theme';
const STORAGE_KEY = 'storybook-theme-preference';

const themes = {
  dashboard: {
    name: 'Dashboard',
    path: '/styles/themes/default.css',
  },
  interview: {
    name: 'Interview',
    path: '/styles/themes/interview.css',
  },
} as const;

type ThemeKey = keyof typeof themes;

const THEME_LINK_ID = 'storybook-theme-stylesheet';

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

function loadTheme(themeKey: ThemeKey): Promise<void> {
  return new Promise((resolve) => {
    const existingLink = document.getElementById(
      THEME_LINK_ID,
    ) as HTMLLinkElement | null;

    if (existingLink?.href.endsWith(themes[themeKey].path)) {
      resolve();
      return;
    }

    if (existingLink) {
      existingLink.remove();
    }

    const link = document.createElement('link');
    link.id = THEME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = themes[themeKey].path;

    link.onload = () => resolve();
    link.onerror = () => resolve();

    document.head.appendChild(link);

    setTimeout(resolve, 1000);
  });
}

function ThemeWrapper({
  selectedTheme,
  children,
}: {
  selectedTheme: ThemeKey;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    setIsLoading(true);
    void loadTheme(selectedTheme).then(() => {
      setStoredTheme(selectedTheme);
      setIsLoading(false);
    });
  }, [selectedTheme]);

  // Apply data-theme to the HTML element for dark mode
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, [selectedTheme]);

  return (
    <div
      data-theme={selectedTheme}
      className="bg-background text-text"
      style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 150ms' }}
    >
      {children}
    </div>
  );
}

export const withTheme: Decorator = (Story, context) => {
  const selectedTheme = (context.globals[THEME_KEY] as ThemeKey) ?? 'default';

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
    defaultValue: getStoredTheme() ?? 'default',
    toolbar: {
      icon: 'paintbrush',
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
