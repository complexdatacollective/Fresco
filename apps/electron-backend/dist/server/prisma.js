"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPrismaCommand = exports.prisma = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const client_1 = require("../generated/client");
const constants_1 = require("./constants");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
electron_log_1.default.info("DB URL", constants_1.dbUrl);
electron_log_1.default.info("QE Path", constants_1.qePath);
exports.prisma = new client_1.PrismaClient({
    log: ['info', 'warn', 'error',
    ],
    datasources: {
        db: {
            url: constants_1.dbUrl
        }
    },
    __internal: {
        engine: {
            binaryPath: constants_1.qePath
        }
    }
});
async function runPrismaCommand({ command, dbUrl }) {
    electron_log_1.default.info("Migration engine path", constants_1.mePath);
    electron_log_1.default.info("Query engine path", constants_1.qePath);
    try {
        const exitCode = await new Promise((resolve, _) => {
            var _a, _b;
            const prismaPath = path_1.default.resolve(__dirname, "..", "..", "node_modules/prisma/build/index.js");
            electron_log_1.default.info("Prisma path", prismaPath);
            const child = (0, child_process_1.fork)(prismaPath, command, {
                env: {
                    ...process.env,
                    DATABASE_URL: dbUrl,
                    PRISMA_MIGRATION_ENGINE_BINARY: constants_1.mePath,
                    PRISMA_QUERY_ENGINE_LIBRARY: constants_1.qePath,
                    PRISMA_FMT_BINARY: constants_1.qePath,
                    PRISMA_INTROSPECTION_ENGINE_BINARY: constants_1.qePath
                },
                stdio: "pipe"
            });
            child.on("message", msg => {
                electron_log_1.default.info(msg);
            });
            child.on("error", err => {
                electron_log_1.default.error("Child process got error:", err);
            });
            child.on("close", (code, signal) => {
                resolve(code);
            });
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                electron_log_1.default.info("prisma: ", data.toString());
            });
            (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                electron_log_1.default.error("prisma: ", data.toString());
            });
        });
        if (exitCode !== 0)
            throw Error(`command ${command} failed with exit code ${exitCode}`);
        return exitCode;
    }
    catch (e) {
        electron_log_1.default.error(e);
        throw e;
    }
}
exports.runPrismaCommand = runPrismaCommand;
