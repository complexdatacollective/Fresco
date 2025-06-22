export type VisualTestConfig = {
  threshold: number;
  maxDiffPixels: number;
  fullPage: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: string[];
  animations?: 'disabled' | 'allow';
};

export const defaultVisualConfig: VisualTestConfig = {
  threshold: 0.2,
  maxDiffPixels: 1000,
  fullPage: false,
  animations: 'disabled',
};

export const strictVisualConfig: VisualTestConfig = {
  threshold: 0.1,
  maxDiffPixels: 100,
  fullPage: false,
  animations: 'disabled',
};

export const fullPageVisualConfig: VisualTestConfig = {
  threshold: 0.2,
  maxDiffPixels: 2000,
  fullPage: true,
  animations: 'disabled',
};

// export const mobileVisualConfig: VisualTestConfig = {
//   threshold: 0.2,
//   maxDiffPixels: 500,
//   fullPage: false,
//   animations: 'disabled',
// };

// Common selectors to mask in screenshots (dynamic content)
export const commonMasks = [
  '[data-testid="timestamp"]',
  '[data-testid="time-ago"]',
  '[data-testid="loading-spinner"]',
  '.toaster',
  '[data-testid="activity-feed-timestamp"]',
  'time', // Mask all time elements to handle dynamic timestamps
];

// Viewport configurations for different test scenarios
export const viewports = {
  androidTabletHorizontal: { width: 1280, height: 800 },
  ipadHorizontal: { width: 1024, height: 768 },
  hd: { width: 1920, height: 1080 },
  qhd: { width: 2560, height: 1440 },
} as const;

// Default viewport for visual tests
export const defaultViewport = viewports.hd;
