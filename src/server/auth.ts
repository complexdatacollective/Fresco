import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from "bcrypt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    } & DefaultSession["user"];
  }
}

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
    session: ({ session, token }) => {
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
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@networkcanvas.com" },
        password: { label: "Password", type: "password"},
      },
      async authorize(credentials) {

        // Authentication: find user using provided credentials
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // first, check if user exists
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          }
        })

        if (!user) {
          return null
        }
        // next, check if password provided matches user's password in db
        if(!user.password) {
          return null
        }

        // need to check encrypted password using bcrypt compare
        // for now, directly checking pw
        
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          return null
        }

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
