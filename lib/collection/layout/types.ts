import { type Key } from 'react-aria-components';

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
export type LayoutInfo = {
  key: Key;
  rect: Rect;
};
export type LayoutOptions = {
  containerWidth: number;
  containerHeight?: number;
};

/**
 * Measurement mode for virtualization.
 * - 'none': No measurement needed (fixed sizes)
 * - 'height-only': Measure height with constrained width (GridLayout, ListLayout)
 * - 'intrinsic': Measure full intrinsic size (InlineGridLayout)
 */
export type MeasurementMode = 'none' | 'height-only' | 'intrinsic';

/**
 * Information about how items should be measured for virtualization.
 */
export type MeasurementInfo = {
  mode: MeasurementMode;
  /** For 'height-only' mode: the width to constrain items to during measurement */
  constrainedWidth?: number;
};

/**
 * Row information for virtualization.
 * Groups items that share the same Y position into rows.
 */
export type RowInfo = {
  rowIndex: number;
  yStart: number;
  height: number;
  itemKeys: Key[];
};
