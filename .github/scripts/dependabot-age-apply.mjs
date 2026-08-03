/* eslint-disable no-console */
// Stage 2 (PRIVILEGED) of the Dependabot age-gate fast-track.
//
// Triggered via `workflow_run` after the unprivileged compute stage succeeds,
// so this script always runs from the DEFAULT branch — it is trusted code,
// and it never executes anything authored in the PR. It reads the exemption
// request the compute stage produced (plain data), STRICTLY validates every
// entry, applies it to pnpm-workspace.yaml on the Dependabot branch, and
// pushes.
//
// The Dependabot branch is only ever checked out as *data* (its
// pnpm-workspace.yaml is edited as text); no code from it is imported or run.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const REQUEST_DIR = 'age-exempt';
const WORKSPACE = 'pnpm-workspace.yaml';

if (
  !existsSync(`${REQUEST_DIR}/additions.txt`) ||
  !existsSync(`${REQUEST_DIR}/pr.json`)
) {
  console.log('No exemption request artifact — nothing to do.');
  process.exit(0);
}

const requested = readFileSync(`${REQUEST_DIR}/additions.txt`, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const { number, headRef } = JSON.parse(
  readFileSync(`${REQUEST_DIR}/pr.json`, 'utf8'),
);

// Strict allow-list matching valid npm `name@version` entries only, e.g.
// `lodash@4.17.21` or `@babel/core@7.24.0`: an optional `@scope/` prefix,
// an npm-legal package name, `@`, then a version starting with an
// alphanumeric character. Anything with whitespace, quotes, or shell
// metacharacters is rejected outright — the data came from an unprivileged
// stage and is treated as untrusted.
const ENTRY =
  /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*@[A-Za-z0-9][A-Za-z0-9-._+]*$/;
const invalid = requested.filter((entry) => !ENTRY.test(entry));
if (invalid.length > 0) {
  console.error(
    `Refusing to apply — malformed exemption entries: ${invalid.join(', ')}`,
  );
  process.exit(1);
}
if (!Number.isInteger(number) || !/^[\w./-]+$/.test(headRef)) {
  console.error('Refusing to apply — malformed PR metadata.');
  process.exit(1);
}
if (requested.length === 0) {
  console.log('No additions requested — nothing to do.');
  process.exit(0);
}

// Bring in the Dependabot branch as data. This script is already loaded from
// the default branch, so switching the working tree does not change what
// runs.
execFileSync('git', ['fetch', '--no-tags', 'origin', headRef], {
  stdio: 'inherit',
});
execFileSync('git', ['switch', '-C', 'dependabot-age-apply', 'FETCH_HEAD'], {
  stdio: 'inherit',
});

const lines = readFileSync(WORKSPACE, 'utf8').split('\n');
const keyIdx = lines.findIndex((l) => /^minimumReleaseAgeExclude\s*:/.test(l));
if (keyIdx === -1) {
  console.error(
    'minimumReleaseAgeExclude key not found on the Dependabot branch.',
  );
  process.exit(1);
}

const existing = [];
const inline = lines[keyIdx].match(/:\s*\[(.*)\]\s*$/);
let removeCount = 1;
if (inline) {
  for (const part of inline[1].split(',')) {
    const value = part.trim().replace(/^['"]|['"]$/g, '');
    if (value) existing.push(value);
  }
} else {
  let i = keyIdx + 1;
  while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
    existing.push(
      lines[i]
        .replace(/^\s+-\s+/, '')
        .trim()
        .replace(/^['"]|['"]$/g, ''),
    );
    i++;
  }
  removeCount = i - keyIdx;
}

const existingSet = new Set(existing);
const fresh = requested.filter((entry) => !existingSet.has(entry));
if (fresh.length === 0) {
  console.log(
    'All requested exemptions are already present — nothing to push.',
  );
  process.exit(0);
}

const merged = [...existing, ...fresh];
const block = ['minimumReleaseAgeExclude:', ...merged.map((v) => `  - '${v}'`)];
lines.splice(keyIdx, removeCount, ...block);
writeFileSync(WORKSPACE, lines.join('\n'));

execFileSync('git', ['config', 'user.name', 'github-actions[bot]'], {
  stdio: 'inherit',
});
execFileSync(
  'git',
  [
    'config',
    'user.email',
    '41898282+github-actions[bot]@users.noreply.github.com',
  ],
  { stdio: 'inherit' },
);
execFileSync('git', ['add', WORKSPACE], { stdio: 'inherit' });
execFileSync(
  'git',
  [
    'commit',
    '-m',
    'chore(deps): exempt security bump from pnpm age gate',
    '-m',
    `Added ${fresh.join(', ')} to minimumReleaseAgeExclude so the reviewed Dependabot security update passes CI; each pin is inert once it ages out.`,
  ],
  { stdio: 'inherit' },
);
execFileSync('git', ['push', 'origin', `HEAD:${headRef}`], {
  stdio: 'inherit',
});
console.log(`Pushed age-gate exemption to PR #${number}: ${fresh.join(', ')}`);
