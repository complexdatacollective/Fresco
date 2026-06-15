import 'server-only';
import { type z } from 'zod/mini';
import { prisma } from '~/lib/db';
import { Prisma } from '~/lib/db/generated/client';
import { exportInterviewsSchema } from '~/schemas/export';

const TICKET_TTL_MS = 5 * 60 * 1000;

type ExportTicketParams = z.infer<typeof exportInterviewsSchema>;

export async function createExportTicket(
  userId: string,
  params: ExportTicketParams,
): Promise<string> {
  // Lazy cleanup: purge expired tickets so the table doesn't grow unbounded.
  await prisma.exportTicket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const ticket = await prisma.exportTicket.create({
    data: {
      userId,
      params,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    },
  });

  return ticket.id;
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

export async function consumeExportTicket(
  id: string,
  userId: string,
): Promise<ExportTicketParams | null> {
  // Atomic single-use consume, bound to the creating user via the compound
  // where: a wrong-user attempt matches nothing (so the ticket survives), and
  // with concurrent redemptions only one delete succeeds. Either miss surfaces
  // as P2025 (record not found), which is treated as "no ticket". Any other
  // DB error must propagate.
  const ticket = await prisma.exportTicket
    .delete({ where: { id, userId } })
    .catch((error: unknown) => {
      if (isRecordNotFound(error)) return null;
      throw error;
    });
  if (!ticket) return null;

  if (ticket.expiresAt < new Date()) return null;

  const parsed = exportInterviewsSchema.safeParse(ticket.params);
  return parsed.success ? parsed.data : null;
}
