import { z } from 'zod';

export const participantIdentifierSchema = z
  .string()
  .nonempty({ message: 'Identifier cannot be empty' })
  .max(255, { message: 'Identifier too long. Maxiumum of 255 characters.' });

export const participantListInputSchema = z.array(participantIdentifierSchema);

export const updateSchema = z.object({
  identifier: participantIdentifierSchema,
  newIdentifier: participantIdentifierSchema,
});

export const interviewIdSchema = z.object({
  id: z.string(),
});

export const interviewListInputSchema = z.array(interviewIdSchema);
