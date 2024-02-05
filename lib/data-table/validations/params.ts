import * as z from 'zod';

export const searchParamsSchema = z.object({
  page: z.string().default('1'),
  per_page: z.string().default('10'),
  sort: z.string().optional(),
  timestamp: z.string().pipe(z.coerce.date()).optional(),
  type: z.string().optional(),
  message: z.string().optional(),
  operator: z.string().optional(),
});
