import * as React from 'react';

/**
 * Type for the render prop pattern used in base-ui components.
 * Can be either:
 * - A React element to clone with additional props
 * - A function that receives props and returns a React element
 */
export type RenderProp<Props extends Record<string, unknown>> =
  | React.ReactElement<Record<string, unknown>>
  | ((props: Props) => React.ReactElement<Record<string, unknown>>);

/**
 * Hook that implements the render prop pattern from base-ui.
 *
 * @param render - Optional render prop (element or function)
 * @param defaultElement - Default element to render if no render prop provided
 * @param props - Props to pass to the rendered element
 * @returns The rendered element
 *
 * @example
 * // With render function
 * <Component render={(props) => <legend {...props} />} />
 *
 * @example
 * // With render element
 * <Component render={<legend />} />
 *
 * @example
 * // Default behavior (no render prop)
 * <Component />
 */
export function useRender<Props extends Record<string, unknown>>(
  render: RenderProp<Props> | undefined,
  defaultElement: React.ReactElement<Record<string, unknown>>,
  props: Props,
): React.ReactElement<Record<string, unknown>> {
  if (render === undefined) {
    // No render prop provided, use default element
    return React.cloneElement(defaultElement, props);
  }

  if (typeof render === 'function') {
    // Render is a function, call it with props
    return render(props);
  }

  // Render is an element, clone it with props
  return React.cloneElement(render, props);
}
