import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@codaco/api";
import { createTRPCProxyClient, getFetch, httpBatchLink, httpLink, loggerLink } from '@trpc/client'
import superjson from "superjson";
import { ipcLink } from 'electron-trpc/renderer';

export const trpc = createTRPCReact<AppRouter>();