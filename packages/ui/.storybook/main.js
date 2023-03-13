import { mergeConfig } from 'vite';
export default {
  stories: ['../src/**/*.@(mdx|stories.@(jsx|js))'],
  // stories: [],
  // staticDirs: ['../public'],
  // "addons": ['@storybook/addon-essentials'],
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
  //       'process.env': {}
  //     }
  //   });
  // },
};