// import addonChromatic from '@chromatic-com/storybook';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonVitest from '@storybook/addon-vitest';
import { definePreview } from '@storybook/nextjs-vite';
import Providers from '../components/Providers';
import '../styles/globals.css';
import { getInitialTheme, globalTypes, withTheme } from './theme-switcher';

export default definePreview({
  addons: [
    addonDocs(),
    addonA11y(),
    addonVitest(),
    // addonChromatic()
  ],
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
    theme: getInitialTheme(),
  },
});
