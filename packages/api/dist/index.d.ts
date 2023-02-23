import * as _trpc_server from '@trpc/server';
import * as superjson from 'superjson';
import * as _trpc_server_dist_rpc from '@trpc/server/dist/rpc';
import * as _codaco_database from '@codaco/database';
import { z } from 'zod';

declare const appRouter: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
    ctx: {
        prisma: _codaco_database.PrismaClient<{
            log: ("query" | "warn" | "error")[];
        }, never, false>;
    };
    meta: object;
    errorShape: {
        data: {
            zodError: z.typeToFlattenedError<any, string> | null;
            code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
            httpStatus: number;
            path?: string | undefined;
            stack?: string | undefined;
        };
        message: string;
        code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
    };
    transformer: typeof superjson.default;
}>, {
    user: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
        ctx: {
            prisma: _codaco_database.PrismaClient<{
                log: ("query" | "warn" | "error")[];
            }, never, false>;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: z.typeToFlattenedError<any, string> | null;
                code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
                httpStatus: number;
                path?: string | undefined;
                stack?: string | undefined;
            };
            message: string;
            code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
        };
        transformer: typeof superjson.default;
    }>, {
        all: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _codaco_database.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: z.typeToFlattenedError<any, string> | null;
                        code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
                        httpStatus: number;
                        path?: string | undefined;
                        stack?: string | undefined;
                    };
                    message: string;
                    code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
                };
                transformer: typeof superjson.default;
            }>;
            _ctx_out: {
                prisma: _codaco_database.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: typeof _trpc_server.unsetMarker;
            _input_out: typeof _trpc_server.unsetMarker;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
            _meta: object;
        }, _codaco_database.User[]>;
        byId: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _codaco_database.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: z.typeToFlattenedError<any, string> | null;
                        code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
                        httpStatus: number;
                        path?: string | undefined;
                        stack?: string | undefined;
                    };
                    message: string;
                    code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
                };
                transformer: typeof superjson.default;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: _codaco_database.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: string;
            _input_out: string;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _codaco_database.User | null>;
        create: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _codaco_database.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: z.typeToFlattenedError<any, string> | null;
                        code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
                        httpStatus: number;
                        path?: string | undefined;
                        stack?: string | undefined;
                    };
                    message: string;
                    code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
                };
                transformer: typeof superjson.default;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: _codaco_database.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: {
                name: string;
                email: string;
            };
            _input_out: {
                name: string;
                email: string;
            };
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _codaco_database.User>;
        delete: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _codaco_database.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: z.typeToFlattenedError<any, string> | null;
                        code: "PARSE_ERROR" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "CONFLICT" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "TOO_MANY_REQUESTS" | "CLIENT_CLOSED_REQUEST";
                        httpStatus: number;
                        path?: string | undefined;
                        stack?: string | undefined;
                    };
                    message: string;
                    code: _trpc_server_dist_rpc.TRPC_ERROR_CODE_NUMBER;
                };
                transformer: typeof superjson.default;
            }>;
            _meta: object;
            _ctx_out: {
                prisma: _codaco_database.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: string;
            _input_out: string;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _codaco_database.User>;
    }>;
}>;
type AppRouter = typeof appRouter;

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
declare const createTRPCContext: () => Promise<{
    prisma: _codaco_database.PrismaClient<{
        log: ("query" | "warn" | "error")[];
    }, never, false>;
}>;

export { AppRouter, appRouter, createTRPCContext };
