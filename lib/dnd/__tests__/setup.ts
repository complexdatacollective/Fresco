// Test setup for drag and drop tests
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi
  .fn()
  .mockImplementation((cb: FrameRequestCallback) => {
    setTimeout(cb, 16);
    return 1;
  });

global.cancelAnimationFrame = vi.fn();

// Mock pointer events for drag and drop
Object.defineProperty(global, 'PointerEvent', {
  value: class PointerEvent extends Event {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 1;
      this.clientX = init?.clientX ?? 0;
      this.clientY = init?.clientY ?? 0;
    }
    pointerId: number;
    clientX: number;
    clientY: number;
  },
  writable: true,
  configurable: true,
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  toJSON: vi.fn(),
}));

// Mock setPointerCapture and releasePointerCapture
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
