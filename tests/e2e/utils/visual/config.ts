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

// CI-specific configuration with higher tolerance for instability
export const ciVisualConfig: VisualTestConfig = {
  threshold: 0.3,
  maxDiffPixels: 5000,
  fullPage: false,
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
  // Additional elements that may cause instability
  '[data-testid="error-message"]', // Error messages may have dynamic IDs or timing
  '.error-message',
  '[role="alert"]',
  '[aria-live]',
  '.animate-pulse',
  '.animate-spin',
  '.animate-bounce',
  // Form validation that may appear/disappear
  '.field-error',
  '[data-testid="form-error"]',
  '.validation-error',
  // Dynamic buttons/states
  '[disabled]', // Disabled state buttons may flicker
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
