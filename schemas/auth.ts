import { isStrongPassword } from 'validator';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(4, { error: 'Username must be at least 4 characters' })
      .refine((s) => !s.includes(' '), 'Username cannot contain spaces')
      .prefault(''),
    password: z
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
    confirmPassword: z.string().min(1).prefault(''),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const createUserFormDataSchema = zfd.formData(createUserSchema);

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { error: 'Username cannot be empty' })
    .prefault(''),
  password: z
    .string()
    .min(1, { error: 'Password cannot be empty' })
    .prefault(''),
});
