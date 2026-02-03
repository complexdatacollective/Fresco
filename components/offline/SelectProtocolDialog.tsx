'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Play, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import ModalPopup from '~/components/Modal/ModalPopup';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import useNetworkStatus from '~/hooks/useNetworkStatus';
import { offlineDb } from '~/lib/offline/db';
import { createOfflineInterview } from '~/lib/offline/offlineInterviewManager';
import { ensureError } from '~/utils/ensureError';
import { cx } from '~/utils/cva';

type SelectProtocolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantIdentifier: string;
  participantLabel?: string | null;
};

export function SelectProtocolDialog({
  open,
  onOpenChange,
  participantIdentifier,
  participantLabel,
}: SelectProtocolDialogProps) {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cachedProtocols = useLiveQuery(
    async () => {
      return offlineDb.protocols.toArray();
    },
    [],
    [],
  );

  useEffect(() => {
    if (open && cachedProtocols?.length === 1) {
      setSelectedProtocolId(cachedProtocols[0]?.id ?? null);
    }
  }, [open, cachedProtocols]);

  useEffect(() => {
    if (!open) {
      setSelectedProtocolId(null);
      setError(null);
    }
  }, [open]);

  const handleStartInterview = async () => {
    if (!selectedProtocolId) {
      setError('Please select a protocol');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createOfflineInterview(
        selectedProtocolId,
        participantIdentifier,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.push(`/interview/${result.interviewId}`);
    } catch (e) {
      const err = ensureError(e);
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const hasProtocols = cachedProtocols && cachedProtocols.length > 0;
  const displayName = participantLabel ?? participantIdentifier;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPopup className="w-full max-w-md">
        <Surface spacing="lg">
          <div className="flex items-center gap-3">
            {!isOnline && <WifiOff className="h-5 w-5 opacity-70" />}
            <Heading level="h2" margin="none">
              Start Interview
            </Heading>
          </div>

          <Paragraph>
            Starting interview for participant: <strong>{displayName}</strong>
          </Paragraph>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!hasProtocols ? (
            <div className="space-y-4">
              <Alert variant="info">
                <AlertDescription>
                  No protocols are available offline. Please download a protocol
                  for offline use first from the Protocols page.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Paragraph className="font-medium">Select Protocol</Paragraph>
                <div className="space-y-2">
                  {cachedProtocols?.map((protocol) => (
                    <button
                      key={protocol.id}
                      type="button"
                      onClick={() => setSelectedProtocolId(protocol.id)}
                      className={cx(
                        'w-full rounded border p-3 text-left transition-colors',
                        selectedProtocolId === protocol.id
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-surface-1',
                      )}
                    >
                      <Paragraph className="font-medium">
                        {protocol.name}
                      </Paragraph>
                      <Paragraph className="text-sm opacity-70">
                        Cached{' '}
                        {new Date(protocol.cachedAt).toLocaleDateString()}
                      </Paragraph>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartInterview}
                  disabled={!selectedProtocolId || isCreating}
                  icon={<Play className="h-4 w-4" />}
                >
                  {isCreating ? 'Starting...' : 'Start Interview'}
                </Button>
              </div>
            </div>
          )}
        </Surface>
      </ModalPopup>
    </Modal>
  );
}
