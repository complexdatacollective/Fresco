import 'server-only';
import { z } from 'zod';

import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from '~/utils/isStrongPassword';

/**
 * The password strength rule as a server-side schema. Exported so Server
 * Actions that set a password can enforce it without reaching into another
 * schema's shape — they are directly invokable, so the client-side check is
 * not a guarantee.
 */
export const strongPasswordSchema = z
  .string()
  .refine(isStrongPassword, { error: STRONG_PASSWORD_MESSAGE });

export const deleteUsersSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, { error: 'At least one user ID is required' }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: 'Current password is required' })
      .prefault(''),
    newPassword: strongPasswordSchema.prefault(''),
    confirmNewPassword: z.string().min(1).prefault(''),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
      });
    }
  });
