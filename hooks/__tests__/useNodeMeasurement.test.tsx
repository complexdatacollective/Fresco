import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';

type ROCallback = ResizeObserverCallback;

let latestObserverInstances: MockResizeObserver[];

class MockResizeObserver {
  callback: ROCallback;
  observeSpy = vi.fn();
  disconnectSpy = vi.fn();

  constructor(cb: ROCallback) {
    this.callback = cb;
    latestObserverInstances.push(this);
  }

  observe(target: Element) {
    this.observeSpy(target);
  }

  disconnect() {
    this.disconnectSpy();
  }

  unobserve() {}
}

function triggerAllObservers(width: number, height: number) {
  for (const obs of latestObserverInstances) {
    obs.callback(
      [{ contentRect: { width, height } } as ResizeObserverEntry],
      obs as unknown as ResizeObserver,
    );
  }
}

function TestConsumer({ component }: { component: React.ReactElement }) {
  const { nodeWidth, nodeHeight, portal } = useNodeMeasurement({
    component,
  });
  return (
    <div>
      {portal}
      <div data-testid="width">{nodeWidth}</div>
      <div data-testid="height">{nodeHeight}</div>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNodeMeasurement', () => {
  function setup() {
    latestObserverInstances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  }

  test('returns zero dimensions before ResizeObserver fires', () => {
    setup();
    const { getByTestId } = render(
      <TestConsumer component={<div>test</div>} />,
    );
    expect(getByTestId('width').textContent).toBe('0');
    expect(getByTestId('height').textContent).toBe('0');
  });

  test('creates a hidden container on document.body', () => {
    setup();
    render(<TestConsumer component={<div>test</div>} />);

    const containers = document.querySelectorAll(
      'div[style*="visibility: hidden"]',
    );
    expect(containers.length).toBeGreaterThanOrEqual(1);
  });

  test('renders portal content into the hidden container', () => {
    setup();
    render(<TestConsumer component={<div>test</div>} />);

    const containers = document.querySelectorAll(
      'div[style*="visibility: hidden"]',
    );
    const container = containers[0]!;
    expect(container.children.length).toBeGreaterThan(0);
  });

  test('creates a ResizeObserver for the portal content', () => {
    setup();
    render(<TestConsumer component={<div>test</div>} />);

    expect(latestObserverInstances.length).toBeGreaterThan(0);
    expect(latestObserverInstances[0]!.observeSpy).toHaveBeenCalled();
  });

  test('updates dimensions when ResizeObserver fires', () => {
    setup();
    const { getByTestId } = render(
      <TestConsumer component={<div>test</div>} />,
    );

    act(() => {
      triggerAllObservers(120, 80);
    });

    expect(getByTestId('width').textContent).toBe('120');
    expect(getByTestId('height').textContent).toBe('80');
  });

  test('updates dimensions when size changes', () => {
    setup();
    const { getByTestId } = render(
      <TestConsumer component={<div>test</div>} />,
    );

    act(() => {
      triggerAllObservers(100, 100);
    });
    expect(getByTestId('width').textContent).toBe('100');

    act(() => {
      triggerAllObservers(200, 150);
    });
    expect(getByTestId('width').textContent).toBe('200');
    expect(getByTestId('height').textContent).toBe('150');
  });

  test('cleans up container on unmount', () => {
    setup();
    const { unmount } = render(<TestConsumer component={<div>test</div>} />);

    const before = document.querySelectorAll(
      'div[style*="visibility: hidden"]',
    ).length;

    unmount();

    const after = document.querySelectorAll(
      'div[style*="visibility: hidden"]',
    ).length;

    expect(after).toBeLessThan(before);
  });

  test('disconnects observer on unmount', () => {
    setup();
    const { unmount } = render(<TestConsumer component={<div>test</div>} />);

    expect(latestObserverInstances.length).toBeGreaterThan(0);

    unmount();

    const anyDisconnected = latestObserverInstances.some(
      (obs) => obs.disconnectSpy.mock.calls.length > 0,
    );
    expect(anyDisconnected).toBe(true);
  });
});
