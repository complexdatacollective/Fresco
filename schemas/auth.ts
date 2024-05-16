import { isStrongPassword } from 'validator';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const createUserSchema = z.object({
  username: z
    .string()
    .min(4, { message: 'Username must be at least 4 characters' })
    .refine((s) => !s.includes(' '), 'Username cannot contain spaces'),
  password: z.string().refine(
    (password) =>
      isStrongPassword(password, {
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
    {
      message:
        'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol',
    },
  ),
});

export const createUserFormDataSchema = zfd.formData(createUserSchema);

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});
