'use client';

import posthog from 'posthog-js';
import { createContext, useCallback, useContext } from 'react';
import { z } from 'zod/mini';
import Spinner from '@codaco/fresco-ui/Spinner';
import { useToast } from '@codaco/fresco-ui/Toast';
import type { ExportOptions } from '@codaco/network-exporters/options';
import { useDownload } from '~/hooks/useDownload';
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

const ticketResponseSchema = z.object({ ticketId: z.string() });
const errorResponseSchema = z.object({ error: z.string() });

export function ExportProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { add, close } = useToast();
  const download = useDownload();

  const startExport = useCallback(
    (interviewIds: string[], exportOptions: ExportOptions) => {
      const toastId = add({
        icon: <Spinner size="xs" aria-hidden="true" />,
        title: 'Exporting interviews',
        description: 'Preparing your export...',
        timeout: Infinity,
      });

      void (async () => {
        try {
          const response = await fetch('/api/export-interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewIds, exportOptions }),
          });

          if (!response.ok) {
            const raw: unknown = await response.json().catch(() => ({}));
            const parsed = errorResponseSchema.safeParse(raw);
            throw new Error(
              parsed.success
                ? parsed.data.error
                : `Export request failed with status ${String(response.status)}`,
            );
          }

          const raw: unknown = await response.json();
          const parsed = ticketResponseSchema.safeParse(raw);
          if (!parsed.success) {
            throw new Error('Unexpected response from export server');
          }

          download(
            `/api/export-interviews/download?ticket=${parsed.data.ticketId}`,
            'fresco-export.zip',
          );

          close(toastId);
          add({
            title: 'Export started',
            description:
              "Your download has started. Check your browser's downloads for progress. If the download fails, please try again.",
            variant: 'success',
            timeout: 8000,
          });
        } catch (error) {
          const e = ensureError(error);
          posthog.captureException(e);
          close(toastId);
          add({
            variant: 'destructive',
            title: 'Export failed',
            description: e.message,
            timeout: Infinity,
          });
        }
      })();
    },
    [add, close, download],
  );

  return (
    <ExportContext.Provider value={{ startExport }}>
      {children}
    </ExportContext.Provider>
  );
}
