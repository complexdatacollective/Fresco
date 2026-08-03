'use client';

import posthog from 'posthog-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useToast } from '@codaco/fresco-ui/Toast';
import type { ExportOptions } from '@codaco/network-exporters/options';
import { commitInterviewExport } from '~/actions/interviews';
import ExportToastContent from '~/components/ExportProgress/ExportToastContent';
import { useDownload } from '~/hooks/useDownload';
import { runBatchedExport } from '~/lib/export/runBatchedExport';
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

export function ExportProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { add, update, close } = useToast();
  const download = useDownload();

  // Tracks whether an export is in flight, so the beforeunload warning can
  // reflect it without re-registering the listener per render.
  const exportingRef = useRef(false);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!exportingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const startExport = useCallback(
    (interviewIds: string[], exportOptions: ExportOptions) => {
      const controller = new AbortController();
      exportingRef.current = true;

      const toastId = add({
        title: 'Exporting interviews',
        description: (
          <ExportToastContent
            stage="fetching"
            progress={0}
            onCancel={() => controller.abort()}
          />
        ),
        timeout: 0,
      });

      void (async () => {
        try {
          const { blob, exportedIds, failedIds } = await runBatchedExport(
            interviewIds,
            exportOptions,
            controller.signal,
            (completed, total) => {
              update(toastId, {
                description: (
                  <ExportToastContent
                    stage="generating"
                    current={completed}
                    total={total}
                    progress={total > 0 ? (completed / total) * 100 : 0}
                    onCancel={() => controller.abort()}
                  />
                ),
              });
            },
          );

          const date = new Date().toISOString().slice(0, 10);
          const objectUrl = URL.createObjectURL(blob);
          download(objectUrl, `fresco-export-${date}.zip`);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

          // Mark exported only after the user has the complete file.
          const commit = await commitInterviewExport(exportedIds);

          close(toastId);
          if (commit.error) {
            add({
              title: 'Export downloaded',
              description:
                'Your export downloaded, but its status could not be updated. Refresh to see the latest.',
              timeout: 8000,
            });
          } else {
            add({
              title: 'Export complete',
              description:
                failedIds.length > 0
                  ? `Your export has downloaded. ${String(failedIds.length)} interview(s) could not be exported.`
                  : 'Your export has downloaded.',
              variant: 'success',
              timeout: 8000,
            });
          }
        } catch (error) {
          if (controller.signal.aborted) {
            close(toastId);
            add({
              title: 'Export cancelled',
              description: 'The export was cancelled.',
              timeout: 5000,
            });
            return;
          }
          const e = ensureError(error);
          posthog.captureException(e);
          close(toastId);
          add({
            variant: 'destructive',
            title: 'Export failed',
            description: e.message,
            timeout: 0,
          });
        } finally {
          exportingRef.current = false;
        }
      })();
    },
    [add, update, close, download],
  );

  return (
    <ExportContext.Provider value={{ startExport }}>
      {children}
    </ExportContext.Provider>
  );
}
