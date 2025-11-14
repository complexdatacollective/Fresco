import type { Preview } from '@storybook/nextjs-vite';
import Providers from '../components/Providers';
import '../styles/globals.css';
import { withTheme, globalTypes } from './theme-switcher';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: 'var(--color-background)',
        },

        dark: {
          name: 'dark',
          value: '#1f1f1f',
        },
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  decorators: [
    (Story) => (
      <div className="root" style={{ isolation: 'isolate' }}>
        <Providers>
          <Story />
        </Providers>
      </div>
    ),
    withTheme,
  ],

  globalTypes,

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
    theme: 'default',
  },
};

export default preview;
