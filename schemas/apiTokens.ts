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
