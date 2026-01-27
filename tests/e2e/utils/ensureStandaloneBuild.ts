import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileAsync } from './execFileAsync';
import { logger } from './logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../../..');

export async function ensureStandaloneBuild() {
  logger.build.building();

  try {
    // Run: pnpm build with test-specific env vars
    // DISABLE_NEXT_CACHE enables the no-op cache handler for test isolation
    await execFileAsync('pnpm', ['build'], {
      cwd: projectRoot,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        SKIP_ENV_VALIDATION: 'true',
        DISABLE_NEXT_CACHE: 'true',
      },
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for build output
    });
    logger.build.success();
  } catch (error) {
    logger.build.error(error);
    throw error;
  }
}
