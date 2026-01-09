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
