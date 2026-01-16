'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type Layout } from '../layout/Layout';
import { type Size } from '../layout/types';
import { type Collection, type ItemRenderer, type Key } from '../types';

export type UseMeasureItemsOptions<T> = {
  collection: Collection<T>;
  layout: Layout<T>;
  renderItem: ItemRenderer<T>;
  containerWidth: number;
  /** Set to true to skip measurement (for non-virtualized rendering) */
  skip?: boolean;
  /**
   * Font size to use for measurement container.
   * Important: Spacing uses em units, so measurements must use the same font-size
   * as the actual render container to get accurate results.
   */
  fontSize?: string;
};

export type UseMeasureItemsResult = {
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
 * For 'height-only' mode: Items are constrained to a specific width, only height is measured.
 * For 'intrinsic' mode: Items render naturally, full width and height are measured.
 */
export function useMeasureItems<T>({
  collection,
  layout,
  renderItem,
  containerWidth,
  skip = false,
  fontSize,
}: UseMeasureItemsOptions<T>): UseMeasureItemsResult {
  const [measurements, setMeasurements] = useState<Map<Key, Size>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Map<Key, HTMLDivElement>>(new Map());

  // Track container width that was used for last measurement
  const lastMeasuredWidthRef = useRef<number>(0);

  // Get measurement info from layout
  const measurementInfo = layout.getMeasurementInfo();

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

  // Check if width changed significantly enough to require re-measurement
  const needsRemeasurement = useCallback(() => {
    if (measurementInfo.mode !== 'height-only') return false;
    const widthChange = Math.abs(containerWidth - lastMeasuredWidthRef.current);
    return widthChange > WIDTH_CHANGE_THRESHOLD;
  }, [containerWidth, measurementInfo.mode]);

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

    lastMeasuredWidthRef.current = containerWidth;
    setMeasurements(newMeasurements);
    setIsComplete(newMeasurements.size === orderedKeys.length);
  }, [orderedKeys, measurementInfo.mode, skip, containerWidth]);

  // Reset measurements when collection changes
  useLayoutEffect(() => {
    setIsComplete(false);
    setMeasurements(new Map());
  }, [collection]);

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

    // Calculate item style based on measurement mode
    const itemStyle: React.CSSProperties =
      measurementInfo.mode === 'height-only' && measurementInfo.constrainedWidth
        ? { width: measurementInfo.constrainedWidth }
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
          // For height-only mode, constrain container width
          width:
            measurementInfo.mode === 'height-only' ? containerWidth : undefined,
          // Match the font-size of the scroll container for accurate em-based measurements
          fontSize,
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
    fontSize,
  ]);

  return {
    measurements,
    isComplete,
    measurementContainer,
  };
}
