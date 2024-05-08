import { ZFormattedSessionSchema } from './types';

export default async function validateData(
  sessions: unknown,
  protocols: unknown,
) {
  // Sessions and protocols cannot be empty
  // Reject if required parameters aren't provided
  if (
    (!sessions && !isEmpty(sessions)) ||
    (!protocols && !isEmpty(protocols))
  ) {
    throw new ExportError(ErrorMessages.MissingParameters);
  }

  // Sessions must pass schema validation
  const validatedSessions = await ZFormattedSessionSchema.parseAsync(sessions);

  // The protocol
}
