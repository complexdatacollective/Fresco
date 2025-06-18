import { faker } from '@faker-js/faker';
import { hash } from '@node-rs/argon2';
import { prisma } from '~/utils/db';

export type TestUser = {
  id: string;
  username: string;
  password: string; // Plain text for testing
};

export type CreateUserOptions = {
  username?: string;
  password?: string;
};

/**
 * Create a test user with authentication keys
 */
export const createTestUser = async (
  options: CreateUserOptions = {},
): Promise<TestUser> => {
  const username =
    options.username ||
    `${faker.internet.username().toLowerCase()}-${Date.now()}`;
  const password = options.password || 'testPassword123!';
  const hashedPassword = await hash(password);

  const user = await prisma.user.create({
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
