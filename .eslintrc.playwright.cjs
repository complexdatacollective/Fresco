module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Allow process.env usage in playwright config and test files
    '@typescript-eslint/no-process-env': 'off',
    'no-process-env': 'off',
  },
};