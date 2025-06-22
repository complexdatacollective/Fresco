# PHASE 2: Database & Seeding Infrastructure

This phase focuses on creating robust database management and seeding utilities for reliable E2E testing. Each task builds upon the foundation established in Phase 1.

## Prerequisites
- Phase 1 completed successfully
- Test database running and accessible
- Basic understanding of Prisma ORM

## Task 2.1: Test Database Client Configuration

**Objective**: Create a dedicated Prisma client configuration for testing with proper connection management.

**Steps**:

1. **Create test database utilities directory**:
   ```bash
   mkdir -p tests/e2e/utils/database
   touch tests/e2e/utils/database/client.ts
   ```

2. **Create test-specific Prisma client**:
   ```typescript
   // tests/e2e/utils/database/client.ts
   import { PrismaClient } from '@prisma/client';
   
   // Global variable to store the test client instance
   declare global {
     var __testPrisma: PrismaClient | undefined;
   }
   
   // Create a singleton Prisma client for tests
   export const testPrisma = global.__testPrisma || new PrismaClient({
     datasources: {
       db: {
         url: process.env.POSTGRES_PRISMA_URL,
       },
     },
     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
   });
   
   // Store the client globally in development to prevent multiple instances
   if (process.env.NODE_ENV !== 'production') {
     global.__testPrisma = testPrisma;
   }
   
   // Helper function to safely disconnect the client
   export const disconnectTestDatabase = async () => {
     try {
       await testPrisma.$disconnect();
     } catch (error) {
       console.error('Error disconnecting test database:', error);
     }
   };
   
   // Helper function to verify database connection
   export const verifyDatabaseConnection = async () => {
     try {
       await testPrisma.$queryRaw`SELECT 1`;
       return true;
     } catch (error) {
       console.error('Database connection failed:', error);
       return false;
     }
   };
   ```

3. **Create database cleanup utilities**:
   ```bash
   touch tests/e2e/utils/database/cleanup.ts
   ```

4. **Add comprehensive cleanup functions**:
   ```typescript
   // tests/e2e/utils/database/cleanup.ts
   import { testPrisma } from './client';
   
   /**
    * Clean all data from the test database
    * This should be called before each test to ensure isolation
    */
   export const cleanDatabase = async () => {
     const tablenames = await testPrisma.$queryRaw<
       Array<{ tablename: string }>
     >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
   
     const tables = tablenames
       .map(({ tablename }) => tablename)
       .filter((name) => name !== '_prisma_migrations')
       .map((name) => `"public"."${name}"`)
       .join(', ');
   
     try {
       await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
     } catch (error) {
       console.log({ error });
     }
   };
   
   /**
    * Clean specific tables (useful for targeted cleanup)
    */
   export const cleanTables = async (tableNames: string[]) => {
     for (const tableName of tableNames) {
       try {
         await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
       } catch (error) {
         console.error(`Failed to clean table ${tableName}:`, error);
       }
     }
   };
   
   /**
    * Reset database to initial state with basic app settings
    */
   export const resetDatabaseToInitialState = async () => {
     await cleanDatabase();
     
     // Add any default app settings that should always exist
     try {
       await testPrisma.appSettings.createMany({
         data: [
           { key: 'configured', value: 'true' },
           { key: 'initializedAt', value: new Date().toISOString() },
           { key: 'disableAnalytics', value: 'true' }, // Disable analytics in tests
         ],
         skipDuplicates: true,
       });
     } catch (error) {
       console.error('Failed to set initial app settings:', error);
     }
   };
   
   /**
    * Clean up specific entities by type
    */
   export const cleanupEntity = async (entityType: 'users' | 'protocols' | 'interviews' | 'participants') => {
     switch (entityType) {
       case 'users':
         await testPrisma.session.deleteMany();
         await testPrisma.key.deleteMany();
         await testPrisma.user.deleteMany();
         break;
       case 'protocols':
         await testPrisma.interview.deleteMany();
         await testPrisma.protocol.deleteMany();
         break;
       case 'interviews':
         await testPrisma.interview.deleteMany();
         break;
       case 'participants':
         await testPrisma.interview.deleteMany();
         await testPrisma.participant.deleteMany();
         break;
     }
   };
   ```

**Verification**: Run `npx tsx tests/e2e/utils/database/client.ts` to ensure the client can connect without errors.

## Task 2.2: Test Data Factories

**Objective**: Create factories for generating realistic test data using faker.js.

**Steps**:

1. **Install faker.js for test data generation**:
   ```bash
   pnpm add -D @faker-js/faker
   ```

2. **Create test data factories directory**:
   ```bash
   mkdir -p tests/e2e/test-data/factories
   touch tests/e2e/test-data/factories/index.ts
   ```

3. **Create user factory**:
   ```bash
   touch tests/e2e/test-data/factories/user.factory.ts
   ```

4. **Add user factory implementation**:
   ```typescript
   // tests/e2e/test-data/factories/user.factory.ts
   import { faker } from '@faker-js/faker';
   import { testPrisma } from '../../utils/database/client';
   import { hash } from '@node-rs/argon2';
   
   export interface TestUser {
     id: string;
     username: string;
     password: string; // Plain text for testing
   }
   
   export interface CreateUserOptions {
     username?: string;
     password?: string;
   }
   
   /**
    * Create a test user with authentication keys
    */
   export const createTestUser = async (options: CreateUserOptions = {}): Promise<TestUser> => {
     const username = options.username || faker.internet.userName().toLowerCase();
     const password = options.password || 'testPassword123!';
     const hashedPassword = await hash(password);
   
     const user = await testPrisma.user.create({
       data: {
         username,
         key: {
           create: {
             id: `username:${username}`,
             hashed_password: hashedPassword,
           },
         },
       },
       include: {
         key: true,
       },
     });
   
     return {
       id: user.id,
       username: user.username,
       password, // Return plain text password for testing
     };
   };
   
   /**
    * Create multiple test users
    */
   export const createTestUsers = async (count: number): Promise<TestUser[]> => {
     const users: TestUser[] = [];
     
     for (let i = 0; i < count; i++) {
       const user = await createTestUser({
         username: `testuser${i + 1}`,
         password: 'testPassword123!',
       });
       users.push(user);
     }
     
     return users;
   };
   
   /**
    * Create an admin test user (if you have role-based permissions)
    */
   export const createAdminUser = async (): Promise<TestUser> => {
     return createTestUser({
       username: 'admin',
       password: 'adminPassword123!',
     });
   };
   ```

5. **Create protocol factory**:
   ```bash
   touch tests/e2e/test-data/factories/protocol.factory.ts
   ```

6. **Add protocol factory implementation**:
   ```typescript
   // tests/e2e/test-data/factories/protocol.factory.ts
   import { faker } from '@faker-js/faker';
   import { testPrisma } from '../../utils/database/client';
   import type { Protocol } from '@prisma/client';
   
   export interface CreateProtocolOptions {
     name?: string;
     description?: string;
     schemaVersion?: number;
   }
   
   /**
    * Generate a basic protocol structure for testing
    */
   const generateBasicProtocol = (name: string, description?: string) => ({
     name,
     description: description || faker.lorem.sentence(),
     schemaVersion: 6,
     stages: [
       {
         id: 'stage1',
         type: 'NameGenerator',
         label: 'Name Generator Stage',
         prompts: [
           {
             id: 'prompt1',
             text: 'Please name people you know',
             variable: 'name',
           },
         ],
       },
       {
         id: 'stage2',
         type: 'Information',
         label: 'Information Stage',
         items: [
           {
             id: 'info1',
             content: 'Thank you for participating!',
           },
         ],
       },
     ],
     codebook: {
       node: {
         person: {
           name: 'Person',
           color: '#16a085',
           variables: {
             name: {
               name: 'Name',
               type: 'text',
             },
           },
         },
       },
       edge: {},
       ego: {
         variables: {},
       },
     },
   });
   
   /**
    * Create a test protocol
    */
   export const createTestProtocol = async (options: CreateProtocolOptions = {}): Promise<Protocol> => {
     const name = options.name || faker.company.name() + ' Study';
     const protocolData = generateBasicProtocol(name, options.description);
     
     const protocol = await testPrisma.protocol.create({
       data: {
         ...protocolData,
         hash: faker.string.uuid(),
         lastModified: new Date(),
         stages: protocolData.stages,
         codebook: protocolData.codebook,
         schemaVersion: options.schemaVersion || 6,
       },
     });
   
     return protocol;
   };
   
   /**
    * Create a protocol with complex stages for testing different interfaces
    */
   export const createComplexTestProtocol = async (): Promise<Protocol> => {
     const protocolData = {
       name: 'Complex Test Protocol',
       description: 'A protocol with multiple interface types for comprehensive testing',
       schemaVersion: 6,
       stages: [
         {
           id: 'name_generator',
           type: 'NameGenerator',
           label: 'Name Generator',
           prompts: [
             {
               id: 'friends_prompt',
               text: 'Please name people you consider friends',
               variable: 'name',
               nodeType: 'person',
             },
           ],
         },
         {
           id: 'sociogram',
           type: 'Sociogram',
           label: 'Sociogram',
           prompts: [
             {
               id: 'friendship_ties',
               text: 'Draw connections between people who are friends',
               edgeVariable: 'friendship',
             },
           ],
         },
         {
           id: 'ego_form',
           type: 'EgoForm',
           label: 'About You',
           form: {
             fields: [
               {
                 variable: 'age',
                 prompt: 'What is your age?',
                 type: 'number',
               },
               {
                 variable: 'gender',
                 prompt: 'What is your gender?',
                 type: 'categorical',
                 options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
               },
             ],
           },
         },
       ],
       codebook: {
         node: {
           person: {
             name: 'Person',
             color: '#16a085',
             variables: {
               name: { name: 'Name', type: 'text' },
               age: { name: 'Age', type: 'number' },
               gender: { name: 'Gender', type: 'categorical' },
             },
           },
         },
         edge: {
           friendship: {
             name: 'Friendship',
             color: '#e74c3c',
             variables: {},
           },
         },
         ego: {
           variables: {
             age: { name: 'Age', type: 'number' },
             gender: { name: 'Gender', type: 'categorical' },
           },
         },
       },
     };
   
     return await testPrisma.protocol.create({
       data: {
         ...protocolData,
         hash: faker.string.uuid(),
         lastModified: new Date(),
         stages: protocolData.stages,
         codebook: protocolData.codebook,
       },
     });
   };
   
   /**
    * Create multiple test protocols
    */
   export const createTestProtocols = async (count: number): Promise<Protocol[]> => {
     const protocols: Protocol[] = [];
     
     for (let i = 0; i < count; i++) {
       const protocol = await createTestProtocol({
         name: `Test Protocol ${i + 1}`,
         description: `Description for test protocol ${i + 1}`,
       });
       protocols.push(protocol);
     }
     
     return protocols;
   };
   ```

7. **Create participant and interview factories**:
   ```bash
   touch tests/e2e/test-data/factories/participant.factory.ts
   touch tests/e2e/test-data/factories/interview.factory.ts
   ```

8. **Add participant factory**:
   ```typescript
   // tests/e2e/test-data/factories/participant.factory.ts
   import { faker } from '@faker-js/faker';
   import { testPrisma } from '../../utils/database/client';
   import type { Participant } from '@prisma/client';
   
   export interface CreateParticipantOptions {
     identifier?: string;
     label?: string;
   }
   
   /**
    * Create a test participant
    */
   export const createTestParticipant = async (options: CreateParticipantOptions = {}): Promise<Participant> => {
     const identifier = options.identifier || faker.string.alphanumeric(8).toUpperCase();
     const label = options.label || faker.person.fullName();
   
     return await testPrisma.participant.create({
       data: {
         identifier,
         label,
       },
     });
   };
   
   /**
    * Create multiple test participants
    */
   export const createTestParticipants = async (count: number): Promise<Participant[]> => {
     const participants: Participant[] = [];
     
     for (let i = 0; i < count; i++) {
       const participant = await createTestParticipant({
         identifier: `PART${String(i + 1).padStart(3, '0')}`,
         label: faker.person.fullName(),
       });
       participants.push(participant);
     }
     
     return participants;
   };
   ```

9. **Add interview factory**:
   ```typescript
   // tests/e2e/test-data/factories/interview.factory.ts
   import { faker } from '@faker-js/faker';
   import { testPrisma } from '../../utils/database/client';
   import type { Interview, Protocol, Participant } from '@prisma/client';
   
   export interface CreateInterviewOptions {
     protocolId?: string;
     participantId?: string;
     currentStep?: number;
     isFinished?: boolean;
     withNetwork?: boolean;
   }
   
   /**
    * Generate a basic network for an interview
    */
   const generateBasicNetwork = () => ({
     nodes: [
       {
         uid: faker.string.uuid(),
         type: 'person',
         attributes: {
           name: faker.person.firstName(),
         },
       },
       {
         uid: faker.string.uuid(),
         type: 'person',
         attributes: {
           name: faker.person.firstName(),
         },
       },
     ],
     edges: [],
     ego: {
       uid: 'ego',
       attributes: {},
     },
   });
   
   /**
    * Create a test interview
    */
   export const createTestInterview = async (options: CreateInterviewOptions = {}): Promise<Interview> => {
     let protocolId = options.protocolId;
     let participantId = options.participantId;
   
     // Create protocol if not provided
     if (!protocolId) {
       const { createTestProtocol } = await import('./protocol.factory');
       const protocol = await createTestProtocol();
       protocolId = protocol.id;
     }
   
     // Create participant if not provided
     if (!participantId) {
       const { createTestParticipant } = await import('./participant.factory');
       const participant = await createTestParticipant();
       participantId = participant.id;
     }
   
     const network = options.withNetwork ? generateBasicNetwork() : { nodes: [], edges: [], ego: { uid: 'ego', attributes: {} } };
   
     return await testPrisma.interview.create({
       data: {
         protocolId,
         participantId,
         currentStep: options.currentStep || 0,
         network,
         finishTime: options.isFinished ? new Date() : null,
         stageMetadata: {},
       },
     });
   };
   
   /**
    * Create multiple test interviews
    */
   export const createTestInterviews = async (
     count: number,
     protocol: Protocol,
     participants?: Participant[]
   ): Promise<Interview[]> => {
     const interviews: Interview[] = [];
     
     // Create participants if not provided
     if (!participants) {
       const { createTestParticipants } = await import('./participant.factory');
       participants = await createTestParticipants(count);
     }
   
     for (let i = 0; i < count; i++) {
       const interview = await createTestInterview({
         protocolId: protocol.id,
         participantId: participants[i]?.id,
         currentStep: faker.number.int({ min: 0, max: 3 }),
         isFinished: faker.datatype.boolean(),
         withNetwork: true,
       });
       interviews.push(interview);
     }
     
     return interviews;
   };
   ```

10. **Create factory index file**:
    ```typescript
    // tests/e2e/test-data/factories/index.ts
    export * from './user.factory';
    export * from './protocol.factory';
    export * from './participant.factory';
    export * from './interview.factory';
    ```

**Verification**: Create a simple test file to verify factories work correctly.

## Task 2.3: Database Seeding Scripts

**Objective**: Create comprehensive seeding scripts for different test scenarios.

**Steps**:

1. **Create seeding directory**:
   ```bash
   mkdir -p tests/e2e/utils/database/seeds
   touch tests/e2e/utils/database/seeds/index.ts
   ```

2. **Create basic seed script**:
   ```bash
   touch tests/e2e/utils/database/seeds/basic.seed.ts
   ```

3. **Add basic seed implementation**:
   ```typescript
   // tests/e2e/utils/database/seeds/basic.seed.ts
   import { resetDatabaseToInitialState } from '../cleanup';
   import {
     createTestUser,
     createTestProtocol,
     createTestParticipants,
     createTestInterviews,
   } from '../../test-data/factories';
   
   export interface BasicSeedData {
     user: { id: string; username: string; password: string };
     protocols: any[];
     participants: any[];
     interviews: any[];
   }
   
   /**
    * Seed database with basic test data
    */
   export const seedBasicData = async (): Promise<BasicSeedData> => {
     // Reset database to clean state
     await resetDatabaseToInitialState();
   
     // Create test user
     const user = await createTestUser({
       username: 'testuser',
       password: 'testPassword123!',
     });
   
     // Create test protocols
     const protocol1 = await createTestProtocol({
       name: 'Test Protocol 1',
       description: 'A basic protocol for testing',
     });
   
     const protocol2 = await createTestProtocol({
       name: 'Test Protocol 2',
       description: 'Another protocol for testing',
     });
   
     // Create test participants
     const participants = await createTestParticipants(5);
   
     // Create some interviews
     const interviews1 = await createTestInterviews(3, protocol1, participants.slice(0, 3));
     const interviews2 = await createTestInterviews(2, protocol2, participants.slice(3, 5));
   
     return {
       user,
       protocols: [protocol1, protocol2],
       participants,
       interviews: [...interviews1, ...interviews2],
     };
   };
   ```

4. **Create dashboard-specific seed**:
   ```bash
   touch tests/e2e/utils/database/seeds/dashboard.seed.ts
   ```

5. **Add dashboard seed implementation**:
   ```typescript
   // tests/e2e/utils/database/seeds/dashboard.seed.ts
   import { resetDatabaseToInitialState } from '../cleanup';
   import {
     createTestUser,
     createTestProtocols,
     createTestParticipants,
     createTestInterviews,
     createComplexTestProtocol,
   } from '../../test-data/factories';
   
   /**
    * Seed database with comprehensive data for dashboard testing
    */
   export const seedDashboardData = async () => {
     await resetDatabaseToInitialState();
   
     // Create admin user
     const adminUser = await createTestUser({
       username: 'admin',
       password: 'adminPassword123!',
     });
   
     // Create multiple protocols for testing pagination and filtering
     const protocols = await createTestProtocols(10);
     
     // Add one complex protocol
     const complexProtocol = await createComplexTestProtocol();
     protocols.push(complexProtocol);
   
     // Create many participants for testing large datasets
     const participants = await createTestParticipants(50);
   
     // Create interviews with various states
     const allInterviews = [];
     
     for (const protocol of protocols) {
       const protocolParticipants = participants.slice(0, 5); // 5 interviews per protocol
       const interviews = await createTestInterviews(5, protocol, protocolParticipants);
       allInterviews.push(...interviews);
     }
   
     // Create some finished interviews
     for (let i = 0; i < 10; i++) {
       const finishedInterview = allInterviews[i];
       if (finishedInterview) {
         await testPrisma.interview.update({
           where: { id: finishedInterview.id },
           data: { finishTime: new Date() },
         });
       }
     }
   
     return {
       user: adminUser,
       protocols,
       participants,
       interviews: allInterviews,
     };
   };
   ```

6. **Create setup/onboarding seed**:
   ```bash
   touch tests/e2e/utils/database/seeds/setup.seed.ts
   ```

7. **Add setup seed implementation**:
   ```typescript
   // tests/e2e/utils/database/seeds/setup.seed.ts
   import { resetDatabaseToInitialState, cleanDatabase } from '../cleanup';
   import { testPrisma } from '../client';
   
   /**
    * Seed database for setup/onboarding testing (minimal setup)
    */
   export const seedSetupData = async () => {
     await cleanDatabase();
     
     // Don't add the 'configured' setting to simulate first-time setup
     await testPrisma.appSettings.createMany({
       data: [
         { key: 'disableAnalytics', value: 'true' },
       ],
       skipDuplicates: true,
     });
   
     return {
       isInitialSetup: true,
     };
   };
   
   /**
    * Seed database for testing setup completion
    */
   export const seedCompletedSetupData = async () => {
     await resetDatabaseToInitialState();
   
     // Add UploadThing configuration
     await testPrisma.appSettings.createMany({
       data: [
         { key: 'uploadThingToken', value: 'test-uploadthing-token' },
       ],
       skipDuplicates: true,
     });
   
     return {
       isSetupComplete: true,
     };
   };
   ```

8. **Create seed index file**:
   ```typescript
   // tests/e2e/utils/database/seeds/index.ts
   export * from './basic.seed';
   export * from './dashboard.seed';
   export * from './setup.seed';
   ```

**Verification**: Run seeding scripts manually to ensure they work without errors.

## Task 2.4: Test Fixtures and Hooks

**Objective**: Create Playwright fixtures for automatic database seeding and cleanup.

**Steps**:

1. **Create fixtures directory**:
   ```bash
   mkdir -p tests/e2e/fixtures
   touch tests/e2e/fixtures/database.ts
   ```

2. **Create database fixtures**:
   ```typescript
   // tests/e2e/fixtures/database.ts
   import { test as base } from '@playwright/test';
   import { testPrisma, disconnectTestDatabase } from '../utils/database/client';
   import { cleanDatabase } from '../utils/database/cleanup';
   import {
     seedBasicData,
     seedDashboardData,
     seedSetupData,
     seedCompletedSetupData,
   } from '../utils/database/seeds';
   
   export interface DatabaseFixtures {
     cleanDatabase: () => Promise<void>;
     basicData: any;
     dashboardData: any;
     setupData: any;
     completedSetupData: any;
     db: typeof testPrisma;
   }
   
   export const test = base.extend<DatabaseFixtures>({
     // Clean database before each test
     cleanDatabase: async ({}, use) => {
       const cleanDB = async () => {
         await cleanDatabase();
       };
       
       await cleanDB(); // Clean before test
       await use(cleanDB);
       // Note: We don't clean after test to allow debugging failed tests
     },
   
     // Provide clean database with basic test data
     basicData: async ({ cleanDatabase }, use) => {
       await cleanDatabase();
       const data = await seedBasicData();
       await use(data);
     },
   
     // Provide database seeded for dashboard testing
     dashboardData: async ({ cleanDatabase }, use) => {
       await cleanDatabase();
       const data = await seedDashboardData();
       await use(data);
     },
   
     // Provide database for setup/onboarding testing
     setupData: async ({ cleanDatabase }, use) => {
       await cleanDatabase();
       const data = await seedSetupData();
       await use(data);
     },
   
     // Provide database with completed setup
     completedSetupData: async ({ cleanDatabase }, use) => {
       await cleanDatabase();
       const data = await seedCompletedSetupData();
       await use(data);
     },
   
     // Provide direct database access
     db: async ({}, use) => {
       await use(testPrisma);
     },
   });
   
   // Export expect from playwright/test
   export { expect } from '@playwright/test';
   ```

3. **Create authentication fixtures**:
   ```bash
   touch tests/e2e/fixtures/auth.ts
   ```

4. **Add authentication fixtures**:
   ```typescript
   // tests/e2e/fixtures/auth.ts
   import { test as base, Page } from '@playwright/test';
   import { test as dbTest } from './database';
   
   export interface AuthFixtures {
     authenticatedPage: Page;
     loginAsUser: (username: string, password: string) => Promise<void>;
   }
   
   export const test = dbTest.extend<AuthFixtures>({
     authenticatedPage: async ({ page, basicData }, use) => {
       // Login with the test user from basicData
       await page.goto('/signin');
       
       await page.fill('[name="username"]', basicData.user.username);
       await page.fill('[name="password"]', basicData.user.password);
       await page.click('[type="submit"]');
       
       // Wait for successful login (adjust selector based on your app)
       await page.waitForURL('/dashboard');
       
       await use(page);
     },
   
     loginAsUser: async ({ page }, use) => {
       const loginAsUser = async (username: string, password: string) => {
         await page.goto('/signin');
         await page.fill('[name="username"]', username);
         await page.fill('[name="password"]', password);
         await page.click('[type="submit"]');
         await page.waitForURL('/dashboard');
       };
       
       await use(loginAsUser);
     },
   });
   
   export { expect } from '@playwright/test';
   ```

5. **Create unified fixtures file**:
   ```bash
   touch tests/e2e/fixtures/index.ts
   ```

6. **Add fixtures index**:
   ```typescript
   // tests/e2e/fixtures/index.ts
   import { test as authTest } from './auth';
   import { test as dbTest } from './database';
   
   // Export the most comprehensive test (includes auth + database)
   export const test = authTest;
   export { expect } from '@playwright/test';
   
   // Export individual test types for specific use cases
   export { test as dbTest } from './database';
   export { test as authTest } from './auth';
   ```

**Verification**: Create a simple test using the fixtures to ensure they work correctly.

## Task 2.5: Test Configuration and Environment

**Objective**: Configure test-specific environment settings and database isolation.

**Steps**:

1. **Update test environment configuration**:
   ```bash
   # Add to .env.test
   echo "
   # Database isolation settings
   TEST_DATABASE_ISOLATION=true
   TEST_PARALLEL_WORKERS=1
   
   # Test data settings
   TEST_USER_PASSWORD=testPassword123!
   TEST_ADMIN_PASSWORD=adminPassword123!
   
   # Faker settings for consistent test data
   FAKER_SEED=12345
   " >> .env.test
   ```

2. **Create test configuration utilities**:
   ```bash
   touch tests/e2e/utils/config.ts
   ```

3. **Add configuration utilities**:
   ```typescript
   // tests/e2e/utils/config.ts
   import { faker } from '@faker-js/faker';
   
   // Set consistent seed for faker to ensure reproducible test data
   faker.seed(parseInt(process.env.FAKER_SEED || '12345'));
   
   export const testConfig = {
     database: {
       url: process.env.POSTGRES_PRISMA_URL!,
       nonPoolingUrl: process.env.POSTGRES_URL_NON_POOLING!,
       isolation: process.env.TEST_DATABASE_ISOLATION === 'true',
     },
     auth: {
       testUserPassword: process.env.TEST_USER_PASSWORD || 'testPassword123!',
       testAdminPassword: process.env.TEST_ADMIN_PASSWORD || 'adminPassword123!',
     },
     app: {
       baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
     },
     testing: {
       parallelWorkers: parseInt(process.env.TEST_PARALLEL_WORKERS || '1'),
       retryCount: process.env.CI ? 2 : 0,
     },
   };
   
   // Validate required environment variables
   export const validateTestConfig = () => {
     const required = [
       'POSTGRES_PRISMA_URL',
       'POSTGRES_URL_NON_POOLING',
     ];
   
     const missing = required.filter(key => !process.env[key]);
   
     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
     }
   };
   ```

4. **Update global setup to validate configuration**:
   ```typescript
   // Update tests/e2e/global-setup.ts
   import { chromium, FullConfig } from '@playwright/test';
   import { execSync } from 'child_process';
   import dotenv from 'dotenv';
   import { validateTestConfig } from './utils/config';
   import { verifyDatabaseConnection } from './utils/database/client';
   
   // Load test environment variables
   dotenv.config({ path: '.env.test' });
   
   async function globalSetup(config: FullConfig) {
     console.log('🚀 Starting global test setup...');
   
     // Validate configuration
     console.log('🔧 Validating test configuration...');
     try {
       validateTestConfig();
       console.log('✅ Test configuration valid');
     } catch (error) {
       console.error('❌ Test configuration invalid:', error);
       throw error;
     }
   
     // Setup test database
     console.log('📊 Setting up test database...');
     try {
       execSync('./scripts/test/setup-test-db.sh', { stdio: 'inherit' });
     } catch (error) {
       console.error('❌ Failed to setup test database:', error);
       throw error;
     }
   
     // Verify database connection
     console.log('🔌 Verifying database connection...');
     const isConnected = await verifyDatabaseConnection();
     if (!isConnected) {
       throw new Error('Failed to connect to test database');
     }
     console.log('✅ Database connection verified');
   
     console.log('✅ Global test setup complete!');
   }
   
   export default globalSetup;
   ```

5. **Update global teardown for proper cleanup**:
   ```typescript
   // Update tests/e2e/global-teardown.ts
   import { FullConfig } from '@playwright/test';
   import { execSync } from 'child_process';
   import { disconnectTestDatabase } from './utils/database/client';
   
   async function globalTeardown(config: FullConfig) {
     console.log('🧹 Starting global test teardown...');
   
     // Disconnect from test database
     console.log('🔌 Disconnecting from test database...');
     try {
       await disconnectTestDatabase();
       console.log('✅ Database disconnected');
     } catch (error) {
       console.error('⚠️  Database disconnect failed:', error);
     }
   
     // Cleanup test database
     console.log('📊 Cleaning up test database...');
     try {
       execSync('./scripts/test/teardown-test-db.sh', { stdio: 'inherit' });
     } catch (error) {
       console.error('⚠️  Database cleanup failed:', error);
     }
   
     console.log('✅ Global test teardown complete!');
   }
   
   export default globalTeardown;
   ```

**Verification**: Run the global setup and teardown scripts to ensure they work properly.

## Task 2.6: Sample Test Implementation

**Objective**: Create sample tests that demonstrate the database seeding and fixture usage.

**Steps**:

1. **Create sample database test**:
   ```bash
   touch tests/e2e/database.sample.spec.ts
   ```

2. **Add sample test implementation**:
   ```typescript
   // tests/e2e/database.sample.spec.ts
   import { test, expect } from './fixtures';
   
   test.describe('Database Seeding Tests', () => {
     test('should seed basic data correctly', async ({ basicData, db }) => {
       // Verify user was created
       expect(basicData.user).toBeDefined();
       expect(basicData.user.username).toBe('testuser');
   
       // Verify protocols were created
       expect(basicData.protocols).toHaveLength(2);
       expect(basicData.protocols[0].name).toBe('Test Protocol 1');
   
       // Verify participants were created
       expect(basicData.participants).toHaveLength(5);
   
       // Verify interviews were created
       expect(basicData.interviews).toHaveLength(5);
   
       // Verify data exists in database
       const userCount = await db.user.count();
       expect(userCount).toBe(1);
   
       const protocolCount = await db.protocol.count();
       expect(protocolCount).toBe(2);
   
       const participantCount = await db.participant.count();
       expect(participantCount).toBe(5);
   
       const interviewCount = await db.interview.count();
       expect(interviewCount).toBe(5);
     });
   
     test('should seed dashboard data correctly', async ({ dashboardData, db }) => {
       // Verify comprehensive data was created
       expect(dashboardData.user.username).toBe('admin');
       expect(dashboardData.protocols.length).toBeGreaterThan(5);
       expect(dashboardData.participants).toHaveLength(50);
       expect(dashboardData.interviews.length).toBeGreaterThan(20);
   
       // Verify some interviews are finished
       const finishedInterviews = await db.interview.count({
         where: { finishTime: { not: null } },
       });
       expect(finishedInterviews).toBeGreaterThan(0);
     });
   
     test('should handle clean database fixture', async ({ cleanDatabase, db }) => {
       // Database should be clean
       const userCount = await db.user.count();
       const protocolCount = await db.protocol.count();
       const participantCount = await db.participant.count();
       const interviewCount = await db.interview.count();
   
       expect(userCount).toBe(0);
       expect(protocolCount).toBe(0);
       expect(participantCount).toBe(0);
       expect(interviewCount).toBe(0);
   
       // App settings should still exist
       const settingsCount = await db.appSettings.count();
       expect(settingsCount).toBeGreaterThan(0);
     });
   
     test('should isolate tests from each other', async ({ basicData, db }) => {
       // This test should have fresh basicData, not affected by previous tests
       const protocolCount = await db.protocol.count();
       expect(protocolCount).toBe(2); // Only the protocols from basicData
     });
   });
   ```

3. **Create authenticated test sample**:
   ```bash
   touch tests/e2e/auth.sample.spec.ts
   ```

4. **Add authenticated test sample**:
   ```typescript
   // tests/e2e/auth.sample.spec.ts
   import { test, expect } from './fixtures';
   
   test.describe('Authentication Tests', () => {
     test('should login and access dashboard with authenticatedPage', async ({ authenticatedPage }) => {
       // Should already be logged in and on dashboard
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard/);
       
       // Should see dashboard content
       await expect(authenticatedPage.locator('h1')).toContainText('Dashboard');
     });
   
     test('should allow manual login with loginAsUser', async ({ page, loginAsUser, basicData }) => {
       // Manually login using the fixture
       await loginAsUser(basicData.user.username, basicData.user.password);
       
       // Should be on dashboard
       await expect(page).toHaveURL(/.*\/dashboard/);
     });
   
     test('should handle logout', async ({ authenticatedPage }) => {
       // Find and click logout button (adjust selector for your app)
       await authenticatedPage.click('[data-testid="logout-button"]');
       
       // Should redirect to signin
       await expect(authenticatedPage).toHaveURL(/.*\/signin/);
     });
   });
   ```

**Verification**: Run `npm run test:e2e database.sample.spec.ts` to verify the sample tests pass.

## Phase 2 Completion Checklist

- [ ] Test database client configuration created
- [ ] Database cleanup utilities implemented
- [ ] Test data factories for all major entities created
- [ ] Comprehensive seeding scripts for different scenarios
- [ ] Playwright fixtures for database and auth setup
- [ ] Test environment configuration validated
- [ ] Sample tests demonstrating fixture usage
- [ ] Global setup and teardown properly handling database lifecycle
- [ ] All database tests passing
- [ ] Documentation updated with seeding patterns

## Next Steps

After completing Phase 2, you should have:
- Robust database seeding and cleanup infrastructure
- Reliable test data factories
- Proper test isolation between tests
- Foundation for testing complex user flows

Proceed to **PHASE-3.md** for authentication helpers and core test utilities.