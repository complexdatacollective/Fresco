import { z } from 'zod/mini';
import { ExportOptionsSchema } from '@codaco/network-exporters/options';

// Bound the optional export concurrency so a request cannot fan out unboundedly
// and exhaust the export function's memory/CPU. An out-of-range value is
// rejected as a validation error rather than silently clamped.
const MAX_EXPORT_CONCURRENCY = 8;

export const exportInterviewsSchema = z.object({
  interviewIds: z.array(z.string()).check(z.minLength(1)),
  exportOptions: ExportOptionsSchema.check(
    z.refine(
      (options) =>
        options.concurrency === undefined ||
        (Number.isInteger(options.concurrency) &&
          options.concurrency >= 1 &&
          options.concurrency <= MAX_EXPORT_CONCURRENCY),
      `Export concurrency must be an integer between 1 and ${MAX_EXPORT_CONCURRENCY}.`,
    ),
  ),
});
