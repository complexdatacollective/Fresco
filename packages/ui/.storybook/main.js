module.exports = {
  stories: ['../src/**/*.stories.js'],
  "addons": ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "storybook-addon-sass-postcss", "@storybook/addon-mdx-gfm"],
  "framework": {
    name: "@storybook/react-vite",
    options: {}
  },
  docs: {
    autodocs: true
  }
};