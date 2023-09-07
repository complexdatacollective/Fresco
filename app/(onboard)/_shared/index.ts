import { z } from 'zod';

export const formValidationSchema = z.object({
  username: z
    .string()
    .min(4, { message: 'Username must be at least 4 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignUpData = z.infer<typeof formValidationSchema>;
