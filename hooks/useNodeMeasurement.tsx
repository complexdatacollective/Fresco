'use client';

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type NodeMeasurement = {
  nodeWidth: number;
  nodeHeight: number;
  /**
   * Hidden React node that renders the measurement component into
   * `document.body` via a portal. Render this anywhere in the caller's
   * JSX — its position in the tree is irrelevant because it portals to
   * `document.body`. The hook measures it with a `ResizeObserver`.
   *
   * The caller MUST render this node somewhere so the measurement
   * component actually mounts.
   */
  measurementContainer: ReactNode;
};

/**
 * Measure the natural width and height of a React element off-screen,
 * for use in layouts that need to know an item's size before computing
 * positions (e.g. `<PedigreeLayout>`).
 *
 * Implementation note: this hook historically rendered the measurement
 * component in a secondary React root created with `createRoot`. That
 * worked but was fragile (two roots sharing the scheduler, async
 * unmount with `setTimeout`, etc.). The current implementation uses
 * `createPortal`, which keeps the measurement subtree inside the
 * caller's React tree while still rendering into `document.body`. This
 * is simpler, shares React context (so the measured component behaves
 * identically to how it would render normally), and has no bespoke
 * unmount teardown.
 */
export function useNodeMeasurement({
  component,
}: {
  component: ReactElement;
}): NodeMeasurement {
  const [dimensions, setDimensions] = useState({ nodeWidth: 0, nodeHeight: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const applyDimensions = (width: number, height: number) => {
      setDimensions((prev) => {
        if (prev.nodeWidth === width && prev.nodeHeight === height) {
          return prev;
        }
        return { nodeWidth: width, nodeHeight: height };
      });
    };

    // Initial synchronous measurement via getBoundingClientRect so the
    // caller gets a non-zero size on the first render after mount.
    const initialRect = wrapper.getBoundingClientRect();
    applyDimensions(initialRect.width, initialRect.height);

    // Keep in sync with later size changes (e.g. font load, CSS variable
    // updates). Reads from `entry.contentRect` — the single-source-of-truth
    // exposed by the observer — so this works both in real DOM and under
    // jsdom with mocked ResizeObserver.
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyDimensions(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  const measurementContainer = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div
        ref={wrapperRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'inline-block',
        }}
      >
        {component}
      </div>,
      document.body,
    );
  }, [component]);

  return {
    nodeWidth: dimensions.nodeWidth,
    nodeHeight: dimensions.nodeHeight,
    measurementContainer,
  };
}
