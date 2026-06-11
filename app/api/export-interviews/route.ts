import { requireApiAuth } from '~/lib/auth/guards';
import { prisma } from '~/lib/db';
import { createExportTicket } from '~/lib/export/tickets';
import { exportInterviewsSchema } from '~/schemas/export';

export async function POST(request: Request) {
  let userId: string;
  try {
    const session = await requireApiAuth();
    userId = session.user.userId;
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = exportInterviewsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Dedupe so repeated IDs don't make the count mismatch look like a 404.
  const interviewIds = [...new Set(parsed.data.interviewIds)];

  const count = await prisma.interview.count({
    where: { id: { in: interviewIds } },
  });
  if (count !== interviewIds.length) {
    return Response.json(
      { error: 'One or more interviews not found' },
      { status: 404 },
    );
  }

  const ticketId = await createExportTicket(userId, {
    interviewIds,
    exportOptions: parsed.data.exportOptions,
  });
  return Response.json({ ticketId });
}
