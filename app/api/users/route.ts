import { NextResponse } from 'next/server';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function GET() {
  const session = await getServerAuthSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized.' })
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
    }
  });

  if (user.roles && user.roles.some(e => e.name === 'PARTICIPANT')) {
    return NextResponse.json({ message: 'Unauthorized.' })
  }

  const res = await prisma.user.findMany();

  return NextResponse.json({ data: res });
}