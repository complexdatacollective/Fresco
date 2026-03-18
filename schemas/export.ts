import { z } from 'zod/mini';
import { ExportOptionsSchema } from '~/lib/network-exporters/utils/types';

export const exportInterviewsSchema = z.object({
  interviewIds: z.array(z.string()).check(z.minLength(1)),
  exportOptions: ExportOptionsSchema,
});

export type ExportInterviewsInput = z.infer<typeof exportInterviewsSchema>;
