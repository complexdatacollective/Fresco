// require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "@codaco/eslint-config"
  ],
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname
  }
};