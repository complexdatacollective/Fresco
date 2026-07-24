import { z } from 'zod/mini';
import { isStrongPassword } from '~/utils/isStrongPassword';

export const createUserSchema = z
  .object({
    username: z.prefault(
      z
        .string()
        .check(z.minLength(4, 'Username must be at least 4 characters'))
        .check(
          z.refine((s) => !s.includes(' '), 'Username cannot contain spaces'),
        ),
      '',
    ),
    password: z.prefault(
      z
        .string()
        .check(
          z.refine(
            isStrongPassword,
            'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
          ),
        ),
      '',
    ),
    confirmPassword: z.prefault(z.string().check(z.minLength(1)), ''),
  })
  .check(
    z.superRefine((val, ctx) => {
      if (val.password !== val.confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });
      }
    }),
  );

export const loginSchema = z.object({
  username: z.prefault(
    z.string().check(z.minLength(1, 'Username cannot be empty')),
    '',
  ),
  password: z.prefault(
    z.string().check(z.minLength(1, 'Password cannot be empty')),
    '',
  ),
});
