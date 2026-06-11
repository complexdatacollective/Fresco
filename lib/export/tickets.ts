import 'server-only';
import { type z } from 'zod/mini';
import { prisma } from '~/lib/db';
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

export async function consumeExportTicket(
  id: string,
): Promise<ExportTicketParams | null> {
  const ticket = await prisma.exportTicket.findUnique({ where: { id } });
  if (!ticket) return null;

  // Single use: delete before validating so a failed parse can't be retried.
  await prisma.exportTicket.delete({ where: { id } });

  if (ticket.expiresAt < new Date()) return null;

  const parsed = exportInterviewsSchema.safeParse(ticket.params);
  return parsed.success ? parsed.data : null;
}
