"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
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

// src/root.ts
var import_zod2 = require("zod");

// src/trpc.ts
var import_server = require("@trpc/server");
var import_zod = require("zod");
var import_database = require("@codaco/database");
var import_superjson = __toESM(require("superjson"));
var createTRPCContext = /* @__PURE__ */ __name(async () => {
  return {
    prisma: import_database.prisma
  };
}, "createTRPCContext");
var t = import_server.initTRPC.context().create({
  isServer: true,
  transformer: import_superjson.default,
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

// src/root.ts
var userRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({
      orderBy: {
        id: "desc"
      }
    });
  }),
  byId: publicProcedure.input(import_zod2.z.string()).query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({
      where: {
        id: input
      }
    });
  }),
  create: publicProcedure.input(import_zod2.z.object({
    name: import_zod2.z.string().min(1),
    email: import_zod2.z.string().min(1)
  })).mutation(({ ctx, input }) => {
    return ctx.prisma.user.create({
      data: input
    });
  }),
  delete: publicProcedure.input(import_zod2.z.string()).mutation(({ ctx, input }) => {
    return ctx.prisma.user.delete({
      where: {
        id: input
      }
    });
  })
});
var appRouter = createTRPCRouter({
  user: userRouter
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appRouter,
  createTRPCContext
});
//# sourceMappingURL=index.js.map