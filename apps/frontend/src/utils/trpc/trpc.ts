import type { AppRouter } from "@codaco/api";
import { createTRPCReact } from "@trpc/react-query";

export const trpcReact = createTRPCReact<AppRouter>();