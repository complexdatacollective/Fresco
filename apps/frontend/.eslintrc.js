// require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: ["@codaco/eslint-config"],
  parserOptions: { tsconfigRootDir: __dirname },
  settings: {
    'import/resolver': {
      alias: {
        extensions: ['.vue', '.js', '.ts', '.scss', '.d.ts'],
        map: [
          ['@', './src'],
          ['@/components', './src/components'],
        ],
      },
    }
  }

};