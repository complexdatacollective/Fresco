import { mergeConfig } from 'vite';

export default {
  stories: ['../src/**/*.stories.@(jsx|js|mdx)'],
  // stories: [],
  // staticDirs: ['../public'],
  "addons": [
    // "@storybook/addon-links",
    // "@storybook/addon-essentials"
    // "@storybook/addon-interactions",
    // "storybook-addon-sass-postcss",
    // "@storybook/addon-mdx-gfm",
  ],

  "framework": {
    name: "@storybook/react-vite",
    options: {}
  },
  // docs: {
  //   autodocs: true
  // }
  async viteFinal(config, { configType }) {
    console.log('config', config);
    return mergeConfig(config, {
      define: { 'process.env': {} },
    });
  },
};