import { defineMain } from '@storybook/nextjs-vite/node';

export default defineMain({
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      builder: {
        // Customize the Vite builder options here
        viteConfigPath: './vitest.config.ts',
      },
    },
  },
  staticDirs: ['../public', { from: '../styles/themes', to: '/styles/themes' }],
  typescript: {
    check: false,
  },
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)'],
});
