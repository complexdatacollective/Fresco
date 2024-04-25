import { z } from 'zod';

export const deleteInterviewsSchema = z.array(
  z.object({
    id: z.string(),
  }),
);

export type DeleteInterviews = z.infer<typeof deleteInterviewsSchema>;
