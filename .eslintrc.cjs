/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:@typescript-eslint/recommended-type-checked',
        'next/core-web-vitals',
        'prettier',
      ],
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: true,
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:import/recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/stylistic',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
    'prettier',
  ],
  ignorePatterns: [
    'node_modules',
    '*.stories.*',
    'public',

  ],
  rules: {
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    '@next/next/no-img-element': 'off',
    'import/no-cycle': 'error',
    'import/no-anonymous-default-export': 'off',
    
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
      'error',
      {
        caughtErrors: 'none',
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    'no-unreachable': 'error',
    'import/no-named-as-default-member': 'off', // re-enable
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true, 
    }
  }
};

module.exports = config;
