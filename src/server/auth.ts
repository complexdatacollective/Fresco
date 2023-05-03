import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "~/server/db";
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from "bcrypt";

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return compare(password, hashedPassword);
}

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
// declare module "next-auth" {
//   interface Session extends DefaultSession {
//     user: {
//       id: string;
//       name: string;
//       email: string;
//     } & DefaultSession["user"];
//   }
// }

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt(params) {
      return params.token;
    },
    session: ({ session, token, }) => {
      console.log('session', session);
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        }
      }
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Username and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@networkcanvas.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Reject if no email or password
        if (!credentials?.email || !credentials?.password) {
          console.log('no credentials');
          return null
        }

        // Check if user exists in db
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          }
        })

        if (!user) {
          console.log('no user found!');
          return null
        }

        if (!user.password) {
          console.log('no password found!');
          return null
        }

        // Verify password against hashed password
        const isPasswordValid = await verifyPassword(credentials.password, user.password);

        if (!isPasswordValid) {
          return null
        }

        console.log('Successfully authenticated', user);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }

      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
