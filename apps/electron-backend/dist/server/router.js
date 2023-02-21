"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const server_1 = require("@trpc/server");
const prisma_1 = require("./prisma");
const superjson_1 = __importDefault(require("superjson"));
const zod_1 = require("zod");
const t = server_1.initTRPC.create({
    transformer: superjson_1.default
});
exports.appRouter = t.router({
    users: t.procedure
        .query(() => {
        return prisma_1.prisma.user.findMany();
    }),
    userById: t.procedure
        .input((val) => {
        if (typeof val !== 'number') {
            throw new Error('invalid input');
        }
        return val;
    })
        .query(({ input: id }) => {
        return prisma_1.prisma.user.findUnique({
            where: {
                id,
            }
        });
    }),
    userCreate: t.procedure
        .input(zod_1.z.object({
        name: zod_1.z.string(),
        dateCreated: zod_1.z.date(),
    }))
        .mutation(async ({ input: { name, dateCreated } }) => {
        console.log("Creating user on ", dateCreated.toLocaleString());
        const user = await prisma_1.prisma.user.create({
            data: {
                name
            }
        });
        return user;
    })
});
