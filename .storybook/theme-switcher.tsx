import type { Decorator } from '@storybook/nextjs-vite';
import { useEffect } from 'react';

export const THEME_KEY = 'theme';

export const themes = {
  default: {
    name: 'Default',
    path: '/styles/themes/default.css',
  },
  interview: {
    name: 'Interview',
    path: '/styles/themes/interview.css',
  },
} as const;

export type ThemeKey = keyof typeof themes;

const THEME_LINK_ID = 'storybook-theme-stylesheet';

function loadTheme(themeKey: ThemeKey) {
  const existingLink = document.getElementById(THEME_LINK_ID);

  if (existingLink) {
    existingLink.remove();
  }

  const link = document.createElement('link');
  link.id = THEME_LINK_ID;
  link.rel = 'stylesheet';
  link.href = themes[themeKey].path;
  document.head.appendChild(link);
}

function ThemeWrapper({
  selectedTheme,
  children,
}: {
  selectedTheme: ThemeKey;
  children: React.ReactNode;
}) {
  useEffect(() => {
    loadTheme(selectedTheme);
  }, [selectedTheme]);

  return <>{children}</>;
}

export const withTheme: Decorator = (Story, context) => {
  const selectedTheme = (context.globals[THEME_KEY] as ThemeKey) || 'default';

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
    defaultValue: 'default',
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
