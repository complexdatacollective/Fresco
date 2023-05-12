import NextAuth from "next-auth";
import { authOptions } from "~/utils/auth";

const handler = NextAuth(authOptions) as Response;
export { handler as GET, handler as POST };
