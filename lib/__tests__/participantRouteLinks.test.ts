import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Participant routes must only ever be entered by a full page load.
 *
 * Session replay stores the page URL inside its own payload, where the
 * redaction in `~/lib/analyticsRedaction` cannot reach it — and on these routes
 * that URL is the participant's access credential. posthog-js decides whether
 * to record when it initialises, so a fresh load arrives with replay already
 * disabled. A client-side `<Link>` changes the URL and renders the interview
 * before any effect can stop a recorder that is already running, which is why
 * the dashboard's "Enter Interview" control is a plain anchor.
 *
 * This is easy to undo without noticing, so it is checked rather than assumed.
 */

const SEARCHED_DIRECTORIES = ['app', 'components'];

/** A Next <Link> whose href is built from a participant route. */
const CLIENT_SIDE_PARTICIPANT_LINK =
  /<Link\b[^>]*href=\{`\/(?:interview|onboard)\//s;

function sourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : sourceFiles(path);
    }

    return path.endsWith('.tsx') ? [path] : [];
  });
}

describe('participant routes', () => {
  it('are never entered by client-side navigation', () => {
    const offenders = SEARCHED_DIRECTORIES.flatMap(sourceFiles).filter((path) =>
      CLIENT_SIDE_PARTICIPANT_LINK.test(readFileSync(path, 'utf8')),
    );

    expect(offenders).toEqual([]);
  });

  // Proves the scan above can actually see what it is looking for.
  it('is checked by a pattern that matches a real link', () => {
    expect(
      CLIENT_SIDE_PARTICIPANT_LINK.test(
        '<Link href={`/interview/${row.original.id}`}>',
      ),
    ).toBe(true);
    expect(
      CLIENT_SIDE_PARTICIPANT_LINK.test(
        '<a href={`/interview/${row.original.id}`}>',
      ),
    ).toBe(false);
  });
});
