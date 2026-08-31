import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApplyAnalyticsDecision } = vi.hoisted(() => ({
  mockApplyAnalyticsDecision: vi.fn(),
}));

vi.mock('~/lib/applyAnalyticsDecision', () => ({
  applyAnalyticsDecision: mockApplyAnalyticsDecision,
}));

import ApplyAnalyticsDecision from '../ApplyAnalyticsDecision';

describe('ApplyAnalyticsDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies the decision it is given', () => {
    render(
      <ApplyAnalyticsDecision
        decision={{ enabled: true, installationId: 'install-123' }}
      />,
    );

    expect(mockApplyAnalyticsDecision).toHaveBeenCalledWith({
      enabled: true,
      installationId: 'install-123',
    });
  });

  // A researcher turning analytics off invalidates the setting, which
  // re-renders this with a new answer. Without it the tab would keep
  // capturing until the next full page load.
  it('follows the decision when the setting changes', () => {
    const { rerender } = render(
      <ApplyAnalyticsDecision
        decision={{ enabled: true, installationId: 'install-123' }}
      />,
    );

    rerender(<ApplyAnalyticsDecision decision={{ enabled: false }} />);

    expect(mockApplyAnalyticsDecision).toHaveBeenLastCalledWith({
      enabled: false,
      installationId: undefined,
    });
  });

  it('does not reapply an unchanged decision on re-render', () => {
    const { rerender } = render(
      <ApplyAnalyticsDecision
        decision={{ enabled: true, installationId: 'install-123' }}
      />,
    );

    rerender(
      <ApplyAnalyticsDecision
        decision={{ enabled: true, installationId: 'install-123' }}
      />,
    );

    expect(mockApplyAnalyticsDecision).toHaveBeenCalledTimes(1);
  });
});
