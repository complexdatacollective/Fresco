'use client';

import {
  Database,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Modal from '~/components/Modal/Modal';
import ModalPopup from '~/components/Modal/ModalPopup';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import {
  deleteProtocolCache,
  getStorageBreakdown,
  offlineDb,
  type StorageBreakdown,
} from '~/lib/offline/db';
import { ensureError } from '~/utils/ensureError';
import { cx } from '~/utils/cva';

type CachedProtocolInfo = {
  id: string;
  name: string;
  cachedAt: number;
  assetCount: number;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = sizes[i];
  if (!sizeIndex) return '0 B';
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizeIndex}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type ManageStorageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ManageStorageDialog({
  open,
  onOpenChange,
}: ManageStorageDialogProps) {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cachedProtocols = useLiveQuery(
    async (): Promise<CachedProtocolInfo[]> => {
      const protocols = await offlineDb.protocols.toArray();
      const protocolsWithCounts = await Promise.all(
        protocols.map(async (p) => {
          const assetCount = await offlineDb.assets
            .where('protocolId')
            .equals(p.id)
            .count();
          return {
            id: p.id,
            name: p.name,
            cachedAt: p.cachedAt,
            assetCount,
          };
        }),
      );
      return protocolsWithCounts;
    },
    [],
    [],
  );

  useEffect(() => {
    if (open) {
      void loadBreakdown();
    }
  }, [open]);

  const loadBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStorageBreakdown();
      setBreakdown(data);
    } catch (e) {
      const err = ensureError(e);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    setDeletingProtocolId(protocolId);
    setError(null);

    try {
      await deleteProtocolCache(protocolId);
      await loadBreakdown();
      setConfirmDeleteId(null);
    } catch (e) {
      const err = ensureError(e);
      setError(`Failed to delete protocol: ${err.message}`);
    } finally {
      setDeletingProtocolId(null);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalPopup className="max-h-[90vh] w-full max-w-2xl overflow-hidden">
        <Surface spacing="lg" className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <Heading level="h2">Manage Storage</Heading>
            <Button
              variant="text"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Paragraph>Loading storage information...</Paragraph>
            </div>
          ) : breakdown ? (
            <div className="flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <Heading level="h3">Storage Overview</Heading>

                <div className="grid gap-3">
                  <StorageItem
                    icon={<Database className="h-4 w-4" />}
                    label="Protocols"
                    count={breakdown.protocols.count}
                    size={breakdown.protocols.estimatedSize}
                  />
                  <StorageItem
                    icon={<ImageIcon className="h-4 w-4" />}
                    label="Assets"
                    count={breakdown.assets.count}
                    size={breakdown.assets.estimatedSize}
                  />
                  <StorageItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Interviews"
                    count={breakdown.interviews.count}
                    size={breakdown.interviews.estimatedSize}
                  />
                  <div className="border-t pt-3">
                    <StorageItem
                      icon={<HardDrive className="h-4 w-4" />}
                      label="Total"
                      size={breakdown.total}
                      emphasized
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Heading level="h3">Cached Protocols</Heading>

                {cachedProtocols && cachedProtocols.length > 0 ? (
                  <div className="space-y-2">
                    {cachedProtocols.map((protocol) => (
                      <div
                        key={protocol.id}
                        className="flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex-1">
                          <Paragraph className="font-semibold">
                            {protocol.name}
                          </Paragraph>
                          <Paragraph className="text-sm opacity-70">
                            Cached {formatDate(protocol.cachedAt)} •{' '}
                            {protocol.assetCount} assets
                          </Paragraph>
                        </div>

                        {confirmDeleteId === protocol.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingProtocolId === protocol.id}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              color="destructive"
                              onClick={() => handleDeleteProtocol(protocol.id)}
                              disabled={deletingProtocolId === protocol.id}
                            >
                              {deletingProtocolId === protocol.id
                                ? 'Deleting...'
                                : 'Confirm'}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            color="destructive"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => setConfirmDeleteId(protocol.id)}
                            disabled={deletingProtocolId !== null}
                            data-testid={`delete-protocol-${protocol.id}`}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No cached protocols. Download a protocol for offline use
                      to see it here.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : null}
        </Surface>
      </ModalPopup>
    </Modal>
  );
}

type StorageItemProps = {
  icon: React.ReactNode;
  label: string;
  count?: number;
  size: number;
  emphasized?: boolean;
};

function StorageItem({
  icon,
  label,
  count,
  size,
  emphasized,
}: StorageItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="opacity-70">{icon}</div>
        <Paragraph className={cx(emphasized && 'font-semibold', 'text-sm')}>
          {label}
          {count !== undefined && ` (${count})`}
        </Paragraph>
      </div>
      <Paragraph className={cx(emphasized && 'font-semibold', 'text-sm')}>
        {formatBytes(size)}
      </Paragraph>
    </div>
  );
}
