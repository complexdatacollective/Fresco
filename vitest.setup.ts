// Mock ResizeObserver for jsdom environment
// The callback must be invoked with width > 0 to prevent infinite re-render loops
// in components that wait for container measurements (e.g., Collection)
class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    // Fire callback immediately (like real ResizeObserver does on first observe)
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            toJSON: () => ({}),
          } as DOMRectReadOnly,
          borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
        } as ResizeObserverEntry,
      ],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;
