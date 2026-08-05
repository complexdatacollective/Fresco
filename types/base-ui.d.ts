// Set before mounting to suppress Base UI's CSS-animation waits. Read by
// base-ui's runtime; we only assign it. Declared with a top-level `declare var`
// (not a `declare global` block, which needs an `export {}` module marker that
// oxlint --fix strips from .d.ts files) so it surfaces on `globalThis`.
declare var BASE_UI_ANIMATIONS_DISABLED: boolean;
