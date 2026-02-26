import { z } from 'zod';

export const verifyTotpSetupSchema = z.object({
  code: z
    .string()
    .length(6, { error: 'Code must be exactly 6 digits' })
    .regex(/^\d{6}$/, { error: 'Code must be exactly 6 digits' })
    .prefault(''),
});

export type VerifyTotpSetup = z.infer<typeof verifyTotpSetupSchema>;

export const verifyTwoFactorSchema = z.object({
  twoFactorToken: z.string().min(1, { error: 'Two-factor token is required' }),
  code: z.string().min(1, { error: 'Code cannot be empty' }).prefault(''),
});

export type VerifyTwoFactor = z.infer<typeof verifyTwoFactorSchema>;

export const disableTotpSchema = z.object({
  code: z
    .string()
    .length(6, { error: 'Code must be exactly 6 digits' })
    .regex(/^\d{6}$/, { error: 'Code must be exactly 6 digits' })
    .prefault(''),
});

export type DisableTotp = z.infer<typeof disableTotpSchema>;
