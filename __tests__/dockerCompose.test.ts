import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const composeFiles = [
  'docker-compose.prod.yml',
  'docker-compose.external-s3.yml',
  'docker-compose.uploadthing.yml',
];

describe.each(composeFiles)('%s', (composeFile) => {
  const compose = readFileSync(path.join(process.cwd(), composeFile), 'utf8');

  it('enforces HSTS across the HTTPS entrypoint', () => {
    expect(compose).toContain(
      "      - '--entrypoints.websecure.http.middlewares=fresco-hsts@docker'",
    );
    expect(compose).toContain(
      "      - 'traefik.http.middlewares.fresco-hsts.headers.stsseconds=63072000'",
    );
    expect(compose).toContain(
      "      - 'traefik.http.middlewares.fresco-hsts.headers.stsincludesubdomains=true'",
    );
  });
});
