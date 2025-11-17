import { isStrongPassword } from 'validator';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

const usernameSchema = z
  .string()
  .min(4, { message: 'Username must be at least 4 characters' })
  .refine((s) => !s.includes(' '), 'Username cannot contain spaces');

const passwordSchema = z.string().refine(
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
);

export const createUserSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const createUserFormDataSchema = zfd
  .formData({
    username: zfd.text(),
    password: zfd.text(),
    confirmPassword: zfd.text(),
  })
  .transform((data) => {
    const result = createUserSchema.safeParse(data);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  });

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username cannot be empty' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});
