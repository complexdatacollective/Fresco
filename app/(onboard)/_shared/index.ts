import { z } from 'zod';

export const formValidationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export type SignUpData = z.infer<typeof formValidationSchema>;
