import { z } from 'zod';
import isStrongPassword from 'validator/es/lib/isStrongPassword';
import { cn } from '~/utils/shadcn';

export const userCreateFormSchema = z.object({
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

const userSignInFormSchema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});

export const containerClasses = cn(
  'relative mt-[-60px] flex flex-col rounded-xl min-w-full-[30rem] bg-card p-8',
  'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-3xl after:bg-panel/30 after:shadow-2xl after:backdrop-blur-sm',
);
