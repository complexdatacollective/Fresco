import { faker } from '@faker-js/faker';
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma';
import { type User } from '@prisma/client';
import { lucia } from 'lucia';
import { node } from 'lucia/middleware';
import { prisma } from '~/utils/db';

const auth = lucia({
  // eslint-disable-next-line no-process-env
  env: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
  middleware: node(),
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (data: User) => {
    return {
      username: data.username,
    };
  },
  adapter: prismaAdapter(prisma),
});

export type TestUser = {
  username: string;
  password: string; // Plain text for testing
};

type CreateUserOptions = {
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
    options.username ??
    `${faker.internet.username().toLowerCase()}-${Date.now()}`;
  const password = options.password ?? 'testPassword123!';

  const user = await auth.createUser({
    key: {
      providerId: 'username', // auth method
      providerUserId: username, // unique id when using "username" auth method
      password, // hashed by Lucia
    },
    attributes: {
      username,
    },
  });

  return {
    username: user.username,
    password, // Return plain text password for testing
  };
};

