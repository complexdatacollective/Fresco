"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var api_exports = {};
__export(api_exports, {
  appRouter: () => appRouter,
  createTRPCContext: () => createTRPCContext
});
module.exports = __toCommonJS(api_exports);

// src/trpc.ts
var import_server = require("@trpc/server");
var import_zod = require("zod");
var import_database = require("@codaco/database");
var import_superjson = __toESM(require("superjson"));
var createTRPCContext = async () => {
  return {
    prisma: import_database.prisma
  };
};
var t = import_server.initTRPC.context().create({
  isServer: true,
  transformer: import_superjson.default,
  // Allows more types in JSON: https://github.com/blitz-js/superjson
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof import_zod.ZodError ? error.cause.flatten() : null
      }
    };
  }
});
var createTRPCRouter = t.router;
var publicProcedure = t.procedure;

// src/routers/user.ts
var import_zod2 = require("zod");
var userRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(import_zod2.z.number()).query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({ where: { id: input } });
  }),
  create: publicProcedure.input(import_zod2.z.object({ name: import_zod2.z.string().min(1), email: import_zod2.z.string().min(1) })).mutation(({ ctx, input }) => {
    return ctx.prisma.user.create({ data: input });
  }),
  delete: publicProcedure.input(import_zod2.z.number()).mutation(({ ctx, input }) => {
    return ctx.prisma.user.delete({ where: { id: input } });
  })
});

// src/routers/protocols.ts
var import_zod3 = require("zod");
var protocolsRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.protocol.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(import_zod3.z.number()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { id: input } });
  }),
  byHash: publicProcedure.input(import_zod3.z.string()).query(({ ctx, input }) => {
    return ctx.prisma.protocol.findFirst({ where: { hash: input } });
  })
});

// src/root.ts
var appRouter = createTRPCRouter({
  user: userRouter,
  protocols: protocolsRouter
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appRouter,
  createTRPCContext
});
//# sourceMappingURL=index.js.map