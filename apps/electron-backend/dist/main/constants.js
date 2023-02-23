"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qePath = exports.mePath = exports.platformToExecutables = exports.latestMigration = exports.dbUrl = exports.dbPath = exports.isDev = void 0;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
exports.isDev = process.env.NODE_ENV === "development";
exports.dbPath = path_1.default.join(electron_1.app.getPath('userData'), "app.db");
exports.dbUrl = exports.isDev ? process.env.DATABASE_URL : "file:" + exports.dbPath;
// Hacky, but putting this here because otherwise at query time the Prisma client
// gives an error "Environment variable not found: DATABASE_URL" despite us passing
// the dbUrl into the prisma client constructor in datasources.db.url
process.env.DATABASE_URL = exports.dbUrl;
// This needs to be updated every time you create a migration!
exports.latestMigration = "20221005221528_init";
exports.platformToExecutables = {
    win32: {
        migrationEngine: 'node_modules/@prisma/engines/migration-engine-windows.exe',
        queryEngine: 'node_modules/@prisma/engines/query_engine-windows.dll.node',
    },
    linux: {
        migrationEngine: 'node_modules/@prisma/engines/migration-engine-debian-openssl-1.1.x',
        queryEngine: 'node_modules/@prisma/engines/libquery_engine-debian-openssl-1.1.x.so.node'
    },
    darwin: {
        migrationEngine: 'node_modules/@prisma/engines/migration-engine-darwin',
        queryEngine: 'node_modules/@prisma/engines/libquery_engine-darwin.dylib.node'
    },
    darwinArm64: {
        migrationEngine: 'node_modules/@prisma/engines/migration-engine-darwin-arm64',
        queryEngine: 'node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node',
    }
};
const extraResourcesPath = electron_1.app.getAppPath().replace('app.asar', ''); // impacted by extraResources setting in electron-builder.yml
function getPlatformName() {
    const isDarwin = process.platform === "darwin";
    if (isDarwin && process.arch === "arm64") {
        return process.platform + "Arm64";
    }
    return process.platform;
}
const platformName = getPlatformName();
exports.mePath = path_1.default.join(extraResourcesPath, exports.platformToExecutables[platformName].migrationEngine);
exports.qePath = path_1.default.join(extraResourcesPath, exports.platformToExecutables[platformName].queryEngine);
//# sourceMappingURL=constants.js.map