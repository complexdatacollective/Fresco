import { getServerSession, type NextAuthOptions } from 'next-auth';
import { prisma } from '~/utils/db';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { z } from 'zod';
import { safeLoader } from '~/utils/safeLoader';

const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return compare(password, hashedPassword);
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt(params) {
      const { token, user } = params;

      if (user) {
        token.id = user.id;
      }

      return token;
    },
    session: ({ session, token }) => {
      // console.log('session callback', session, token);
      return {
        expires: session.expires,
        user: {
          id: token.id,
          name: token.name,
          email: token.email,
        },
      };
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Username and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'user@networkcanvas.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Reject if no email or password
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check if user exists in db
        const user = await safeLoader({
          outputValidation: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            password: z.string(),
          }),
          loader: () =>
            prisma.user.findUnique({
              where: {
                email: credentials.email,
              },
              select: {
                id: true,
                email: true,
                password: true,
              },
            }),
        });

        if (!user) {
          console.log('no user found!');
          return null;
        }

        if (!user.password) {
          console.log('no password found!');
          return null;
        }

        // Verify password against hashed password
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        };
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
