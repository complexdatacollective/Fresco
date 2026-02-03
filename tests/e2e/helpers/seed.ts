import { TestDataBuilder, TimestampGenerator } from './TestDataBuilder.js';
import { log } from './logger.js';

// Admin credentials used across all seeded environments
const ADMIN_CREDENTIALS = {
  username: 'testadmin',
  password: 'TestAdmin123!',
};

export async function seedSetupEnvironment(
  connectionUri: string,
): Promise<void> {
  log('setup', 'Seeding setup environment (unconfigured app)...');
  const builder = new TestDataBuilder(connectionUri);

  try {
    await builder.setupAppSettings({
      configured: 'false',
    });
    log('setup', 'Setup environment seeded');
  } finally {
    await builder.close();
  }
}

export async function seedDashboardEnvironment(
  connectionUri: string,
): Promise<void> {
  log('setup', 'Seeding dashboard environment...');
  const builder = new TestDataBuilder(connectionUri);

  try {
    // Create admin user
    await builder.createUser(
      ADMIN_CREDENTIALS.username,
      ADMIN_CREDENTIALS.password,
    );

    // Configure app settings
    await builder.setupAppSettings();

    // Create protocol
    const protocol = await builder.createProtocol();

    // Create 10 participants (P001 - P010)
    const participants = [];
    for (let i = 1; i <= 10; i++) {
      const identifier = `P${String(i).padStart(3, '0')}`;
      const participant = await builder.createParticipant({
        identifier,
        label: `Participant ${i}`,
      });
      participants.push(participant);
    }

    // Create 5 interviews:
    // P001: completed + exported
    // P002: completed (not exported)
    // P003-P005: in progress
    await builder.createInterview(participants[0]!.id, protocol.id, {
      finished: true,
      exported: true,
      currentStep: 2,
    });

    await builder.createInterview(participants[1]!.id, protocol.id, {
      finished: true,
      exported: false,
      currentStep: 2,
    });

    for (let i = 2; i < 5; i++) {
      await builder.createInterview(participants[i]!.id, protocol.id, {
        finished: false,
        exported: false,
        currentStep: 1,
      });
    }

    // Create activity events with sequential timestamps AND deterministic IDs.
    // IDs are ordered so that when sorted by "timestamp DESC, id DESC", the
    // most recent event (highest timestamp) also has the highest-sorting ID.
    // This ensures deterministic ordering even if timestamps were somehow equal.
    const eventTimestamps = new TimestampGenerator();
    await builder.createEvent(
      'Protocol Installed',
      'Protocol "Test Protocol" installed',
      {
        timestamp: eventTimestamps.next(),
        id: 'event-001-protocol-installed',
      },
    );
    await builder.createEvent(
      'User Login',
      `User ${ADMIN_CREDENTIALS.username} logged in`,
      {
        timestamp: eventTimestamps.next(),
        id: 'event-002-user-login',
      },
    );
    await builder.createEvent(
      'Participant Added',
      'Added 10 participants via CSV import',
      {
        timestamp: eventTimestamps.next(),
        id: 'event-003-participant-added',
      },
    );

    log('setup', 'Dashboard environment seeded');
  } finally {
    await builder.close();
  }
}
