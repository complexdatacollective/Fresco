'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type Layout } from '../layout/Layout';
import { type Size } from '../layout/types';
import { type Collection, type ItemRenderer, type Key } from '../types';

type UseMeasureItemsOptions<T> = {
  collection: Collection<T>;
  layout: Layout<T>;
  renderItem: ItemRenderer<T>;
  containerWidth: number;
  /** Set to true to skip measurement (for non-virtualized rendering) */
  skip?: boolean;
};

type UseMeasureItemsResult = {
  /** Map of item key to measured size */
  measurements: Map<Key, Size>;
  /** Whether all items have been measured */
  isComplete: boolean;
  /** React node to render for measurement (hidden container) */
  measurementContainer: React.ReactNode;
};

// Threshold for width change that triggers re-measurement (handles scrollbar fluctuations)
const WIDTH_CHANGE_THRESHOLD = 10;

/**
 * Hook that measures item dimensions for virtualization.
 * Renders items in a hidden container and measures their bounding boxes.
 *
 * Includes a sentinel element that detects root font-size changes via
 * ResizeObserver. This handles cases where external stylesheets load after
 * measurement (e.g. dynamically injected theme CSS), which would cause
 * rem-based values to change.
 *
 * For 'height-only' mode: Items are constrained to a specific width, only height is measured.
 * For 'intrinsic' mode: Items render naturally, full width and height are measured.
 */
export function useMeasureItems<T>({
  collection,
  layout,
  renderItem,
  containerWidth,
  skip = false,
}: UseMeasureItemsOptions<T>): UseMeasureItemsResult {
  const [measurements, setMeasurements] = useState<Map<Key, Size>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Map<Key, HTMLDivElement>>(new Map());

  // Track container width that was used for last measurement
  const lastMeasuredWidthRef = useRef<number>(0);

  // Sentinel ref for detecting root font-size changes via ResizeObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sentinel size captured at the time of last successful measurement.
  // The ResizeObserver compares against this to detect post-measurement changes.
  const lastMeasuredSentinelSizeRef = useRef<{
    width: number;
    height: number;
  } | null>(null);

  // Version counter bumped when root font-size changes, forcing re-measurement
  const [remVersion, setRemVersion] = useState(0);

  // Get measurement info from layout, passing containerWidth so constrainedWidth
  // can be computed on-the-fly without requiring layout.update() to have been called.
  const measurementInfo = layout.getMeasurementInfo(containerWidth);

  // Get ordered keys for iteration
  const orderedKeys = useMemo(
    () => Array.from(collection.getKeys()),
    [collection],
  );

  // Create ref callback for each item
  const createItemRef = useCallback((key: Key) => {
    return (element: HTMLDivElement | null) => {
      if (element) {
        itemRefsRef.current.set(key, element);
      } else {
        itemRefsRef.current.delete(key);
      }
    };
  }, []);

  // Check if width changed significantly enough to require re-measurement.
  // Applies to all measurement modes since container width affects block-level
  // items in both height-only and intrinsic modes.
  const needsRemeasurement = useCallback(() => {
    if (measurementInfo.mode === 'none') return false;
    const widthChange = Math.abs(containerWidth - lastMeasuredWidthRef.current);
    return widthChange > WIDTH_CHANGE_THRESHOLD;
  }, [containerWidth, measurementInfo.mode]);

  // Observe sentinel element for size changes caused by root font-size updates.
  // The sentinel is a 1rem x 1rem div, so it resizes when the root font-size
  // changes (e.g. from 16px default to 20px after a theme stylesheet loads).
  //
  // Compares against the sentinel size captured at measurement time (stored in
  // lastMeasuredSentinelSizeRef) rather than the size when the effect runs.
  // This avoids a timing hole where CSS loads between measurement and effect
  // re-run, causing the new observer to see the already-changed size as its
  // baseline and miss the change.
  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || skip || measurementInfo.mode === 'none') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const lastMeasured = lastMeasuredSentinelSizeRef.current;

      // No measurement taken yet - nothing to invalidate
      if (!lastMeasured) return;

      const { width, height } = entry.contentRect;

      // Sentinel matches what was measured - no rem change
      if (width === lastMeasured.width && height === lastMeasured.height)
        return;

      // Root font-size changed since last measurement - invalidate
      setIsComplete(false);
      setMeasurements(new Map());
      setRemVersion((v) => v + 1);
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [skip, measurementInfo.mode]);

  // Measure all items after they render
  useLayoutEffect(() => {
    // If skip is true, don't mark as complete - we're waiting for containerWidth
    if (skip) {
      return;
    }

    // If no measurement mode or no items, mark as complete
    if (measurementInfo.mode === 'none' || orderedKeys.length === 0) {
      setIsComplete(true);
      return;
    }

    // Wait for refs to be populated
    if (itemRefsRef.current.size === 0) {
      return;
    }

    const newMeasurements = new Map<Key, Size>();

    for (const key of orderedKeys) {
      const element = itemRefsRef.current.get(key);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      // Validate measurements for intrinsic mode
      if (measurementInfo.mode === 'intrinsic') {
        if (rect.width === 0 || rect.height === 0) {
          throw new Error(
            `InlineGridLayout: Item "${String(key)}" measured to ${rect.width}x${rect.height}. ` +
              `Items must have explicit width and height, or content that defines their size.`,
          );
        }
      }

      newMeasurements.set(key, {
        width: rect.width,
        height: rect.height,
      });
    }

    // Capture sentinel size at measurement time so the ResizeObserver
    // can detect changes that occur after this measurement.
    if (sentinelRef.current) {
      const sentinelRect = sentinelRef.current.getBoundingClientRect();
      lastMeasuredSentinelSizeRef.current = {
        width: sentinelRect.width,
        height: sentinelRect.height,
      };
    }

    lastMeasuredWidthRef.current = containerWidth;
    setMeasurements(newMeasurements);
    setIsComplete(newMeasurements.size === orderedKeys.length);
  }, [orderedKeys, measurementInfo.mode, skip, containerWidth, remVersion]);

  // Reset measurements when collection or layout changes
  useLayoutEffect(() => {
    setIsComplete(false);
    setMeasurements(new Map());
    lastMeasuredSentinelSizeRef.current = null;
  }, [collection, layout]);

  // Generate the hidden measurement container
  const measurementContainer = useMemo(() => {
    if (skip || measurementInfo.mode === 'none' || orderedKeys.length === 0) {
      return null;
    }

    // Skip re-rendering measurement container if width didn't change significantly
    // This prevents unnecessary work during scroll when scrollbar causes minor width fluctuations
    if (isComplete && !needsRemeasurement()) {
      return null;
    }

    // Calculate item style based on measurement mode.
    // 'height-only': constrain width so items match the grid column width.
    // 'intrinsic': use fit-content so the wrapper shrinks to the item's
    //   natural size (block-level divs would otherwise expand to container width).
    const itemStyle: React.CSSProperties =
      measurementInfo.mode === 'height-only' && measurementInfo.constrainedWidth
        ? { width: measurementInfo.constrainedWidth }
        : measurementInfo.mode === 'intrinsic'
          ? { width: 'fit-content' }
          : {};

    return (
      <div
        ref={measureContainerRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          // Position off-screen but allow natural sizing
          left: -9999,
          top: 0,
          // Always constrain container to actual width so block-level items
          // (like Cards) render at the correct width in both height-only and
          // intrinsic modes. Items with fixed dimensions (like Nodes) are
          // unaffected since they maintain their size regardless.
          width: containerWidth || undefined,
          // Font-size is inherited from the DOM (measurement container is
          // rendered inside the scroll area). This ensures it stays in sync
          // when external stylesheets load and change root font-size.
        }}
      >
        {orderedKeys.map((key) => {
          const node = collection.getItem(key);
          if (!node) return null;

          // Create a minimal itemProps for measurement
          // We don't need interactivity, just the render output
          const itemProps = {
            ref: createItemRef(key),
            id: `measure-${String(key)}`,
            tabIndex: -1,
            role: 'presentation',
            style: itemStyle,
          };

          return (
            <div key={key} ref={createItemRef(key)} style={itemStyle}>
              {renderItem(node.value, itemProps)}
            </div>
          );
        })}
      </div>
    );
  }, [
    skip,
    measurementInfo,
    orderedKeys,
    collection,
    renderItem,
    containerWidth,
    createItemRef,
    isComplete,
    needsRemeasurement,
  ]);

  // Sentinel element for detecting root font-size changes.
  // Always rendered (even after measurement completes) so ResizeObserver
  // can detect when rem values change due to late-loading stylesheets.
  const sentinel =
    skip || measurementInfo.mode === 'none' ? null : (
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '1rem',
          height: '1rem',
        }}
      />
    );

  return {
    measurements,
    isComplete,
    measurementContainer: (
      <>
        {sentinel}
        {measurementContainer}
      </>
    ),
  };
}
