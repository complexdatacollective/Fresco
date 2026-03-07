export type LayoutDimensions = {
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
  rowGap: number;
  columnGap: number;
};

export function computeLayoutMetrics(dims: LayoutDimensions) {
  const containerWidth = Math.max(dims.nodeWidth, dims.labelWidth);
  const containerHeight = dims.nodeHeight + dims.labelHeight;
  const rowHeight = containerHeight + dims.rowGap;
  const siblingSpacing = containerWidth + dims.columnGap;
  const partnerSpacing = containerWidth + dims.columnGap;

  return {
    containerWidth,
    containerHeight,
    rowHeight,
    siblingSpacing,
    partnerSpacing,
  };
}

export const LEGACY_DIMENSIONS: LayoutDimensions = {
  nodeWidth: 100,
  nodeHeight: 100,
  labelWidth: 150,
  labelHeight: 60,
  rowGap: 70,
  columnGap: 0,
};
