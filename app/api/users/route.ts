import { NextResponse } from 'next/server';
import { getServerAuthSession } from '~/utils/auth';
import { prisma } from '~/utils/db';

export async function GET() {
  const session = await getServerAuthSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized.' })
  }

  const res = await prisma.user.findMany();

  return NextResponse.json({ data: res });
}