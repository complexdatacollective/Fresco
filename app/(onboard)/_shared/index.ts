import { z } from 'zod';
import isStrongPassword from 'validator/es/lib/isStrongPassword';
import { cn } from '~/utils/shadcn';

export const userFormSchema = z.object({
  username: z
    .string()
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

export const userFormClasses = cn(
  'relative mt-[-60px] flex w-[30rem] flex-col rounded-xl  bg-white p-8',
  'after:absolute after:inset-[-20px] after:z-[-1] after:rounded-3xl after:bg-white/30 after:shadow-2xl after:backdrop-blur-sm',
);
