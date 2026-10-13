/*
 * The development object store. It is the self-hosted deployment's own Garage
 * — `docker-compose.prod.yml`'s `garage` service, with `docker-compose.dev.yml`
 * over it publishing the S3 API on the host loopback — rather than a
 * hand-rolled container, so a change to how deployments run Garage is felt
 * here first. Garage creates the key and bucket itself; this adds only the
 * CORS rule a deployment does not need.
 *
 * Each branch gets its own Compose project, and with it its own container and
 * data volume. Stopping this script leaves the stack running for the next
 * `pnpm dev`, as the database container does; take it down with
 *
 *   pnpm exec tsx scripts/dev-s3.ts --down [--volumes]
 */

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

import {
  ListObjectsV2Command,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const HOST_PORT = 9000;
const ENDPOINT = `http://localhost:${HOST_PORT}`;
// Both fixed by the deployment's garage service and its configuration.
const BUCKET = 'assets';
const REGION = 'us-east-1';

// Development credentials in Garage's own key formats, safe to commit. The S3
// pair is what `.env.development` gives the app; checkEnvDevelopment() refuses
// to start a store the app would then fail to authenticate against.
const ACCESS_KEY_ID = 'GK7264a84895442c56d7af713e';
const SECRET_ACCESS_KEY =
  '44ddf3da7d056e03767853bba63c422fd60365b6a613c6d367b2b83ab94e55eb';

// The browser uploads and downloads straight from the store through presigned
// URLs, which is cross-origin from `next dev`. Any origin, so a dev server that
// moved off port 3000 still works; the store is reachable from this machine only.
const CORS_ORIGIN = '*';

const READY_MAX_ATTEMPTS = 30;
const READY_INTERVAL_MS = 1000;

const appRoot = new URL('../', import.meta.url);
const composeFiles = ['docker-compose.prod.yml', 'docker-compose.dev.yml'].map(
  (file) => fileURLToPath(new URL(file, appRoot)),
);

const branch =
  spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  }).stdout.trim() || 'default';

const safeBranch = branch
  .toLowerCase()
  .replaceAll('/', '-')
  .replace(/[^a-z0-9-]/g, '');

const project = `fresco-dev-${safeBranch}`;

/**
 * Everything the deployment file interpolates. Compose validates the whole
 * model before selecting services, so the variables of the services this
 * never starts are set too, with values that show they were never used.
 */
const composeEnvironment: Record<string, string> = {
  FRESCO_DOMAIN: 'fresco.invalid',
  ACME_EMAIL: 'nobody@fresco.invalid',

  GARAGE_ACCESS_KEY_ID: ACCESS_KEY_ID,
  GARAGE_SECRET_ACCESS_KEY: SECRET_ACCESS_KEY,
};

const composeFlags = [
  'compose',
  '-p',
  project,
  ...composeFiles.flatMap((file) => ['-f', file]),
];

const childEnvironment = { ...process.env, ...composeEnvironment };

function compose(args: string[]): { status: number; stderr: string } {
  const result = spawnSync('docker', [...composeFlags, ...args], {
    encoding: 'utf8',
    env: childEnvironment,
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  const stderr = result.stderr ?? '';
  // Compose reports progress on stderr, so it is printed as well as kept.
  if (stderr) process.stderr.write(stderr);
  return { status: result.status ?? -1, stderr };
}

function checkEnvDevelopment(): void {
  const expected: Record<string, string> = {
    S3_ENDPOINT: ENDPOINT,
    S3_PUBLIC_URL: ENDPOINT,
    S3_BUCKET: BUCKET,
    S3_REGION: REGION,
    S3_ACCESS_KEY_ID: ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: SECRET_ACCESS_KEY,
  };
  const actual = parseEnv(
    readFileSync(new URL('.env.development', appRoot), 'utf8'),
  );
  const drifted = Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key, value]) => `  ${key}=${value}`);
  if (drifted.length > 0) {
    throw new Error(
      `.env.development no longer matches the store scripts/dev-s3.ts starts. Expected:\n${drifted.join('\n')}`,
    );
  }
}

/**
 * The MinIO containers this replaced were long-lived, so one left running
 * from an earlier session still holds port 9000. Stopped rather than removed:
 * its volume and container are not this script's to delete.
 */
function stopSupersededContainers(): string[] {
  const listed = spawnSync(
    'docker',
    [
      'ps',
      '--filter',
      'name=^/fresco-dev-minio-',
      '--format',
      '{{.Names}}\t{{.Label "com.docker.compose.project"}}',
    ],
    { encoding: 'utf8' },
  );
  const names = (listed.stdout ?? '')
    .split('\n')
    .map((line) => line.split('\t'))
    // A branch named `minio-*` has a Compose project of this script's own.
    .filter(([name, composeProject]) => name && !composeProject)
    .map(([name]) => name ?? '');
  return names.filter(
    (name) => spawnSync('docker', ['stop', name]).status === 0,
  );
}

function startGarage(): void {
  console.log(
    `Starting Garage on port ${HOST_PORT} [project: ${project}, branch: ${branch}]...`,
  );
  if (compose(['up', '-d', '--wait', 'garage']).status === 0) return;

  const stopped = stopSupersededContainers();
  if (stopped.length === 0) {
    throw new Error(
      `docker compose up failed. If port ${HOST_PORT} is taken, another branch's development store may hold it: docker ps --filter publish=${HOST_PORT}`,
    );
  }
  console.log(
    `Stopped ${stopped.join(', ')}, MinIO containers from before this script ran Garage, which still held port ${HOST_PORT}. Retrying.`,
  );
  if (compose(['up', '-d', '--wait', 'garage']).status !== 0) {
    throw new Error('docker compose up failed');
  }
}

async function waitForReady(client: S3Client): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= READY_MAX_ATTEMPTS; attempt++) {
    try {
      await client.send(
        new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 0 }),
      );
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, READY_INTERVAL_MS));
    }
  }
  throw new Error(
    `Garage did not serve bucket '${BUCKET}' after ${READY_MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}

/** Replaces the bucket's CORS rule, so it is idempotent. */
async function allowBrowserOrigin(client: S3Client): Promise<void> {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [CORS_ORIGIN],
            AllowedMethods: ['GET', 'PUT', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}

function printBanner(): void {
  console.log(`Garage ready — bucket '${BUCKET}' available`);
  console.log(`  Endpoint:          ${ENDPOINT}`);
  console.log(`  Public URL:        ${ENDPOINT}`);
  console.log(`  Bucket:            ${BUCKET}`);
  console.log(`  Region:            ${REGION}`);
  console.log(`  Access Key ID:     ${ACCESS_KEY_ID}`);
  console.log(`  Secret Access Key: ${SECRET_ACCESS_KEY}`);
}

function followLogs(): void {
  const child = spawn('docker', [...composeFlags, 'logs', '-f', 'garage'], {
    stdio: 'inherit',
    env: childEnvironment,
  });

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (!child.killed) child.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP', shutdown);

  child.on('exit', (code) => {
    if (shuttingDown) return;
    process.exit(code ?? 0);
  });
}

function down(removeVolumes: boolean): void {
  const result = compose(['down', ...(removeVolumes ? ['--volumes'] : [])]);
  if (result.status !== 0) throw new Error('docker compose down failed');
  console.log(
    removeVolumes
      ? `Stopped ${project} and removed its stored objects.`
      : `Stopped ${project}. Its stored objects are kept; add --volumes to delete them.`,
  );
}

async function main(argv: readonly string[]): Promise<void> {
  if (argv.includes('--down')) {
    down(argv.includes('--volumes') || argv.includes('-v'));
    return;
  }

  checkEnvDevelopment();
  startGarage();
  console.log('Waiting for Garage to serve the bucket...');
  const client = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
  try {
    await waitForReady(client);
    await allowBrowserOrigin(client);
  } finally {
    client.destroy();
  }
  printBanner();
  followLogs();
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
