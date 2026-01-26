import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing the handler
vi.mock('~/actions/interviews', () => ({
  createInterview: vi.fn(),
}));

vi.mock('~/queries/appSettings', () => ({
  getAppSetting: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('~/env', () => ({
  env: {
    PUBLIC_URL: 'http://localhost:3000',
  },
}));

vi.mock('~/lib/analytics', () => ({
  default: vi.fn(),
}));

// Import after mocks are set up
import { createInterview } from '~/actions/interviews';
import { getAppSetting } from '~/queries/appSettings';
import { cookies } from 'next/headers';

// Import the handlers
import { GET, POST } from '../route';

const mockCreateInterview = vi.mocked(createInterview);
const mockGetAppSetting = vi.mocked(getAppSetting);
const mockCookies = vi.mocked(cookies);

describe('Onboard Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetAppSetting.mockResolvedValue(false);
    mockCookies.mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    } as ReturnType<typeof cookies>);
  });

  describe('GET handler', () => {
    it('should redirect to error page when no protocolId is provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboard/undefined',
      );
      const params = { protocolId: 'undefined' };

      const response = await GET(request, { params });

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/onboard/error',
      );
    });

    it('should extract participantIdentifier from query string', async () => {
      const protocolId = 'test-protocol-id';
      const participantIdentifier = 'TEST-PARTICIPANT-001';
      const createdInterviewId = 'interview-123';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
      );
      const params = { protocolId };

      const response = await GET(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier,
        protocolId,
      });
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        `http://localhost:3000/interview/${createdInterviewId}`,
      );
    });

    it('should pass undefined when no participantIdentifier is provided', async () => {
      const protocolId = 'test-protocol-id';
      const createdInterviewId = 'interview-456';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
      );
      const params = { protocolId };

      await GET(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier: undefined,
        protocolId,
      });
    });

    it('should redirect to finished page when limitInterviews is enabled and cookie exists', async () => {
      const protocolId = 'test-protocol-id';

      mockGetAppSetting.mockResolvedValue(true);
      mockCookies.mockReturnValue({
        get: vi.fn().mockReturnValue({ value: 'completed' }),
      } as unknown as ReturnType<typeof cookies>);

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
      );
      const params = { protocolId };

      const response = await GET(request, { params });

      expect(mockCreateInterview).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/interview/finished',
      );
    });

    it('should allow new interview when limitInterviews is enabled but no cookie exists', async () => {
      const protocolId = 'test-protocol-id';
      const createdInterviewId = 'interview-789';

      mockGetAppSetting.mockResolvedValue(true);
      mockCookies.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as ReturnType<typeof cookies>);
      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
      );
      const params = { protocolId };

      const response = await GET(request, { params });

      expect(mockCreateInterview).toHaveBeenCalled();
      expect(response.headers.get('location')).toBe(
        `http://localhost:3000/interview/${createdInterviewId}`,
      );
    });

    it('should redirect to error page when createInterview returns an error', async () => {
      const protocolId = 'test-protocol-id';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId: null,
        error: 'Failed to create interview',
        errorType: 'unknown-error',
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
      );
      const params = { protocolId };

      const response = await GET(request, { params });

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/onboard/error',
      );
    });
  });

  describe('POST handler', () => {
    it('should extract participantIdentifier from JSON body', async () => {
      const protocolId = 'test-protocol-id';
      const participantIdentifier = 'POST-PARTICIPANT-001';
      const createdInterviewId = 'interview-post-123';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
        {
          method: 'POST',
          body: JSON.stringify({ participantIdentifier }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const params = { protocolId };

      const response = await POST(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier,
        protocolId,
      });
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe(
        `http://localhost:3000/interview/${createdInterviewId}`,
      );
    });

    it('should handle POST with empty body gracefully', async () => {
      const protocolId = 'test-protocol-id';
      const createdInterviewId = 'interview-post-456';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const params = { protocolId };

      await POST(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier: undefined,
        protocolId,
      });
    });

    it('should redirect to error page when POST body parsing fails', async () => {
      const protocolId = 'test-protocol-id';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId: null,
        error: 'Failed to create interview',
        errorType: 'parse-error',
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
        {
          method: 'POST',
          body: JSON.stringify(null),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const params = { protocolId };

      await POST(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier: undefined,
        protocolId,
      });
    });

    it('should check limitInterviews for POST requests too', async () => {
      const protocolId = 'test-protocol-id';

      mockGetAppSetting.mockResolvedValue(true);
      mockCookies.mockReturnValue({
        get: vi.fn().mockReturnValue({ value: 'completed' }),
      } as unknown as ReturnType<typeof cookies>);

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
        {
          method: 'POST',
          body: JSON.stringify({ participantIdentifier: 'test' }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const params = { protocolId };

      const response = await POST(request, { params });

      expect(mockCreateInterview).not.toHaveBeenCalled();
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/interview/finished',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle protocolId with special characters', async () => {
      const protocolId = 'test-protocol-123_abc';
      const createdInterviewId = 'interview-special';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}`,
      );
      const params = { protocolId };

      const response = await GET(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier: undefined,
        protocolId,
      });
      expect(response.headers.get('location')).toBe(
        `http://localhost:3000/interview/${createdInterviewId}`,
      );
    });

    it('should handle URL-encoded participantIdentifier', async () => {
      const protocolId = 'test-protocol-id';
      const participantIdentifier = 'user@example.com';
      const createdInterviewId = 'interview-encoded';

      mockCreateInterview.mockResolvedValue({
        createdInterviewId,
        error: null,
        errorType: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/onboard/${protocolId}?participantIdentifier=${encodeURIComponent(participantIdentifier)}`,
      );
      const params = { protocolId };

      await GET(request, { params });

      expect(mockCreateInterview).toHaveBeenCalledWith({
        participantIdentifier,
        protocolId,
      });
    });
  });
});
