import { PostHog } from 'posthog-node';
import 'server-only';
import { POSTHOG_HOST, POSTHOG_KEY } from '~/fresco.config';

const posthogClient = () => {
  return new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
};

// Ensure only one instance is created
const posthog = posthogClient();

async function shutdownPosthog() {
  await posthog.shutdown();
}

process.on('SIGTERM', shutdownPosthog);
process.on('SIGINT', shutdownPosthog);

export default posthog;
