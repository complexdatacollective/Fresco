import { describe, expect, it } from 'vitest';

import {
  isParticipantPath,
  redactParticipantLinks,
  redactProperties,
} from '../analyticsRedaction';

// A cuid, which is what Prisma generates for every id in the schema.
const INTERVIEW_ID = 'clh3k4j5k0000abcdefghijkl';

describe('redactParticipantLinks', () => {
  // The interview id is the participant's whole authentication: knowing it is
  // enough to read and overwrite the interview through the sync route.
  it('redacts the interview id from a path', () => {
    expect(redactParticipantLinks(`/interview/${INTERVIEW_ID}`)).toBe(
      '/interview/[redacted]',
    );
  });

  it('redacts the interview id from a full URL', () => {
    expect(
      redactParticipantLinks(
        `https://fresco.example.org/interview/${INTERVIEW_ID}`,
      ),
    ).toBe('https://fresco.example.org/interview/[redacted]');
  });

  // The onboarding link carries a researcher-assigned identifier that names a
  // person, so the query string goes as well as the path.
  it('redacts the protocol id and the participant identifier', () => {
    expect(
      redactParticipantLinks(
        `https://fresco.example.org/onboard/${INTERVIEW_ID}?participantIdentifier=P01`,
      ),
    ).toBe('https://fresco.example.org/onboard/[redacted]');
  });

  it('drops a fragment on a participant route too', () => {
    expect(redactParticipantLinks(`/interview/${INTERVIEW_ID}#stage-3`)).toBe(
      '/interview/[redacted]',
    );
  });

  it('keeps the named pages under a participant route', () => {
    expect(redactParticipantLinks('/interview/finished')).toBe(
      '/interview/finished',
    );
    expect(redactParticipantLinks('/onboard/invalid-link')).toBe(
      '/onboard/invalid-link',
    );
    expect(redactParticipantLinks('/onboard/no-anonymous-recruitment')).toBe(
      '/onboard/no-anonymous-recruitment',
    );
  });

  it('leaves other routes and their query strings alone', () => {
    expect(
      redactParticipantLinks(
        'https://fresco.example.org/dashboard/interviews?page=2',
      ),
    ).toBe('https://fresco.example.org/dashboard/interviews?page=2');
  });

  // A route added under these prefixes later is redacted until it is listed as
  // a page name. A missing label is the safe way to be wrong.
  it('redacts an unrecognised segment rather than guessing', () => {
    expect(redactParticipantLinks('/interview/some-new-page')).toBe(
      '/interview/[redacted]',
    );
  });

  it('redacts every occurrence in one value', () => {
    expect(
      redactParticipantLinks(
        `/interview/${INTERVIEW_ID} then /onboard/${INTERVIEW_ID}`,
      ),
    ).toBe('/interview/[redacted] then /onboard/[redacted]');
  });
});

describe('redactProperties', () => {
  it('redacts the properties posthog attaches to every event', () => {
    expect(
      redactProperties({
        $current_url: `https://fresco.example.org/interview/${INTERVIEW_ID}`,
        $pathname: `/interview/${INTERVIEW_ID}`,
        $referrer: `https://fresco.example.org/onboard/${INTERVIEW_ID}?participantIdentifier=P01`,
      }),
    ).toEqual({
      $current_url: 'https://fresco.example.org/interview/[redacted]',
      $pathname: '/interview/[redacted]',
      $referrer: 'https://fresco.example.org/onboard/[redacted]',
    });
  });

  // Autocapture records the element that was clicked, including its href.
  it('redacts hrefs nested in autocaptured elements', () => {
    const redacted = redactProperties({
      $event_type: 'click',
      $elements: [
        { tag_name: 'a', attr__href: `/interview/${INTERVIEW_ID}` },
        { tag_name: 'div' },
      ],
    });

    expect(redacted).toEqual({
      $event_type: 'click',
      $elements: [
        { tag_name: 'a', attr__href: '/interview/[redacted]' },
        { tag_name: 'div' },
      ],
    });
  });

  it('leaves values that are not strings alone', () => {
    const properties = { count: 3, enabled: true, missing: null };

    expect(redactProperties(properties)).toEqual(properties);
  });

  // Rebuilding one of these from its own entries would throw it away:
  // `Object.entries(new Date())` is empty, so it would be reported as `{}`.
  it('keeps objects that are not property bags', () => {
    const timestamp = new Date('2026-01-01T00:00:00Z');
    const seen = new Set(['a']);

    const redacted = redactProperties({ timestamp, seen });

    expect(redacted.timestamp).toBe(timestamp);
    expect(redacted.seen).toBe(seen);
  });

  // Replay payloads are large, and are kept safe by not recording participant
  // pages at all rather than by scrubbing them here.
  it('does not walk session replay payloads', () => {
    const snapshot = { href: `/interview/${INTERVIEW_ID}` };

    expect(redactProperties({ $snapshot_data: snapshot }).$snapshot_data).toBe(
      snapshot,
    );
  });

  it('does not mutate the properties it was given', () => {
    const properties = { $pathname: `/interview/${INTERVIEW_ID}` };

    redactProperties(properties);

    expect(properties.$pathname).toBe(`/interview/${INTERVIEW_ID}`);
  });
});

describe('isParticipantPath', () => {
  it('recognises the routes a participant sees', () => {
    expect(isParticipantPath(`/interview/${INTERVIEW_ID}`)).toBe(true);
    expect(isParticipantPath('/interview/finished')).toBe(true);
    expect(isParticipantPath(`/onboard/${INTERVIEW_ID}`)).toBe(true);
    expect(isParticipantPath('/onboard')).toBe(true);
  });

  it('does not claim researcher routes', () => {
    expect(isParticipantPath('/dashboard/interviews')).toBe(false);
    expect(isParticipantPath('/')).toBe(false);
    expect(isParticipantPath('/signin')).toBe(false);
    // Not a participant route, despite the prefix.
    expect(isParticipantPath('/interviews')).toBe(false);
  });
});
