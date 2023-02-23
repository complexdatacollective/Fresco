"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPrismaCommand = exports.prisma = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const client_1 = require("@prisma/client");
const constants_1 = require("./constants");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
electron_log_1.default.info("DB URL:", constants_1.dbUrl);
electron_log_1.default.info("Query Engine Path:", constants_1.qePath);
electron_log_1.default.info("Migration Engine Path:", constants_1.mePath);
exports.prisma = new client_1.PrismaClient({
    log: ['info', 'warn', 'error',
        //     {
        //     emit: "event",
        //     level: "query",
        // },
    ],
    datasources: {
        db: {
            url: constants_1.dbUrl
        }
    },
    // see https://github.com/prisma/prisma/discussions/5200
    // @ts-expect-error internal prop
    __internal: {
        engine: {
            binaryPath: constants_1.qePath
        }
    }
});
async function runPrismaCommand({ command, dbUrl }) {
    // Currently we don't have any direct method to invoke prisma migration programatically.
    // As a workaround, we spawn migration script as a child process and wait for its completion.
    // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703
    try {
        const exitCode = await new Promise((resolve, _) => {
            const prismaPath = path_1.default.resolve(__dirname, "..", "..", "node_modules/prisma/build/index.js");
            electron_log_1.default.info("Prisma path", prismaPath);
            const child = (0, child_process_1.fork)(prismaPath, command, {
                env: {
                    ...process.env,
                    DATABASE_URL: dbUrl,
                    PRISMA_MIGRATION_ENGINE_BINARY: constants_1.mePath,
                    PRISMA_QUERY_ENGINE_LIBRARY: constants_1.qePath,
                    // Prisma apparently needs a valid path for the format and introspection binaries, even though
                    // we don't use them. So we just point them to the query engine binary. Otherwise, we get
                    // prisma:  Error: ENOTDIR: not a directory, unlink '/some/path/electron-prisma-trpc-example/packed/mac-arm64/ElectronPrismaTrpcExample.app/Contents/Resources/app.asar/node_modules/@prisma/engines/prisma-fmt-darwin-arm64'
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
            child.stdout?.on('data', function (data) {
                electron_log_1.default.info("prisma: ", data.toString());
            });
            child.stderr?.on('data', function (data) {
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
//# sourceMappingURL=prisma.js.map