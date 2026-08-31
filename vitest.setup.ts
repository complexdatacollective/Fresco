import '@testing-library/jest-dom/vitest';

// Motion's viewport features use IntersectionObserver, which jsdom does not
// implement. Keep observation inert unless an individual test supplies a
// behavior-specific observer.
class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];

  disconnect() {}

  observe() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

global.IntersectionObserver = IntersectionObserverMock;

// Mock ResizeObserver for jsdom environment
// The callback must be invoked with width > 0 so Collection can measure items
// IMPORTANT: Use queueMicrotask to defer callback like real ResizeObserver
// This prevents infinite loops with hooks that trigger re-renders on containerWidth changes

// Track elements globally to prevent duplicate callbacks
const globalObservedElements = new WeakSet<Element>();
// Track pending callbacks to allow cancellation
const pendingCallbacks = new WeakMap<Element, () => void>();

class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback;
  private localObservedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.localObservedElements.add(target);

    // Only fire callback once per element globally
    if (globalObservedElements.has(target)) {
      return;
    }
    globalObservedElements.add(target);

    // Use queueMicrotask to defer callback like real ResizeObserver
    // This allows React to complete its render cycle before we trigger state updates
    const callbackFn = () => {
      // Check if element was unobserved before callback fires
      if (!this.localObservedElements.has(target)) {
        return;
      }

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
            },
            borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
            contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
            devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          },
        ],
        this,
      );
    };

    pendingCallbacks.set(target, callbackFn);
    queueMicrotask(callbackFn);
  }

  unobserve(target: Element) {
    this.localObservedElements.delete(target);
    pendingCallbacks.delete(target);
  }

  disconnect() {
    for (const el of this.localObservedElements) {
      pendingCallbacks.delete(el);
    }
    this.localObservedElements.clear();
  }
}

global.ResizeObserver = ResizeObserverMock;

// jsdom doesn't implement Element.scrollTo — polyfill as a no-op so code
// that calls scrollTo after navigation/resets doesn't throw under tests.
if (typeof Element.prototype.scrollTo !== 'function') {
  Element.prototype.scrollTo = function scrollTo() {
    // no-op
  };
}

// Pin the default locale for Intl.DateTimeFormat. Node's runtime default
// depends on the host's LANG/LC_ALL env vars, which makes any assertion
// against locale-formatted strings flaky across dev machines and CI. We
// subclass the original constructor and substitute 'en-US' when no locale
// is passed, so `new Intl.DateTimeFormat(undefined, …)` (our production call
// site) behaves as en-US under test while explicit locale arguments still
// work unchanged.
const OriginalDateTimeFormat = Intl.DateTimeFormat;
class PinnedDateTimeFormat extends OriginalDateTimeFormat {
  constructor(
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    super(locales ?? 'en-US', options);
  }
}
// Cast matches the pattern already used for `global.Worker = WorkerMock as
// unknown as typeof Worker` below — `Intl.DateTimeFormat`'s type includes a
// call-without-`new` signature that ES classes can't express directly.
Intl.DateTimeFormat =
  PinnedDateTimeFormat as unknown as typeof Intl.DateTimeFormat;

// Mock offsetWidth and offsetHeight on HTMLElement for immediate container width detection
// This allows hooks like useCollectionSetup to get initial dimensions synchronously
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 600;
  },
});

// Mock Web Worker for jsdom environment
// The worker mock provides a minimal implementation that supports the search worker API
class WorkerMock implements Worker {
  onmessage: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
  onmessageerror: ((this: Worker, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => unknown) | null = null;

  postMessage() {
    // No-op - Comlink will handle the communication
  }

  terminate() {
    // No-op
  }

  addEventListener() {
    // No-op
  }

  removeEventListener() {
    // No-op
  }

  dispatchEvent(): boolean {
    return true;
  }
}

global.Worker = WorkerMock;
