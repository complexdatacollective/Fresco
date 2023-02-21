"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./router");
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const ipcRequestHandler_1 = require("./ipcRequestHandler");
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("./constants");
const electron_log_1 = __importDefault(require("electron-log"));
const prisma_1 = require("./prisma");
const createWindow = async () => {
    var _a;
    let needsMigration;
    const dbExists = fs_1.default.existsSync(constants_1.dbPath);
    if (!dbExists) {
        needsMigration = true;
        fs_1.default.closeSync(fs_1.default.openSync(constants_1.dbPath, 'w'));
    }
    else {
        try {
            const latest = await prisma_1.prisma.$queryRaw `select * from _prisma_migrations order by finished_at`;
            needsMigration = ((_a = latest[latest.length - 1]) === null || _a === void 0 ? void 0 : _a.migration_name) !== constants_1.latestMigration;
        }
        catch (e) {
            electron_log_1.default.error(e);
            needsMigration = true;
        }
    }
    if (needsMigration) {
        try {
            const schemaPath = path_1.default.join(electron_1.app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'prisma', "schema.prisma");
            electron_log_1.default.info(`Needs a migration. Running prisma migrate with schema path ${schemaPath}`);
            await (0, prisma_1.runPrismaCommand)({
                command: ["migrate", "deploy", "--schema", schemaPath],
                dbUrl: constants_1.dbUrl
            });
            electron_log_1.default.info("Migration done.");
        }
        catch (e) {
            electron_log_1.default.error(e);
            process.exit(1);
        }
    }
    else {
        electron_log_1.default.info("Does not need migration");
    }
    electron_1.protocol.interceptFileProtocol("file", (request, callback) => {
        const parsedUrl = path_1.default.parse(request.url);
        if (parsedUrl.dir.includes("assets")) {
            const webAssetPath = path_1.default.join(__dirname, "..", "assets", parsedUrl.base);
            callback({ path: webAssetPath });
        }
        else {
            callback({ url: request.url });
        }
    });
    const win = new electron_1.BrowserWindow({
        width: 1024,
        height: 1024,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile(path_1.default.join(__dirname, '..', 'index.html'));
    win.webContents.openDevTools();
};
electron_1.app.whenReady().then(() => {
    electron_1.ipcMain.handle('trpc', (event, req) => {
        return (0, ipcRequestHandler_1.ipcRequestHandler)({
            endpoint: "/trpc",
            req,
            router: router_1.appRouter,
            createContext: async () => {
                return {};
            }
        });
    });
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
