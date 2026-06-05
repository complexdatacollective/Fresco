import { z } from 'zod/mini';
import { ExportOptionsSchema } from '@codaco/network-exporters/options';

export const exportInterviewsSchema = z.object({
  interviewIds: z.array(z.string()).check(z.minLength(1)),
  exportOptions: ExportOptionsSchema,
});
