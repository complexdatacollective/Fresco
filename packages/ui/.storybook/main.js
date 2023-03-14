import { mergeConfig } from 'vite';
export default {
  stories: ['../src/**/*.@(mdx|stories.@(jsx|js|ts|tsx))'],
  "addons": ['@storybook/addon-essentials', '@storybook/addon-links', '@storybook/addon-actions', '@storybook/addon-interactions'],
  "framework": {
    name: "@storybook/react-vite",
    options: {}
  },
  // async viteFinal(config, {
  //   configType
  // }) {
  //   console.log('config', config);
  //   return mergeConfig(config, {
  //     define: {
  //       'process.env': {},
  //       'global': {}
  //     }
  //   });
  // },
  docs: {
    autodocs: true
  }
};