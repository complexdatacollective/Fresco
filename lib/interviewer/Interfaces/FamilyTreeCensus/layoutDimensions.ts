export type LayoutDimensions = {
  nodeWidth: number;
  nodeHeight: number;
};

export function computeLayoutMetrics(dims: LayoutDimensions) {
  const rowGap = Math.round(dims.nodeHeight * 0.7);
  const columnGap = Math.round(dims.nodeWidth * 0.6);
  const containerWidth = dims.nodeWidth;
  const containerHeight = dims.nodeHeight;
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
