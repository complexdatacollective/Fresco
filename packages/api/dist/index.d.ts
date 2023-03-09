import * as _trpc_server from '@trpc/server';
import * as superjson from 'superjson';
import * as _trpc_server_dist_rpc from '@trpc/server/dist/rpc';
import * as zod from 'zod';
import * as _prisma_client from '.prisma/client';

declare const appRouter: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
    ctx: {
        prisma: _prisma_client.PrismaClient<{
            log: ("query" | "warn" | "error")[];
        }, never, false>;
    };
    meta: object;
    errorShape: {
        data: {
            zodError: zod.typeToFlattenedError<any, string> | null;
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
            prisma: _prisma_client.PrismaClient<{
                log: ("query" | "warn" | "error")[];
            }, never, false>;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: zod.typeToFlattenedError<any, string> | null;
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
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: typeof _trpc_server.unsetMarker;
            _input_out: typeof _trpc_server.unsetMarker;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
            _meta: object;
        }, _prisma_client.User[]>;
        byId: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: number;
            _input_out: number;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.User | null>;
        create: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
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
        }, _prisma_client.User>;
        delete: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: number;
            _input_out: number;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.User>;
    }>;
    protocols: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
        ctx: {
            prisma: _prisma_client.PrismaClient<{
                log: ("query" | "warn" | "error")[];
            }, never, false>;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: zod.typeToFlattenedError<any, string> | null;
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
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: typeof _trpc_server.unsetMarker;
            _input_out: typeof _trpc_server.unsetMarker;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
            _meta: object;
        }, _prisma_client.Protocol[]>;
        byId: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: number;
            _input_out: number;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.Protocol | null>;
        byHash: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: string;
            _input_out: string;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.Protocol | null>;
    }>;
    interviews: _trpc_server.CreateRouterInner<_trpc_server.RootConfig<{
        ctx: {
            prisma: _prisma_client.PrismaClient<{
                log: ("query" | "warn" | "error")[];
            }, never, false>;
        };
        meta: object;
        errorShape: {
            data: {
                zodError: zod.typeToFlattenedError<any, string> | null;
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
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: {
                orderBy?: {
                    id: "asc" | "desc";
                    createdAt: "asc" | "desc";
                    updatedAt: "asc" | "desc";
                } | undefined;
                skip?: number | undefined;
                take?: number | undefined;
            } | undefined;
            _input_out: {
                orderBy?: {
                    id: "asc" | "desc";
                    createdAt: "asc" | "desc";
                    updatedAt: "asc" | "desc";
                } | undefined;
                skip?: number | undefined;
                take?: number | undefined;
            } | undefined;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, (_prisma_client.Interview & {
            protocol: {
                name: string;
            };
        })[]>;
        get: _trpc_server.BuildProcedure<"query", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: number;
            _input_out: number;
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.Interview | null>;
        create: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: {
                protocol: string;
                caseId: string;
            };
            _input_out: {
                protocol: string;
                caseId: string;
            };
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.Interview>;
        updateNetwork: _trpc_server.BuildProcedure<"mutation", {
            _config: _trpc_server.RootConfig<{
                ctx: {
                    prisma: _prisma_client.PrismaClient<{
                        log: ("query" | "warn" | "error")[];
                    }, never, false>;
                };
                meta: object;
                errorShape: {
                    data: {
                        zodError: zod.typeToFlattenedError<any, string> | null;
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
                prisma: _prisma_client.PrismaClient<{
                    log: ("query" | "warn" | "error")[];
                }, never, false>;
            };
            _input_in: {
                id: number;
                network: string;
            };
            _input_out: {
                id: number;
                network: string;
            };
            _output_in: typeof _trpc_server.unsetMarker;
            _output_out: typeof _trpc_server.unsetMarker;
        }, _prisma_client.Interview>;
    }>;
}>;
type AppRouter = typeof appRouter;

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
declare const createTRPCContext: () => Promise<{
    prisma: _prisma_client.PrismaClient<{
        log: ("query" | "warn" | "error")[];
    }, never, false>;
}>;

export { AppRouter, appRouter, createTRPCContext };
