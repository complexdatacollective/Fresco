import { z } from 'zod';
import isStrongPassword from 'validator/es/lib/isStrongPassword';

export const userFormSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, { message: 'Username must be at least 4 characters' }),
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

export type UserSignupData = z.infer<typeof userFormSchema>;
