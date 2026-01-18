import type { Preview } from '@storybook/nextjs-vite';
import Providers from '../components/Providers';
import '../styles/globals.css';

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
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#1f1f1f',
        }
      }
    },
  },

  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
