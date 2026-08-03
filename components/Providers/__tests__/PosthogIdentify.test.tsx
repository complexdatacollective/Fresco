import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOptOutCapturing, mockOptInCapturing, mockRegister, mockIdentify } =
  vi.hoisted(() => ({
    mockOptOutCapturing: vi.fn(),
    mockOptInCapturing: vi.fn(),
    mockRegister: vi.fn(),
    mockIdentify: vi.fn(),
  }));

vi.mock('posthog-js', () => ({
  default: {
    opt_out_capturing: mockOptOutCapturing,
    opt_in_capturing: mockOptInCapturing,
    register: mockRegister,
    identify: mockIdentify,
  },
}));

vi.mock('~/fresco.config', () => ({
  POSTHOG_APP_NAME: 'Fresco',
}));

import { PostHogIdentify } from '../PosthogIdentify';

describe('PostHogIdentify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('calls opt_out_capturing when disableAnalytics is true', () => {
    render(
      <PostHogIdentify disableAnalytics={true} installationId="install-123" />,
    );

    expect(mockOptOutCapturing).toHaveBeenCalled();
    expect(mockIdentify).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls opt_in_capturing, register, and identify when analytics enabled with installationId', () => {
    render(
      <PostHogIdentify disableAnalytics={false} installationId="install-123" />,
    );

    expect(mockOptInCapturing).toHaveBeenCalled();
    expect(mockRegister).toHaveBeenCalledWith({
      app: 'Fresco',
      installation_id: 'install-123',
    });
    expect(mockIdentify).toHaveBeenCalledWith('install-123');
  });

  it('does not call register or identify when installationId is undefined', () => {
    render(
      <PostHogIdentify disableAnalytics={false} installationId={undefined} />,
    );

    expect(mockOptInCapturing).toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockIdentify).not.toHaveBeenCalled();
  });
});
