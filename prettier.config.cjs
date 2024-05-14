import tailwind from 'prettier-plugin-tailwindcss';

/** @type {import("prettier").Config} */
const config = {
  plugins: [tailwind],
  printWidth: 80,
  quoteProps: 'consistent',
  singleQuote: true,
};

export default config;
