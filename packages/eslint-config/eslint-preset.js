const path = require("path");

module.exports = {
  root: true,
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  env: {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  rules: {
    'react/require-default-props': ['error', { functions: 'defaultArguments' }],
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx', '.tsx'] }],
    'react/function-component-definition': 'off',
    'import/no-extraneous-dependencies': ['error', { 'devDependencies': ['**/*.test.@(jsx|js|tsx|ts)', '**/*.stories.@(jsx|js|tsx|ts)', '**/vite.config.ts'] }],
    'import/extensions': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: [
        '@typescript-eslint',
      ],
      extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking', 'plugin:@typescript-eslint/recommended'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "tsconfig.json",
      },

    },
  ],
}