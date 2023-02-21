"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const database_1 = require("database");
exports.prisma = global.prisma || new database_1.PrismaClient({ log: ['query', 'info'] });
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
async function connectDB() {
    try {
        await exports.prisma.$connect();
        console.log('🚀 Database connected successfully');
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
    finally {
        await exports.prisma.$disconnect();
    }
}
exports.default = connectDB;
