import { vi } from 'vitest';

// Import React at the top level so it's available for mocks
import { type default as React } from 'react';

// Use vi.hoisted to define mock factories that are available when mocks are hoisted
const { motionMockModule } = vi.hoisted(() => {
  // We need to re-require React inside the hoisted block
  // because vi.hoisted runs before the import at the top
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactModule = require('react') as typeof React;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isValidMotionProp } = require('motion/react') as {
    isValidMotionProp: (key: string) => boolean;
  };

  // Wrap refs to handle callback refs that return cleanup functions
  // This is needed because some libraries (like @base-ui/react) use the React 19
  // pattern where callback refs can return cleanup functions, but React 18
  // warns when callback refs return values. Our wrapper ignores the return value.
  const wrapRef = (ref: unknown) => {
    if (ref === null || ref === undefined) {
      return ref;
    }
    if (typeof ref === 'function') {
      // Return a wrapper that calls the original but ignores return value
      return (element: HTMLElement | null) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ref(element);
        // Intentionally not returning the cleanup function
      };
    }
    // RefObject - pass through as-is
    return ref;
  };

  // Props that motion considers valid but should still be passed to DOM elements
  const domPassthroughProps = new Set(['style']);

  // Filter out motion-specific props from HTML elements using motion's own detection
  const filterMotionProps = (props: Record<string, unknown>) => {
    return Object.fromEntries(
      Object.entries(props).filter(
        ([key]) => !isValidMotionProp(key) || domPassthroughProps.has(key),
      ),
    );
  };

  // Create explicit motion components for common HTML elements
  const createMotionComponent = (tag: string) =>
    ReactModule.forwardRef<HTMLElement, Record<string, unknown>>(
      (props, ref) => {
        return ReactModule.createElement(tag, {
          ...filterMotionProps(props),
          ref: wrapRef(ref),
        });
      },
    );

  // Create a motion-wrapped version of a custom React component
  // This handles motion.create(Component) calls
  const createMotionFromComponent = <T extends React.ComponentType>(
    Component: T,
  ) =>
    ReactModule.forwardRef<HTMLElement, Record<string, unknown>>(
      (props, _ref) => {
        return ReactModule.createElement(Component, {
          ...filterMotionProps(props),
        });
      },
    );

  // Pre-create common motion components
  const motionComponents = {
    div: createMotionComponent('div'),
    span: createMotionComponent('span'),
    button: createMotionComponent('button'),
    li: createMotionComponent('li'),
    ul: createMotionComponent('ul'),
    section: createMotionComponent('section'),
    article: createMotionComponent('article'),
    header: createMotionComponent('header'),
    footer: createMotionComponent('footer'),
    nav: createMotionComponent('nav'),
    main: createMotionComponent('main'),
    aside: createMotionComponent('aside'),
    form: createMotionComponent('form'),
    input: createMotionComponent('input'),
    label: createMotionComponent('label'),
    p: createMotionComponent('p'),
    h1: createMotionComponent('h1'),
    h2: createMotionComponent('h2'),
    h3: createMotionComponent('h3'),
    img: createMotionComponent('img'),
    a: createMotionComponent('a'),
    table: createMotionComponent('table'),
    tr: createMotionComponent('tr'),
    td: createMotionComponent('td'),
    th: createMotionComponent('th'),
    tbody: createMotionComponent('tbody'),
    thead: createMotionComponent('thead'),
    // Add the create method for motion.create(Component) API
    create: createMotionFromComponent,
  };

  // No-op animation controls
  const useAnimation = () => ({
    start: () => Promise.resolve(),
    stop: () => undefined,
    set: () => undefined,
  });

  // useAnimate returns [scope ref, animate function]
  const useAnimate = <T extends HTMLElement>() => {
    const scopeRef = ReactModule.useRef<T>(null);
    const animate = () => Promise.resolve();
    return [scopeRef, animate] as const;
  };

  // stagger returns a delay function (just returns 0 in mock)
  const stagger = () => 0;

  // AnimatePresence and LayoutGroup are passthrough components
  const AnimatePresence = ({ children }: { children: unknown }) => children;
  const LayoutGroup = ({ children }: { children: unknown }) => children;

  const motionMockModule = {
    motion: motionComponents,
    AnimatePresence,
    LayoutGroup,
    useAnimation,
    useAnimate,
    stagger,
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: () => undefined,
    }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: (initial: number) => ({ get: () => initial }),
    useInView: () => true,
    useScroll: () => ({
      scrollY: { get: () => 0 },
      scrollX: { get: () => 0 },
    }),
    useDragControls: () => ({ start: () => undefined }),
    useReducedMotion: () => false,
  };

  return { motionMockModule };
});

// Mock motion/react (the primary import path used by the project)
vi.mock('motion/react', () => motionMockModule);

// Also mock framer-motion directly (some dependencies may import from it)
vi.mock('framer-motion', () => motionMockModule);

// Mock motion-dom to prevent internal scheduling issues
vi.mock('motion-dom', () => ({
  frame: {
    read: (callback: () => void) => {
      callback();
      return () => undefined;
    },
    render: (callback: () => void) => {
      callback();
      return () => undefined;
    },
    postRender: (callback: () => void) => {
      callback();
      return () => undefined;
    },
  },
  cancelFrame: () => undefined,
  steps: {
    read: {
      schedule: () => () => undefined,
      cancel: () => undefined,
    },
    render: {
      schedule: () => () => undefined,
      cancel: () => undefined,
    },
    postRender: {
      schedule: () => () => undefined,
      cancel: () => undefined,
    },
  },
  time: { now: () => 0 },
}));

// Mock ResizeObserver for jsdom environment
// The callback must be invoked with width > 0 so Collection can measure items
// IMPORTANT: Use queueMicrotask to defer callback like real ResizeObserver
// This prevents infinite loops with hooks that trigger re-renders on containerWidth changes

// Track elements globally to prevent duplicate callbacks
const globalObservedElements = new WeakSet<Element>();
// Track pending callbacks to allow cancellation
const pendingCallbacks = new WeakMap<Element, () => void>();

class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback;
  private localObservedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.localObservedElements.add(target);

    // Only fire callback once per element globally
    if (globalObservedElements.has(target)) {
      return;
    }
    globalObservedElements.add(target);

    // Use queueMicrotask to defer callback like real ResizeObserver
    // This allows React to complete its render cycle before we trigger state updates
    const callbackFn = () => {
      // Check if element was unobserved before callback fires
      if (!this.localObservedElements.has(target)) {
        return;
      }

      this.callback(
        [
          {
            target,
            contentRect: {
              width: 800,
              height: 600,
              x: 0,
              y: 0,
              top: 0,
              left: 0,
              bottom: 600,
              right: 800,
              toJSON: () => ({}),
            } as DOMRectReadOnly,
            borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
            contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
            devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          } as ResizeObserverEntry,
        ],
        this,
      );
    };

    pendingCallbacks.set(target, callbackFn);
    queueMicrotask(callbackFn);
  }

  unobserve(target: Element) {
    this.localObservedElements.delete(target);
    pendingCallbacks.delete(target);
  }

  disconnect() {
    for (const el of this.localObservedElements) {
      pendingCallbacks.delete(el);
    }
    this.localObservedElements.clear();
  }
}

global.ResizeObserver = ResizeObserverMock;

// Mock offsetWidth and offsetHeight on HTMLElement for immediate container width detection
// This allows hooks like useCollectionSetup to get initial dimensions synchronously
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 600;
  },
});
