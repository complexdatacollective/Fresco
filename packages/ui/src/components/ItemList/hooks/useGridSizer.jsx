import { renderToString } from 'react-dom/server';
import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
} from 'react';

// Get a DOM element's height, including margins.
const getElementHeight = (element) => {
  const { height } = element.getBoundingClientRect();
  const elementStyle = window.getComputedStyle(element);

  // height: element height + vertical padding & borders
  // now we just need to add vertical margins
  const totalHeight = ['top', 'bottom']
    .map((side) => parseInt(elementStyle[`margin-${side}`], 10))
    .reduce((total, side) => total + side, height);

  return totalHeight;
};

/**
 * This is an enhancement for react-window, which allows items in a grid
 * to have dynamic heights.
 *
 * Because items may flow, this actually renders the item in a hidden div
 * taking into account the column width.
 *
 * Each row will be sized according to the tallest item on that row.
 *
 * Usage:
 *
 * const [
 *   gridProps,
 *   ready, // has hidden div been rendered, ready to measure items
 *   setWidth, // how wide is the total container width (all columns)
 * ] = useGridSizer(true, ItemComponent, [{}, ...], 2);
 *
 * return (
 *   <Grid {...gridProps} />
 * );
 */
const useGridSizer = (
  useItemSizing,
  columnBreakpoints,
  ItemComponent,
  items,
  containerWidth,
  minimumHeight = 150,
) => {
  const [hiddenSizingEl, setHiddenSizingElement] = useState(null);

  useEffect(() => {
    if (hiddenSizingEl) {
      document.getElementsByClassName('hidden-sizer')[0].remove();
      setHiddenSizingElement(null);
    }

    // Create a container div to render the sizing element inside of
    const newHiddenSizingEl = document.createElement('div');
    newHiddenSizingEl.classList.add('hidden-sizer');

    // Make the element full width/height of the screen, so the intrinsic size
    // of the item is not constrained by the container
    newHiddenSizingEl.style.position = 'absolute';
    newHiddenSizingEl.style.top = '0';
    newHiddenSizingEl.style.pointerEvents = 'none';
    newHiddenSizingEl.style.visibility = 'hidden';
    newHiddenSizingEl.style.width = '100%';
    newHiddenSizingEl.style.height = '100%';

    // Render the ItemComponent inside of the container
    newHiddenSizingEl.innerHTML = renderToString(<ItemComponent />);

    const element = document.body.appendChild(newHiddenSizingEl);

    // Set the hidden sizing element to the ItemComponent (not the container!)
    setHiddenSizingElement(element.firstElementChild);
  }, [ItemComponent, useItemSizing]);

  // Set ready to true only after we have rendered our hidden sizing element
  // Consumers use this to know when to expect sane values.
  const ready = useMemo(() => (
    hiddenSizingEl && containerWidth > 0
  ), [hiddenSizingEl, containerWidth]);

  const itemCount = (items && items.length) || 0;

  // Number of columns to render
  const columnCount = useMemo(() => {
    // When using item sizing, we calculate the item's size, using the
    // hidden sizing element, and then determine how many columns we
    // can fit within the container width.
    if (useItemSizing) {
      if (!hiddenSizingEl) { return 1; }
      const { width } = hiddenSizingEl.getBoundingClientRect();
      const columns = Math.floor(containerWidth / width);
      return columns > 1 ? columns : 1;
    }

    // When not using item sizing, use the breakpoints configuration.
    const breakpoints = Object.keys(columnBreakpoints).sort();
    const activeBreakpoint = breakpoints.find((bp) => bp < containerWidth);
    return columnBreakpoints[activeBreakpoint] || 1;
  }, [useItemSizing, hiddenSizingEl, containerWidth, columnBreakpoints]);

  const rowCount = useMemo(() => (
    Math.ceil((itemCount || 0) / columnCount)
  ), [itemCount, columnCount]);

  const columnWidth = useCallback(() => (
    containerWidth / columnCount
  ), [containerWidth, columnCount]);

  // Calculate row height based on height of hiddenSizingEl
  const rowHeight = useCallback(
    (rowIndex) => {
      // If we don't have a hidden sizing element, we can't calculate
      if (!hiddenSizingEl) { return minimumHeight; }

      // Get the hiddenSizing element's intrinsic height
      const height = getElementHeight(hiddenSizingEl);

      // If we are using item sizing, return the intrinsic height
      if (useItemSizing) {
        return height;
      }

      // Otherwise, we need to resize the hiddenSizing element to the column
      // with, and then calculate the height of the tallest item.
      hiddenSizingEl.style.width = `${columnWidth()}px`;

      const start = rowIndex * columnCount;
      const end = start + columnCount;

      const biggestRowHeight = items.slice(start, end)
        .reduce(
          (acc) => (
            height > acc
              ? height
              : acc
          ), 0,
        );

      return biggestRowHeight > 0 ? biggestRowHeight : minimumHeight;
    },
    [useItemSizing, hiddenSizingEl, items, ItemComponent],
  );

  return [
    {
      key: `${containerWidth}-${columnCount}-${itemCount}-${useItemSizing}`,
      columnCount,
      rowCount,
      columnWidth,
      rowHeight,
    },
    ready,
  ];
};

export default useGridSizer;
