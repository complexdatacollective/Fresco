'use client';

import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { offlineDb, type CachedProtocol } from '~/lib/offline/db';
import { cx } from '~/utils/cva';

type OfflineUnavailableScreenProps = {
  protocolId?: string;
  protocolName?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const OfflineUnavailableScreen = ({
  protocolId: _protocolId,
  protocolName,
  className,
  ...props
}: OfflineUnavailableScreenProps) => {
  const [cachedProtocols, setCachedProtocols] = useState<CachedProtocol[]>([]);

  useEffect(() => {
    const loadCachedProtocols = async () => {
      try {
        const protocols = await offlineDb.protocols.toArray();
        setCachedProtocols(protocols);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load cached protocols:', error);
      }
    };

    loadCachedProtocols().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load cached protocols:', error);
    });
  }, []);

  return (
    <div
      className={cx(
        'flex min-h-screen items-center justify-center p-4',
        className,
      )}
      {...props}
    >
      <Surface className="w-full max-w-lg" level={1} spacing="lg">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-surface-2 rounded-full p-4">
              <WifiOff className="h-8 w-8" />
            </div>
          </div>

          <div className="text-center">
            <Heading level="h3" margin="none">
              Protocol Not Available Offline
            </Heading>
          </div>

          <div className="space-y-4">
            <Paragraph>
              You are currently offline and{' '}
              {protocolName ? (
                <>
                  the protocol <strong>{protocolName}</strong>
                </>
              ) : (
                'this protocol'
              )}{' '}
              has not been downloaded for offline use.
            </Paragraph>
            <Paragraph>
              To use this protocol offline, you need to mark it for offline use
              when connected to the internet.
            </Paragraph>
          </div>

          {cachedProtocols.length > 0 && (
            <div className="space-y-3">
              <Heading level="h4" margin="none">
                Available Offline Protocols
              </Heading>
              <ul className="space-y-2">
                {cachedProtocols.map((protocol) => (
                  <li key={protocol.id}>{protocol.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Offline Settings</Link>
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
};
