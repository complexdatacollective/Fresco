'use client';

import posthog from 'posthog-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { z } from 'zod/mini';
import { useToast } from '@codaco/fresco-ui/Toast';
import type { ExportOptions } from '@codaco/network-exporters/options';
import { revalidateInterviewsAfterExport } from '~/actions/interviews';
import ExportToastContent from '~/components/ExportProgress/ExportToastContent';
import { calculateExportProgress } from '~/components/ExportProgress/calculateExportProgress';
import { useDownload } from '~/hooks/useDownload';
import { consumeExportStream } from '~/lib/export/streamProtocol';
import { ensureError } from '~/utils/ensureError';

type ExportContextValue = {
  startExport: (interviewIds: string[], exportOptions: ExportOptions) => void;
};

type ExportToastStage = {
  stage: 'fetching' | 'formatting' | 'generating' | 'outputting';
  current?: number;
  total?: number;
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

const ticketResponseSchema = z.object({ ticketId: z.string() });
const errorResponseSchema = z.object({ error: z.string() });

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

      const renderProgress = (toastId: string, stage: ExportToastStage) => {
        update(toastId, {
          description: (
            <ExportToastContent
              stage={stage.stage}
              current={stage.current}
              total={stage.total}
              progress={calculateExportProgress(stage)}
              onCancel={() => controller.abort()}
            />
          ),
        });
      };

      const toastId = add({
        title: 'Exporting interviews',
        description: (
          <ExportToastContent
            stage="fetching"
            progress={calculateExportProgress({ stage: 'fetching' })}
            onCancel={() => controller.abort()}
          />
        ),
        timeout: 0,
      });

      void (async () => {
        try {
          const ticketRes = await fetch('/api/export-interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewIds, exportOptions }),
            signal: controller.signal,
          });
          if (!ticketRes.ok) {
            const raw: unknown = await ticketRes.json().catch(() => ({}));
            const parsed = errorResponseSchema.safeParse(raw);
            throw new Error(
              parsed.success
                ? parsed.data.error
                : `Export request failed with status ${String(ticketRes.status)}`,
            );
          }
          const ticketRaw: unknown = await ticketRes.json();
          const ticket = ticketResponseSchema.safeParse(ticketRaw);
          if (!ticket.success) {
            throw new Error('Unexpected response from export server');
          }

          const res = await fetch(
            `/api/export-interviews/download?ticket=${ticket.data.ticketId}`,
            { signal: controller.signal },
          );
          if (!res.ok || !res.body) {
            throw new Error(
              `Export download failed with status ${String(res.status)}`,
            );
          }

          const zipChunks = await consumeExportStream(res.body, (event) => {
            renderProgress(toastId, {
              stage: event.stage,
              current: 'current' in event ? event.current : undefined,
              total: 'total' in event ? event.total : undefined,
            });
          });

          const blob = new Blob(zipChunks, { type: 'application/zip' });
          const date = new Date().toISOString().slice(0, 10);
          const objectUrl = URL.createObjectURL(blob);
          download(objectUrl, `fresco-export-${date}.zip`);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

          // Refresh the interviews list so exported rows show their new export
          // status. The server action's safeUpdateTag (read-your-own-writes)
          // expires the getInterviews cache, and invoking a server action from
          // the client triggers Next's automatic revalidation of the current
          // route — so no explicit router.refresh() is needed.
          await revalidateInterviewsAfterExport();
          close(toastId);
          add({
            title: 'Export complete',
            description: 'Your export has downloaded.',
            variant: 'success',
            timeout: 8000,
          });
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
