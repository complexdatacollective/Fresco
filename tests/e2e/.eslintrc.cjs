module.exports = {
  extends: ['../../.eslintrc.cjs'],
  rules: {
    // Allow process.env usage in test files and config
    '@typescript-eslint/no-process-env': 'off',
    // Allow any type in test files for flexibility
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow unused vars if prefixed with underscore
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    // Allow test-specific patterns
    '@typescript-eslint/no-floating-promises': 'off',
    // Allow console statements in test files
    'no-console': 'off',
  },
  parserOptions: {
    project: null, // Disable type-aware linting to avoid TSConfig issues
  },
};