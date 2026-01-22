import { isStrongPassword } from 'validator';
import { z } from 'zod';

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
    newPassword: z
      .string()
      .refine(
        (password) =>
          isStrongPassword(password, {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          }),
        {
          error:
            'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
        },
      )
      .prefault(''),
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
