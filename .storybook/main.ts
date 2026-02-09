import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: [
    '../{app,components,lib}/**/*.mdx',
    '../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal(config) {
    if (config.optimizeDeps) {
      config.optimizeDeps.esbuildOptions = {
        ...config.optimizeDeps.esbuildOptions,
        loader: {
          ...config.optimizeDeps.esbuildOptions?.loader,
          '.js': 'jsx',
        },
      };
    }

    return config;
  },
};
export default config;
