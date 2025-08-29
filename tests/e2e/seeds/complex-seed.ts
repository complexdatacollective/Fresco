import { type PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

/**
 * Seed script for complex test scenarios
 */
export default async function seed(prisma: PrismaClient) {
  // Create multiple protocols with different configurations
  const protocols = [];
  
  for (let i = 1; i <= 5; i++) {
    const protocol = await prisma.protocol.create({
      data: {
        id: createId(),
        hash: `hash_${i}_${createId()}`,
        name: `Research Protocol ${i}`,
        description: `Protocol ${i} for testing different interview scenarios`,
        schemaVersion: 8,
        lastModified: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Stagger dates
        stages: {
          stages: [
            {
              id: `info_${i}`,
              label: 'Information',
              type: 'Information',
              panels: [
                {
                  id: 'welcome',
                  title: `Welcome to Protocol ${i}`,
                  text: 'This is a test protocol for e2e testing.',
                },
              ],
            },
            {
              id: `namegen_${i}`,
              label: 'Name Generator',
              type: 'NameGenerator',
              subject: {
                entity: 'node',
                type: 'person',
              },
              prompts: [
                {
                  id: 'prompt1',
                  text: 'Name people in your network',
                },
              ],
            },
            {
              id: `sociogram_${i}`,
              label: 'Sociogram',
              type: 'Sociogram',
              subject: {
                entity: 'edge',
                type: 'relationship',
              },
              prompts: [
                {
                  id: 'prompt1',
                  text: 'Show relationships between people',
                },
              ],
            },
          ],
        },
        codebook: {
          node: {
            person: {
              name: 'Person',
              color: ['red', 'blue', 'green', 'yellow', 'purple'][i - 1],
              iconVariant: 'user',
              variables: {
                name: {
                  type: 'string',
                  name: 'Name',
                  required: true,
                },
                age: {
                  type: 'number',
                  name: 'Age',
                  required: false,
                },
                role: {
                  type: 'categorical',
                  name: 'Role',
                  options: ['Friend', 'Family', 'Colleague', 'Other'],
                },
              },
            },
          },
          edge: {
            relationship: {
              name: 'Relationship',
              color: 'gray',
              variables: {
                strength: {
                  type: 'ordinal',
                  name: 'Strength',
                  options: ['Weak', 'Medium', 'Strong'],
                },
              },
            },
          },
          ego: {
            variables: {
              participantAge: {
                type: 'number',
                name: 'Your Age',
              },
            },
          },
        },
      },
    });
    protocols.push(protocol);
  }

  // Create participants with various statuses
  const participants = [];
  for (let i = 1; i <= 30; i++) {
    const participant = await prisma.participant.create({
      data: {
        id: createId(),
        identifier: `P${String(i).padStart(4, '0')}`,
        label: `Participant ${i}`,
      },
    });
    participants.push(participant);
  }

  // Create interviews with different states
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const protocol = protocols[i % protocols.length];
    
    if (i < 10) {
      // Completed interviews
      await prisma.interview.create({
        data: {
          id: createId(),
          participantId: participant.id,
          protocolId: protocol.id,
          currentStep: 3,
          finishTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
          network: {
            nodes: Array.from({ length: 5 + i }, (_, j) => ({
              id: `node_${j}`,
              type: 'person',
              attributes: {
                name: `Person ${j + 1}`,
                age: 20 + j * 5,
                role: ['Friend', 'Family', 'Colleague', 'Other'][j % 4],
              },
            })),
            edges: Array.from({ length: 3 + i }, (_, j) => ({
              from: `node_${j}`,
              to: `node_${j + 1}`,
              type: 'relationship',
              attributes: {
                strength: ['Weak', 'Medium', 'Strong'][j % 3],
              },
            })),
            ego: {
              participantAge: 25 + i,
            },
          },
        },
      });
    } else if (i < 20) {
      // In-progress interviews
      await prisma.interview.create({
        data: {
          id: createId(),
          participantId: participant.id,
          protocolId: protocol.id,
          currentStep: (i - 10) % 3,
          network: {
            nodes: Array.from({ length: i - 8 }, (_, j) => ({
              id: `node_${j}`,
              type: 'person',
              attributes: {
                name: `Person ${j + 1}`,
              },
            })),
            edges: [],
            ego: {},
          },
        },
      });
    }
    // Remaining participants have no interviews
  }

  // Create some events for testing
  await prisma.events.createMany({
    data: [
      {
        type: 'PROTOCOL_IMPORTED',
        message: 'Protocol "Research Protocol 1" was imported',
      },
      {
        type: 'INTERVIEW_STARTED',
        message: 'Interview started for participant P0001',
      },
      {
        type: 'INTERVIEW_COMPLETED',
        message: 'Interview completed for participant P0001',
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('✅ Complex seed data created');
}

// Also export a named export for flexibility
export { seed };
