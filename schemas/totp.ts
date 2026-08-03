import 'server-only';
import { z } from 'zod';

export const verifyTotpSetupSchema = z.object({
  code: z
    .string()
    .length(6, { error: 'Code must be exactly 6 digits' })
    .regex(/^\d{6}$/, { error: 'Code must be exactly 6 digits' })
    .prefault(''),
});

export const verifyTwoFactorSchema = z.object({
  twoFactorToken: z.string().min(1, { error: 'Two-factor token is required' }),
  code: z.string().min(1, { error: 'Code cannot be empty' }).prefault(''),
});

export const disableTotpSchema = z.object({
  code: z
    .string()
    .min(1, { error: 'Code is required' })
    .refine((val) => /^\d{6}$/.test(val) || /^[0-9a-f]{20}$/.test(val), {
      error: 'Must be a 6-digit code or a recovery code',
    })
    .prefault(''),
});
