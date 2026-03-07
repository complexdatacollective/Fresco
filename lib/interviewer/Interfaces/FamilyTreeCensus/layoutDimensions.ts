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
