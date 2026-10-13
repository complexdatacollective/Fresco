import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * PostHog resolves a minified stack frame by matching the chunk ID baked into
 * the bundle against an uploaded source map, so a map is only useful when it
 * came from the build that produced the deployed bundle. For Fresco that build
 * is the Dockerfile's, in the mirror repository — nothing in this repository
 * builds the bundle the image serves. These assertions keep that upload path
 * wired: without them it can be "simplified" away and every Fresco exception
 * silently goes back to unresolved frames, which is what the PostHog triage
 * that prompted this found (`No sourcemap uploaded for chunk id: …`).
 */
describe('Fresco source-map upload', () => {
  const dockerfile = readFileSync(
    path.join(process.cwd(), 'Dockerfile'),
    'utf8',
  );
  const nextConfig = readFileSync(
    path.join(process.cwd(), 'next.config.ts'),
    'utf8',
  );
  // Source-controlled here and carried to the Fresco repository by
  // scripts/release/mirror-app.mjs, which is where it actually runs.
  const publisher = readFileSync(
    path.join(process.cwd(), '.github/workflows/docker-publish.yml'),
    'utf8',
  );

  it('offers the build the PostHog credentials as BuildKit secrets', () => {
    // Secrets, not ARG/ENV: a build arg is readable in the image's layer
    // history, so the key would ship inside every published image.
    expect(dockerfile).toContain(
      '--mount=type=secret,id=posthog_personal_api_key',
    );
    expect(dockerfile).toContain('--mount=type=secret,id=posthog_project_id');
    expect(dockerfile).not.toMatch(/ARG\s+POSTHOG_/);
    expect(dockerfile).not.toMatch(/ENV\s+POSTHOG_/);
  });

  it('still builds when the credentials are not supplied', () => {
    // Both secrets are optional. The `-s` test is what keeps a build without
    // them byte-identical to one from before they existed, and keeps a
    // half-configured build from uploading against the wrong project.
    expect(dockerfile).toContain(
      '[ -s /run/secrets/posthog_personal_api_key ] && [ -s /run/secrets/posthog_project_id ]',
    );
    // The `else` arm: the plain build has to remain reachable.
    expect(dockerfile).toMatch(/else\s*\\\s*\n\s*pnpm run build;/);
  });

  it('gates upload on the credentials alone, not on CI', () => {
    // The image build sets no CI, so a `CI` test here would refuse to upload
    // maps for the only build whose chunk IDs the deployed image carries.
    expect(nextConfig).toContain(
      'enabled: !!posthogPersonalApiKey && !!posthogProjectId,',
    );
    expect(nextConfig).not.toMatch(/process\.env\.CI[\s\S]{0,80}posthog/i);
  });

  it('deletes the maps from the build output once uploaded', () => {
    // The image must never serve the maps it uploads.
    expect(nextConfig).toContain('deleteAfterUpload: true');
  });

  it('has the publisher workflow pass both secrets to the image build', () => {
    // The last link in the chain: turbo keeps the credentials in the cache key,
    // next.config.ts gates on them, the Dockerfile mounts them, and this is
    // what supplies them. Drop this and the other three change nothing.
    expect(publisher).toContain(
      'posthog_personal_api_key=${{ secrets.POSTHOG_PERSONAL_API_KEY }}',
    );
    expect(publisher).toContain(
      'posthog_project_id=${{ secrets.POSTHOG_PROJECT_ID }}',
    );
    // `secrets:`, not `build-args:` — a build arg would be readable in the
    // published image's layer history.
    expect(publisher).toMatch(/^\s+secrets: \|$/m);
    expect(publisher).not.toMatch(/build-args:[\s\S]{0,120}POSTHOG/);
  });
});
