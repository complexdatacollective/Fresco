import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@codaco/api";

export const trpc = createTRPCReact<AppRouter>();