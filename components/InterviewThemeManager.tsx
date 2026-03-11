'use client';

import { useLayoutEffect } from 'react';

/**
 * Client component that manages the interview theme by adding/removing
 * the data-theme="interview" attribute on the <html> element.
 *
 * This ensures interview CSS variables apply to the entire document,
 * including the body element, which uses bg-background from the theme.
 * The attribute is removed on unmount to prevent theme leakage when
 * navigating away from interview pages.
 *
 * Uses useLayoutEffect to run synchronously before browser paint,
 * preventing flash of unstyled content (FOUC).
 */
export function InterviewThemeManager() {
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', 'interview');

    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  return null;
}
