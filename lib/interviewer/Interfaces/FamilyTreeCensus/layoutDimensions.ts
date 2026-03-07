export type LayoutDimensions = {
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
};

export function computeLayoutMetrics(dims: LayoutDimensions) {
  const rowGap = Math.round(dims.nodeHeight * 0.7);
  const columnGap = Math.round(dims.nodeWidth * 0.1);
  const containerWidth = Math.max(dims.nodeWidth, dims.labelWidth);
  const containerHeight = dims.nodeHeight + dims.labelHeight;
  const rowHeight = containerHeight + rowGap;
  const siblingSpacing = containerWidth + columnGap;
  const partnerSpacing = containerWidth + columnGap;

  return {
    containerWidth,
    containerHeight,
    rowGap,
    columnGap,
    rowHeight,
    siblingSpacing,
    partnerSpacing,
  };
}
