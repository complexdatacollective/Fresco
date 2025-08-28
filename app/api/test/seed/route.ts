import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '~/utils/auth';
import { prisma } from '~/utils/db';

// Helper to check environment at runtime
function checkTestEnvironment() {
  // eslint-disable-next-line no-process-env
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'test' && nodeEnv !== 'development') {
    throw new Error(
      'Test endpoints are only available in test/development environments',
    );
  }
}

type SeedRequestBody = {
  action: string;
  data?: {
    username?: string;
    hash?: string;
    name?: string;
    schemaVersion?: number;
    description?: string;
    stages?: unknown[];
    codebook?: Record<string, unknown>;
    protocolId?: string;
    participantId?: string;
    currentStep?: number;
    stageMetadata?: Record<string, unknown>;
    network?: { nodes: unknown[]; edges: unknown[] };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check for test environment
    checkTestEnvironment();

    const body = (await request.json()) as SeedRequestBody;
    const { action, data } = body;

    switch (action) {
      case 'reset':
        // Clear all data from database
        await prisma.$transaction([
          prisma.session.deleteMany(),
          prisma.participant.deleteMany(),
          prisma.interview.deleteMany(),
          prisma.protocol.deleteMany(),
          prisma.user.deleteMany(),
        ]);
        return NextResponse.json({ message: 'Database reset successfully' });

      case 'createUser': {
        // Create a test user using Lucia auth
        const username = data?.username ?? 'testuser';
        const password = 'TestPassword123!'; // Strong password that meets requirements
        
        try {
          const user = await auth.createUser({
            key: {
              providerId: 'username',
              providerUserId: username,
              password,
            },
            attributes: {
              username,
            },
          });
          return NextResponse.json({ user });
        } catch (error) {
          // User might already exist, try to find existing user
          const existingUser = await prisma.user.findFirst({
            where: { username },
          });
          if (existingUser) {
            return NextResponse.json({ user: existingUser });
          }
          throw error;
        }
      }

      case 'createProtocol': {
        // Create a test protocol with unique hash
        const uniqueHash = data?.hash ?? `test-hash-${Date.now()}-${Math.random()}`;
        const protocol = await prisma.protocol.create({
          data: {
            hash: uniqueHash,
            name: data?.name ?? 'Test Protocol',
            schemaVersion: data?.schemaVersion ?? 8,
            lastModified: new Date(),
            description: data?.description ?? 'Test protocol for e2e tests',
            stages: data?.stages ?? [],
            codebook: data?.codebook ?? {},
          },
        });
        return NextResponse.json({ protocol });
      }

      case 'createInterview': {
        // Create a test interview
        if (!data?.protocolId || !data?.participantId) {
          return NextResponse.json(
            { error: 'protocolId and participantId are required' },
            { status: 400 },
          );
        }
        const interview = await prisma.interview.create({
          data: {
            protocolId: data.protocolId,
            participantId: data.participantId,
            currentStep: data.currentStep ?? 0,
            stageMetadata: data.stageMetadata ?? {},
            network: data.network ?? { nodes: [], edges: [] },
          },
        });
        return NextResponse.json({ interview });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Test seed error:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    // Check for test environment
    checkTestEnvironment();

    // Clear all test data
    await prisma.$transaction([
      prisma.session.deleteMany(),
      prisma.participant.deleteMany(),
      prisma.interview.deleteMany(),
      prisma.protocol.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    return NextResponse.json({ message: 'All test data cleared' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Test cleanup error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear test data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
