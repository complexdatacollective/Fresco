import { NextResponse } from 'next/server';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';
import { redirect } from 'next/navigation';

export async function GET() {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized.' });
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
    },
  });

  if (user.roles && user.roles.some((e) => e.name === 'PARTICIPANT')) {
    redirect('/signin?callbackUrl=/api/users');
  }

  const res = await prisma.user.findMany();

  return NextResponse.json({ data: res });
}
