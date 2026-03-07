import { describe, expect, test } from 'vitest';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions';

describe('computeLayoutMetrics', () => {
  const dims: LayoutDimensions = {
    nodeWidth: 100,
    nodeHeight: 100,
  };

  test('derives rowGap as 70% of nodeHeight', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.rowGap).toBe(Math.round(100 * 0.7));
  });

  test('derives columnGap as 10% of nodeWidth', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.columnGap).toBe(Math.round(100 * 0.1));
  });

  test('containerWidth equals nodeWidth', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.containerWidth).toBe(100);
  });

  test('containerHeight equals nodeHeight', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.containerHeight).toBe(100);
  });

  test('rowHeight is containerHeight + rowGap', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.rowHeight).toBe(metrics.containerHeight + metrics.rowGap);
  });

  test('siblingSpacing is containerWidth + columnGap', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.siblingSpacing).toBe(
      metrics.containerWidth + metrics.columnGap,
    );
  });

  test('partnerSpacing equals siblingSpacing', () => {
    const metrics = computeLayoutMetrics(dims);
    expect(metrics.partnerSpacing).toBe(metrics.siblingSpacing);
  });

  test('gaps scale with different node sizes', () => {
    const small: LayoutDimensions = {
      nodeWidth: 50,
      nodeHeight: 80,
    };
    const metrics = computeLayoutMetrics(small);
    expect(metrics.rowGap).toBe(Math.round(80 * 0.7));
    expect(metrics.columnGap).toBe(Math.round(50 * 0.1));
  });

  test('rounds gaps to integers', () => {
    const odd: LayoutDimensions = {
      nodeWidth: 73,
      nodeHeight: 91,
    };
    const metrics = computeLayoutMetrics(odd);
    expect(Number.isInteger(metrics.rowGap)).toBe(true);
    expect(Number.isInteger(metrics.columnGap)).toBe(true);
  });
});
