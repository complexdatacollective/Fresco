'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { syncManager, type BatchSyncResult } from '~/lib/offline/syncManager';
import { ensureError } from '~/utils/ensureError';

type SyncErrorSummaryProps = {
  result: BatchSyncResult;
  onRetry?: () => void;
};

export function SyncErrorSummary({ result, onRetry }: SyncErrorSummaryProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<BatchSyncResult | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const failedIds = result.failed.map((f) => f.interviewId);
      const newResult = await syncManager.retryFailedSyncs(failedIds);
      setRetryResult(newResult);
      onRetry?.();
    } catch (error) {
      const err = ensureError(error);
      // eslint-disable-next-line no-console
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  const displayResult = retryResult ?? result;

  if (displayResult.failed.length === 0) {
    return (
      <Alert variant="success">
        <AlertTitle>Sync Complete</AlertTitle>
        <AlertDescription>
          All {displayResult.succeeded.length} interviews synced successfully.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert
        variant={displayResult.succeeded.length > 0 ? 'warning' : 'destructive'}
      >
        <AlertTitle>Sync Partially Complete</AlertTitle>
        <AlertDescription>
          {displayResult.succeeded.length > 0 && (
            <Paragraph className="mb-2">
              {displayResult.succeeded.length} of {displayResult.total}{' '}
              interviews synced successfully.
            </Paragraph>
          )}
          <Paragraph>
            {displayResult.failed.length} interview
            {displayResult.failed.length !== 1 ? 's' : ''} failed to sync:
          </Paragraph>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {displayResult.failed.map((failed) => (
              <li key={failed.interviewId} className="text-sm">
                {failed.interviewId}: {failed.error ?? 'Unknown error'}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {!retryResult && (
        <Button
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRetry}
          disabled={retrying}
          data-testid="retry-failed-syncs"
        >
          {retrying ? 'Retrying...' : 'Retry Failed Items'}
        </Button>
      )}
    </div>
  );
}
