'use client';

import posthog from 'posthog-js';
import { createContext, useCallback, useContext, useRef } from 'react';
import { updateExportTime } from '~/actions/interviews';
import { deleteZipFromUploadThing } from '~/actions/uploadThing';
import ProgressBar from '~/components/ui/ProgressBar';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import type { ExportEvent } from '~/lib/export/exportEvents';
import type { ExportOptions } from '~/lib/network-exporters/utils/types';
import { ensureError } from '~/utils/ensureError';

type ExportContextValue = {
  startExport: (interviewIds: string[], exportOptions: ExportOptions) => void;
};

const ExportContext = createContext<ExportContextValue | null>(null);

export function useExportProgress() {
  const ctx = useContext(ExportContext);
  if (!ctx) {
    throw new Error(
      'useExportProgress must be used within ExportProgressProvider',
    );
  }
  return ctx;
}

function ExportProgressDescription({
  stage,
  message,
  current,
  total,
}: {
  stage: string;
  message: string;
  current?: number;
  total?: number;
}) {
  const showProgress =
    stage === 'generating' && total !== undefined && total > 0;
  const percent =
    showProgress && current !== undefined
      ? Math.round((current / total) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <p className="text-sm opacity-60">
        {showProgress
          ? `${message} ${String(current)} / ${String(total)}`
          : message}
      </p>
      {showProgress && (
        <ProgressBar
          orientation="horizontal"
          percentProgress={percent}
          nudge={false}
          label="Export progress"
          className="h-1.5"
        />
      )}
    </div>
  );
}

export function ExportProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { add, update, close } = useToast();
  const download = useDownload();
  const abortControllers = useRef(new Map<string, AbortController>());

  const abortExport = useCallback((toastId: string) => {
    const controller = abortControllers.current.get(toastId);
    controller?.abort();
    abortControllers.current.delete(toastId);
  }, []);

  const startExport = useCallback(
    (interviewIds: string[], exportOptions: ExportOptions) => {
      const controller = new AbortController();

      const toastId = add({
        title: 'Exporting interviews',
        description: (
          <ExportProgressDescription
            stage="fetching"
            message="Starting export..."
          />
        ),
        type: 'loading',
        timeout: 0,
        onClose: () => abortExport(toastId),
        onCancel: () => {
          abortExport(toastId);
          close(toastId);
        },
      });

      abortControllers.current.set(toastId, controller);

      void (async () => {
        try {
          const response = await fetch('/api/export-interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewIds, exportOptions }),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(
              `Export request failed with status ${String(response.status)}`,
            );
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const event of events) {
              const dataLine = event
                .split('\n')
                .find((line) => line.startsWith('data: '));
              if (!dataLine) continue;

              let data: ExportEvent;
              try {
                data = JSON.parse(dataLine.slice(6)) as ExportEvent;
              } catch {
                continue;
              }

              if (data.type === 'stage' || data.type === 'progress') {
                update(toastId, {
                  description: (
                    <ExportProgressDescription
                      stage={data.stage}
                      message={
                        data.type === 'stage'
                          ? data.message
                          : 'Generating files...'
                      }
                      current={'current' in data ? data.current : undefined}
                      total={'total' in data ? data.total : undefined}
                    />
                  ),
                });
              } else if (data.type === 'complete') {
                const responseAsBlob = await fetch(data.zipUrl).then((res) => {
                  if (!res.ok)
                    throw new Error('HTTP error ' + String(res.status));
                  return res.blob();
                });

                const url = URL.createObjectURL(responseAsBlob);
                download(url, 'Network Canvas Export.zip');
                URL.revokeObjectURL(url);

                await updateExportTime(interviewIds);

                update(toastId, {
                  title: 'Export complete!',
                  description: 'Your download should start automatically.',
                  type: 'success',
                  timeout: 5000,
                });

                void deleteZipFromUploadThing(data.zipKey).catch(
                  (error: unknown) => {
                    const e = ensureError(error);
                    posthog.captureException(e);

                    add({
                      timeout: Infinity,
                      type: 'destructive',
                      title: 'Could not delete temporary file',
                      description:
                        'We were unable to delete the temporary file containing your exported data, which is stored on your UploadThing account. Although extremely unlikely, it is possible that this file could be accessed by someone else. You can delete the file manually by visiting uploadthing.com and logging in with your GitHub account. Please contact us to report this issue.',
                    });
                  },
                );
              } else if (data.type === 'error') {
                update(toastId, {
                  title: 'Export failed',
                  description: data.message,
                  type: 'destructive',
                  timeout: 0,
                });

                posthog.captureException(new Error(data.message));
              }
            }
          }
        } catch (error) {
          if (controller.signal.aborted) return;

          const e = ensureError(error);
          update(toastId, {
            title: 'Export failed',
            description: e.message,
            type: 'destructive',
            timeout: 0,
          });

          posthog.captureException(e);
        } finally {
          abortControllers.current.delete(toastId);
        }
      })();
    },
    [add, update, close, download, abortExport],
  );

  return <ExportContext value={{ startExport }}>{children}</ExportContext>;
}
