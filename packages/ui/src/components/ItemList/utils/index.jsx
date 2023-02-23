export const getDataIndex = (columns, { rowIndex, columnIndex }) => (
  (rowIndex * columns) + columnIndex
);

/**
 * @function getDelay
 * Calculates an animation delay for each cell based on its position as well as the
 * current scrolling state of the list.
 *
 * @param {boolean} isScrolling - is the list currently scrolling?
 * @param {number} rowHeight - pixel height of the current row
 * @param {number} containerHeight - pixel height of the list
 * @param {number} numberOfColumns - number of vertical divisions
 * @param {number} columnIndex - the column index of the current item
 * @param {number} rowIndex - the row index of the current item
 * @returns number
 */
export const getDelay = (
  isScrolling,
  rowHeight,
  containerHeight,
  numberOfColumns,
  columnIndex,
  rowIndex,
) => {
  const ITEM_STAGGER = 0.075; // Gap between items
  const BASE_DELAY = 0.01; // Always make delay non-zero

  const rowsToAnimate = Math.ceil(containerHeight / rowHeight()); // Don't animate past viewport

  // Don't delay at all if we are scrolling. This prevents list animation when scrolling back up
  if (isScrolling) { return 0; }

  if (numberOfColumns === 1) {
    // If we only have one column, stagger by row
    return BASE_DELAY + (rowIndex * ITEM_STAGGER);
  }

  // Calculate the delay based on the cell's row and column position
  const colDelay = columnIndex * ITEM_STAGGER;
  const rowDelay = (rowIndex % rowsToAnimate) * (ITEM_STAGGER * numberOfColumns);

  return BASE_DELAY + colDelay + rowDelay;
};
