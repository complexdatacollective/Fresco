// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:@typescript-eslint/recommended-type-checked',
      ],
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
  plugins: ['@typescript-eslint', 'eslint-plugin-local-rules'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
    'plugin:storybook/recommended',
    'prettier',
  ],
  ignorePatterns: ['node_modules', '*.stories.*', '*.test.*'],
  rules: {
    "@next/next/no-img-element": "off",
    "import/no-anonymous-default-export": "off",
    "@typescript-eslint/consistent-type-definitions": ['error', 'type'],
    'no-process-env': 'error',
    'no-console': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
      },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": false
      }
    ],
    'no-unreachable': 'error',
    'local-rules/require-data-mapper': 'error',
  },
};
module.exports = config;
