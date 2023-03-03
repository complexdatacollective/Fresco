module.exports = {
  "extends": [
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:react-hooks/recommended",
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  "parser": "@typescript-eslint/parser",
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
  },
}