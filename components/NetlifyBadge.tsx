'use client';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';

const messages = defineMessages({
  deploysByNetlify: {
    id: 'fresco.NetlifyBadge.deploysByNetlify',
    defaultMessage: 'Deploys by Netlify',
    description: 'Researcher-facing NetlifyBadge: Deploys by Netlify',
  },
});

/**
 * Rendered only by sandbox deployments. The `SANDBOX_MODE` check belongs to the
 * server components that render this one: the variable is not exposed to the
 * browser, so reading it here returned `undefined` on the client and the badge
 * hydrated as nothing, failing hydration for the whole page.
 */
export default function NetlifyBadge() {
  const intl = useAppIntl();

  return (
    <footer className="flex justify-center py-4">
      <a
        href="https://www.netlify.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
          alt={intl.formatMessage(messages.deploysByNetlify)}
        />
      </a>
    </footer>
  );
}
