import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/lib/db';
import { requireApiAuth } from '~/utils/auth';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const routeHandler = async (_request: NextRequest, { params }: RouteParams) => {
  try {
    await requireApiAuth();

    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: {
        network: true,
        currentStep: true,
        stageMetadata: true,
        version: true,
        lastUpdated: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      network: interview.network,
      currentStep: interview.currentStep,
      stageMetadata: interview.stageMetadata,
      version: interview.version,
      lastUpdated: interview.lastUpdated.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch interview state' },
      { status: 500 },
    );
  }
};

export { routeHandler as GET };
