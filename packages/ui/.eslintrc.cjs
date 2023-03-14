const path = require("path");

module.exports = {
  root: true,
  extends: ["@codaco/eslint-config"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
  settings: {
    "import/resolver": {
      vite: {
        configPath: path.resolve(__dirname, "vite.config.ts")
      }
    }
  },
};