import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonVitest from '@storybook/addon-vitest';
import { definePreview } from '@storybook/nextjs-vite';
import Providers from '../components/Providers';
import '../styles/globals.css';
import { getInitialTheme, globalTypes, withTheme } from './theme-switcher';

// @chromatic-com/storybook is not included here because it doesn't export a
// CSF Next compatible preview addon. It only provides server-side preset
// functionality and manager UI, so it's configured in main.ts only.
// See: https://github.com/chromaui/addon-visual-tests/pull/404

export default definePreview({
  addons: [addonDocs(), addonA11y(), addonVitest()],
  parameters: {
    options: {
      storySort: {
        order: [
          'Design System',
          ['Colors', 'Elevation', 'Type Scale', 'Typography'],
          'UI',
          'Systems',
          ['Form', 'Dialogs', 'DragAndDrop'],
          'Interview',
          '*',
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
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
      <div className="root h-screen">
        <Providers>
          <Story />
        </Providers>
      </div>
    ),
    withTheme,
  ],

  globalTypes,

  initialGlobals: {
    theme: getInitialTheme(),
  },
});
