"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const constants_1 = require("./constants");
const prisma_1 = require("./prisma");
const electron_log_1 = __importDefault(require("electron-log"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const handleMigrations = async () => {
    let needsMigration;
    const dbExists = (0, node_fs_1.existsSync)(constants_1.dbPath);
    if (!dbExists) {
        needsMigration = true;
        // prisma for whatever reason has trouble if the database file does not exist yet.
        // So just touch it here
        (0, node_fs_1.closeSync)((0, node_fs_1.openSync)(constants_1.dbPath, 'w'));
    }
    else {
        try {
            const latest = await prisma_1.prisma.$queryRaw `select * from _prisma_migrations order by finished_at`;
            needsMigration = latest[latest.length - 1]?.migration_name !== constants_1.latestMigration;
        }
        catch (e) {
            electron_log_1.default.error(e);
            needsMigration = true;
        }
    }
    if (needsMigration) {
        try {
            const schemaPath = (0, node_path_1.join)(electron_1.app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'prisma', "schema.prisma");
            electron_log_1.default.info(`Needs a migration. Running prisma migrate with schema path ${schemaPath}`);
            // first create or migrate the database! If you were deploying prisma to a cloud service, this migrate deploy
            // command you would run as part of your CI/CD deployment. Since this is an electron app, it just needs
            // to run every time the production app is started. That way if the user updates the app and the schema has
            // changed, it will transparently migrate their DB.
            await (0, prisma_1.runPrismaCommand)({
                command: ["migrate", "deploy", "--schema", schemaPath],
                dbUrl: constants_1.dbUrl
            });
            electron_log_1.default.info("Migration done.");
            // seed
            // log.info("Seeding...");
            // await seed(prisma);
        }
        catch (e) {
            electron_log_1.default.error(e);
            process.exit(1);
        }
    }
    else {
        electron_log_1.default.info("Does not need migration");
    }
};
exports.default = handleMigrations;
//# sourceMappingURL=handleMigrations.js.map