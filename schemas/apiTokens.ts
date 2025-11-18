import { z } from 'zod';

export const createApiTokenSchema = z.object({
  description: z.string().optional(),
});

export const updateApiTokenSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const deleteApiTokenSchema = z.object({
  id: z.string(),
});

export type CreateApiToken = z.infer<typeof createApiTokenSchema>;
export type UpdateApiToken = z.infer<typeof updateApiTokenSchema>;
export type DeleteApiToken = z.infer<typeof deleteApiTokenSchema>;
