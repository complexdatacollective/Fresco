/**
 * see: https://zod.dev/metadata
 *
 * We add a custom global registry property to allow for schemas to provide
 * hint text that can be displayed to users filling out forms.
 */

declare module 'zod' {
  interface GlobalMeta {
    // add new fields here
    hintText?: string;
  }
}

// forces TypeScript to consider the file a module
export {};
