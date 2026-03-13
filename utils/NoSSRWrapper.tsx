import dynamic from 'next/dynamic';
import type { ComponentProps, ComponentType, ReactNode } from 'react';

/**
 * This component is a hack to get around the fact that Next.js doesn't support
 * disabling SSR for client components (they are rendered on the server and then
 * hydrated on the client). This is a problem for us because we have a lot of
 * components in Interviewer that assume the presence of document, window, etc.
 *
 * I have no idea about the performance implications of this, but it seems to
 * work fine for now.
 *
 * Alternatives to consider:
 *   - https://github.com/maapteh/react-no-ssr
 *   - Conditional rendering:
 *     ```
 *       const isSSR = () => typeof window === ‘undefined’;
 *       if (!isSSR()) { return <MyComponent />; } return null;
 *    ```
 */
const NoSSRWrapper = ({ children }: { children: ReactNode }) => <>{children}</>;

const NoSSRWrapperDynamic = dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});

// Define the withNoSSRWrapper HOC
export const withNoSSRWrapper = <P extends object>(
  WrappedComponent: ComponentType<P>,
): React.FC<ComponentProps<ComponentType<P>>> => {
  const WithNoSSRWrapper: React.FC<ComponentProps<ComponentType<P>>> = (
    props,
  ) => (
    <NoSSRWrapperDynamic>
      <WrappedComponent {...props} />
    </NoSSRWrapperDynamic>
  );
  return WithNoSSRWrapper;
};
