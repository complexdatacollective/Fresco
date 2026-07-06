// Stage 1 (UNPRIVILEGED) of the Dependabot age-gate fast-track.
//
// pnpm's minimumReleaseAge gate (24h — see pnpm-workspace.yaml) refuses
// dependency versions younger than 24h and re-verifies this on every
// `pnpm install --frozen-lockfile`. Dependabot *security* updates bypass the
// Dependabot `cooldown`, so they open against a freshly published fix that
// the gate then rejects — turning the PR red.
//
// This script runs in the `pull_request` context (read-only token, no
// secrets), so it is safe to execute against the PR-authored lockfile. It:
//   1. attempts a frozen install; if it already passes, does nothing;
//   2. if it fails *specifically* on the age gate, finds the exact
//      name@version entries this PR introduced into pnpm-lock.yaml, applies
//      them to a LOCAL copy of pnpm-workspace.yaml, and re-runs the install
//      to PROVE they resolve the failure;
//   3. writes the proven entries + PR metadata to age-exempt/ for the
//      privileged apply stage to push. It never writes to the repo itself.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// pnpm output and lockfile diffs can be large; give the captured commands
// plenty of headroom so a noisy run can't throw past our detection logic.
const MAX_BUFFER = 64 * 1024 * 1024;
const WORKSPACE = 'pnpm-workspace.yaml';

const baseSha = process.env.BASE_SHA;
const prNumber = process.env.PR_NUMBER;
const headRef = process.env.HEAD_REF;
const missing = Object.entries({
  BASE_SHA: baseSha,
  PR_NUMBER: prNumber,
  HEAD_REF: headRef,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}`,
  );
  process.exit(1);
}
if (!/^[0-9a-f]{7,40}$/.test(baseSha)) {
  console.error(`BASE_SHA is not a commit SHA: ${baseSha}`);
  process.exit(1);
}

/** Attempt a frozen, script-free install and capture its combined output. */
const install = () => {
  try {
    execFileSync('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], {
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
    });
    return { ok: true, output: '' };
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ''}\n${error.stderr ?? ''}`,
    };
  }
};

const first = install();
if (first.ok) {
  console.log('Frozen install passed the age gate — no exemption needed.');
  process.exit(0);
}
if (!/MINIMUM_RELEASE_AGE/.test(first.output)) {
  console.error(
    'Install failed for a reason other than the age gate — leaving it for CI to report.',
  );
  console.error(first.output);
  process.exit(1);
}

// The exact package versions this PR introduced into the lockfile. Matches
// pnpm-lock v9 `packages:` / `snapshots:` keys (optional quote, optional
// @scope/, name, @<version>, optional (peer…) suffix, trailing colon).
const diff = execFileSync(
  'git',
  ['diff', baseSha, 'HEAD', '--', 'pnpm-lock.yaml'],
  {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
  },
);
const introduced = [];
const seen = new Set();
for (const line of diff.split('\n')) {
  if (line[0] !== '+') continue;
  const match = line.match(
    /^\+\s+'?((?:@[^/@'\s]+\/)?[^@'\s()]+@\d[^'():\s]*)'?(?:\([^)]*\))?'?\s*:/,
  );
  if (match && !seen.has(match[1])) {
    seen.add(match[1]);
    introduced.push(match[1]);
  }
}
if (introduced.length === 0) {
  console.error(
    'Age-gate violation, but no changed lockfile entries were found to exempt.',
  );
  process.exit(1);
}

// Apply to a LOCAL copy and re-verify, so we only hand the apply stage
// exemptions we have proven resolve the failure.
const lines = readFileSync(WORKSPACE, 'utf8').split('\n');
const keyIdx = lines.findIndex((l) => /^minimumReleaseAgeExclude\s*:/.test(l));
if (keyIdx === -1) {
  console.error(
    'minimumReleaseAgeExclude key not found in pnpm-workspace.yaml.',
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
const additions = introduced.filter((value) => !existingSet.has(value));
if (additions.length === 0) {
  console.error(
    'Age-gate violation, but the offending versions are already exempted — aborting.',
  );
  process.exit(1);
}

const merged = [...existing, ...additions];
const block = ['minimumReleaseAgeExclude:', ...merged.map((v) => `  - '${v}'`)];
lines.splice(keyIdx, removeCount, ...block);
writeFileSync(WORKSPACE, lines.join('\n'));

const second = install();
if (!second.ok) {
  console.error('Install still fails after adding exemptions:');
  console.error(second.output);
  process.exit(1);
}

mkdirSync('age-exempt', { recursive: true });
writeFileSync('age-exempt/additions.txt', `${additions.join('\n')}\n`);
writeFileSync(
  'age-exempt/pr.json',
  `${JSON.stringify({ number: Number(prNumber), headRef })}\n`,
);
console.log(
  `Prepared age-gate exemption for PR #${prNumber}: ${additions.join(', ')}`,
);
