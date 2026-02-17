import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Annotations from '~/lib/interviewer/Interfaces/Narrative/Annotations';

afterEach(cleanup);

// jsdom does not implement setPointerCapture; provide a no-op to avoid errors
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined;
  }
}

function getContainerDiv(container: HTMLElement) {
  return container.firstChild as HTMLDivElement;
}

function startDraw(
  div: HTMLElement,
  start: { clientX: number; clientY: number },
) {
  fireEvent.pointerDown(div, {
    button: 0,
    clientX: start.clientX,
    clientY: start.clientY,
    pointerId: 1,
  });
}

function moveDraw(
  div: HTMLElement,
  points: { clientX: number; clientY: number }[],
) {
  for (const point of points) {
    fireEvent.pointerMove(div, {
      clientX: point.clientX,
      clientY: point.clientY,
    });
  }
}

function endDraw(div: HTMLElement) {
  fireEvent.pointerUp(div);
}

describe('Annotations', () => {
  it('renders an svg element inside the container div', () => {
    const { container } = render(
      <Annotations isFrozen={false} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);
    const svg = div.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('container div does not have z-10 class', () => {
    const { container } = render(
      <Annotations isFrozen={false} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);
    expect(div.classList.contains('z-10')).toBe(false);
  });

  it('creates a path element inside svg while drawing is active', () => {
    const { container } = render(
      <Annotations isFrozen={false} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);

    // While isDrawing is true and index === lines.length - 1, the line is visible
    act(() => {
      startDraw(div, { clientX: 10, clientY: 10 });
      moveDraw(div, [
        { clientX: 20, clientY: 20 },
        { clientX: 30, clientY: 30 },
      ]);
    });

    const svg = div.querySelector('svg');
    expect(svg).not.toBeNull();
    const paths = svg!.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('path element is rendered inside svg (not wrapped in a div)', () => {
    const { container } = render(
      <Annotations isFrozen={false} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);

    act(() => {
      startDraw(div, { clientX: 10, clientY: 10 });
      moveDraw(div, [{ clientX: 50, clientY: 50 }]);
    });

    const svg = div.querySelector('svg');
    const path = svg!.querySelector('path');
    expect(path).not.toBeNull();
    // The path's parent should be the svg, not a div
    expect(path!.parentElement?.tagName.toLowerCase()).toBe('svg');
  });

  it('frozen lines persist as static paths after drawing', () => {
    const { container } = render(
      <Annotations isFrozen={true} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);

    act(() => {
      startDraw(div, { clientX: 5, clientY: 5 });
      moveDraw(div, [{ clientX: 15, clientY: 15 }]);
      endDraw(div);
    });

    // When frozen, linesShowing[0] = true and isFrozen = true so freezeLine = true
    // The static <path> (not motion.path) renders unconditionally
    const svg = div.querySelector('svg');
    const paths = svg!.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('calls onChangeActiveAnnotations(true) when drawing starts', () => {
    const onChangeActiveAnnotations = vi.fn();
    const { container } = render(
      <Annotations
        isFrozen={false}
        onChangeActiveAnnotations={onChangeActiveAnnotations}
      />,
    );
    const div = getContainerDiv(container);

    act(() => {
      startDraw(div, { clientX: 10, clientY: 10 });
    });

    expect(onChangeActiveAnnotations).toHaveBeenCalledWith(true);
  });

  it('ignores non-primary mouse button presses', () => {
    const onChangeActiveAnnotations = vi.fn();
    const { container } = render(
      <Annotations
        isFrozen={false}
        onChangeActiveAnnotations={onChangeActiveAnnotations}
      />,
    );
    const div = getContainerDiv(container);

    act(() => {
      fireEvent.pointerDown(div, {
        button: 1,
        clientX: 10,
        clientY: 10,
        pointerId: 1,
      });
    });

    expect(onChangeActiveAnnotations).not.toHaveBeenCalled();
  });

  it('does not create a path without a prior pointerdown', () => {
    const { container } = render(
      <Annotations isFrozen={false} onChangeActiveAnnotations={vi.fn()} />,
    );
    const div = getContainerDiv(container);

    act(() => {
      fireEvent.pointerMove(div, { clientX: 20, clientY: 20 });
    });

    const svg = div.querySelector('svg');
    const paths = svg!.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });

  it('exposes a reset handle that clears all drawn lines', async () => {
    const { default: React } = await import('react');
    const onChangeActiveAnnotations = vi.fn();
    const ref = React.createRef<{ reset: () => void }>();

    const { container } = render(
      <Annotations
        ref={ref}
        isFrozen={true}
        onChangeActiveAnnotations={onChangeActiveAnnotations}
      />,
    );

    const div = container.firstChild as HTMLDivElement;

    act(() => {
      startDraw(div, { clientX: 10, clientY: 10 });
      moveDraw(div, [{ clientX: 30, clientY: 30 }]);
      endDraw(div);
    });

    // With isFrozen, the static path persists
    const svgBefore = div.querySelector('svg');
    expect(svgBefore!.querySelectorAll('path').length).toBeGreaterThan(0);

    act(() => {
      ref.current!.reset();
    });

    const svgAfter = div.querySelector('svg');
    expect(svgAfter!.querySelectorAll('path').length).toBe(0);
  });
});
