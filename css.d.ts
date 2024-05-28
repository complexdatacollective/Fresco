import 'react';

/**
 * This is needed because React types are based on CSSType, which doesn't
 * support CSS properties.
 *
 * See: https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
 */
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CSSProperties {
    // Allow namespaced CSS Custom Properties
    [index: `--nc-${string}`]: string;
    [index: `--tx-${string}`]: string;
  }
}
