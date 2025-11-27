import type { Preview } from '@storybook/nextjs-vite';
import Providers from '../components/Providers';
import '../styles/globals.css';
import { getInitialTheme, globalTypes, withTheme } from './theme-switcher';

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
      test: 'error',
      /**
       * base-ui dialog adds focus guards which are picked up by a11y tests
       * but are necessary for proper focus management within the dialog,
       * and compatible with WCAG guidelines, so we disable this rule here.
       */
      config: {
        rules: [
          {
            id: 'aria-hidden-focus',
            selector: '[data-base-ui-focus-guard]',
            enabled: false,
          },
        ],
      },
    },
  },

  decorators: [
    (Story) => (
      /**
       * required by base-ui: https://base-ui.com/react/overview/quick-start#portals
       */
      <div className="root">
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
    theme: getInitialTheme(),
  },
};

export default preview;
