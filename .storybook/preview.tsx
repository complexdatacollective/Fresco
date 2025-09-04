import type { Preview } from '@storybook/nextjs';
import { FormStoreProvider } from '../lib/form/store/formStoreProvider';
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
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f1f1f',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <FormStoreProvider>
        <Story />
      </FormStoreProvider>
    ),
  ],
};

export default preview;
