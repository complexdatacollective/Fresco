import type { StorybookConfig } from '@storybook/nextjs-vite';
import { resolve } from 'path';

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': resolve(__dirname, '../'),
    };
    return config;
  },
  staticDirs: ['../public'],
  typescript: {
    check: false,
    // reactDocgen: 'react-docgen',
    // reactDocgenTypescriptOptions: {
    //   shouldExtractLiteralValuesFromEnum: true,
    //   propFilter: (prop) =>
    //     prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    // },
  },
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
};
export default config;
