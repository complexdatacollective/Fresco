import { NextResponse } from 'next/server';
import { prisma } from '~/utils/db';

export async function GET() {
    const protocol = await prisma.protocol.findUnique({
        where: {
            id: 1,
        },
        select: {
            id: true,
            name: true,
            description: true,
            data: true,
        }
    });

    return NextResponse.json({ data: protocol });
}

