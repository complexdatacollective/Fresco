/* eslint-disable no-console */
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import {
  CreateBucketCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const IMAGE = 'minio/minio:latest';
const HOST_PORT = 9000;
const CONTAINER_PORT = 9000;
const BUCKET = 'fresco-dev';
const REGION = 'us-east-1';
const ACCESS_KEY_ID = 'minioadmin';
const SECRET_ACCESS_KEY = 'minioadmin';
const READY_MAX_ATTEMPTS = 30;
const READY_INTERVAL_MS = 1000;

const branch =
  spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  }).stdout.trim() || 'default';

const safeBranch = branch
  .toLowerCase()
  .replaceAll('/', '-')
  .replace(/[^a-z0-9-]/g, '');

const containerName = `fresco-dev-minio-${safeBranch}`;
const volumeName = `fresco-dev-minio-${safeBranch}`;

function docker(args: string[]): {
  status: number;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function containerExists(): boolean {
  return docker(['container', 'inspect', containerName]).status === 0;
}

function containerIsRunning(): boolean {
  const result = docker(['inspect', '-f', '{{.State.Running}}', containerName]);
  return result.status === 0 && result.stdout.trim() === 'true';
}

function ensureVolume(): void {
  const inspect = docker(['volume', 'inspect', volumeName]);
  if (inspect.status === 0) return;
  const create = docker(['volume', 'create', volumeName]);
  if (create.status !== 0) {
    throw new Error(`docker volume create failed: ${create.stderr}`);
  }
}

function removeContainer(): void {
  const result = docker(['rm', '-f', containerName]);
  if (result.status === 0) return;
  // Tolerate "already gone" races with parallel invocations.
  if (result.stderr.toLowerCase().includes('no such container')) return;
  throw new Error(`docker rm -f failed: ${result.stderr}`);
}

function startContainer(): void {
  console.log(`Starting MinIO on port ${HOST_PORT} [branch: ${branch}]...`);
  const result = docker([
    'run',
    '-d',
    '--rm',
    '--name',
    containerName,
    '-p',
    `${HOST_PORT}:${CONTAINER_PORT}`,
    '-v',
    `${volumeName}:/data`,
    '-e',
    `MINIO_ROOT_USER=${ACCESS_KEY_ID}`,
    '-e',
    `MINIO_ROOT_PASSWORD=${SECRET_ACCESS_KEY}`,
    '-e',
    'MINIO_API_CORS_ALLOW_ORIGIN=*',
    IMAGE,
    'server',
    '/data',
  ]);
  if (result.status !== 0) {
    throw new Error(`docker run failed: ${result.stderr}`);
  }
}

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: `http://localhost:${HOST_PORT}`,
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

async function waitForReady(client: S3Client): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= READY_MAX_ATTEMPTS; attempt++) {
    try {
      await client.send(new ListBucketsCommand({}));
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, READY_INTERVAL_MS));
    }
  }
  throw new Error(
    `MinIO did not become ready after ${READY_MAX_ATTEMPTS} attempts: ${String(lastError)}`,
  );
}

async function ensureBucket(client: S3Client): Promise<void> {
  try {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`Created bucket '${BUCKET}'`);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'BucketAlreadyOwnedByYou' ||
        error.name === 'BucketAlreadyExists')
    ) {
      console.log(`Bucket '${BUCKET}' already exists`);
      return;
    }
    throw error;
  }
}

function printBanner(): void {
  console.log(`MinIO ready — bucket '${BUCKET}' available`);
  console.log(`  Endpoint:          http://localhost:${HOST_PORT}`);
  console.log(`  Public URL:        http://localhost:${HOST_PORT}`);
  console.log(`  Bucket:            ${BUCKET}`);
  console.log(`  Region:            ${REGION}`);
  console.log(`  Access Key ID:     ${ACCESS_KEY_ID}`);
  console.log(`  Secret Access Key: ${SECRET_ACCESS_KEY}`);
}

function followLogs(): void {
  const child = spawn('docker', ['logs', '-f', containerName], {
    stdio: 'inherit',
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

async function main(): Promise<void> {
  const alreadyRunning = containerExists() && containerIsRunning();

  if (containerExists() && !alreadyRunning) {
    removeContainer();
  }

  if (!alreadyRunning) {
    ensureVolume();
    startContainer();
  } else {
    console.log(
      `MinIO already running (${containerName}) on port ${HOST_PORT}`,
    );
  }

  const s3 = createS3Client();
  console.log('Waiting for MinIO to become ready...');
  await waitForReady(s3);
  await ensureBucket(s3);

  if (!alreadyRunning) printBanner();
  followLogs();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
