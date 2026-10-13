/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Choose how a Netlify deploy preview or branch deploy builds.
 *
 * A preview may migrate a database only when that database is its own: the
 * Neon branch `scripts/ci/fresco-preview-database.mjs` created for it, which
 * it names in PREVIEW_DATABASE_BRANCH alongside the branch-scoped connection
 * strings. Anything else — a deployment whose previews read the production
 * database, or a value left over from another branch — builds without
 * touching the database, because migrating it would migrate production.
 */
export function previewBuildScript({
  gitBranch,
  previewDatabaseBranch,
}: {
  gitBranch: string | undefined;
  previewDatabaseBranch: string | undefined;
}) {
  return gitBranch && previewDatabaseBranch === `preview/${gitBranch}`
    ? 'build:platform'
    : 'build:branch-preview';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  // Netlify names the branch being built in HEAD (and BRANCH).
  // eslint-disable-next-line no-process-env
  const { HEAD, BRANCH, PREVIEW_DATABASE_BRANCH } = process.env;
  const script = previewBuildScript({
    gitBranch: HEAD ?? BRANCH,
    previewDatabaseBranch: PREVIEW_DATABASE_BRANCH,
  });
  console.log(
    script === 'build:platform'
      ? `Building against this preview's own database (${PREVIEW_DATABASE_BRANCH}), migrating it.`
      : 'This preview has no database of its own; building without migrating.',
  );
  const result = spawnSync('pnpm', [script], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
