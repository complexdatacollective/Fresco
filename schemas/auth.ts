import { z } from 'zod';

export const loginSchema = z.object({
  // The preprocess step is required for zod to perform the required check properly
  // as the value of an empty input is usually an empty string
  username: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Username is required' }),
  ),
  password: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Password is required' }),
  ),
});
