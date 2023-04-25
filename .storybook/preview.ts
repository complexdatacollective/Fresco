import type { Preview } from "@storybook/react";

// Import the tailwind stylesheet
import '!style-loader!css-loader!postcss-loader!tailwindcss/tailwind.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
