"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@codaco/api");
const main_1 = require("electron-trpc/main");
const electron_1 = require("electron");
const node_path_1 = require("node:path");
const waitForServerUp_1 = __importDefault(require("../utils/waitForServerUp"));
const isProduction = process.env.NODE_ENV === "production";
console.log("isProduction", isProduction);
const FRONTEND_PROD_PATH = (0, node_path_1.join)(__dirname, "../renderer/");
const FRONTEND_DEV_PATH = 'http://localhost:3000/';
const createWindow = async () => {
    // await handleMigrations();
    // The Vite build of the client code uses src URLs like "/assets/main.1234.js" and we need to
    // intercept those requests and serve the files from the dist folder.
    electron_1.protocol.interceptFileProtocol("file", (request, callback) => {
        const parsedUrl = (0, node_path_1.parse)(request.url);
        if (parsedUrl.dir.includes("assets")) {
            const webAssetPath = (0, node_path_1.join)(__dirname, "..", "assets", parsedUrl.base);
            callback({ path: webAssetPath });
        }
        else {
            callback({ url: request.url });
        }
    });
    const win = new electron_1.BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            preload: (0, node_path_1.join)(__dirname, 'preload.js'),
            allowRunningInsecureContent: false,
            enableBlinkFeatures: "",
            experimentalFeatures: false,
            nodeIntegration: false,
            contextIsolation: true,
            // prefer exposing a method via contextBridge before turning off the sandbox. https://www.electronjs.org/docs/latest/api/context-bridge
            // https://www.electronjs.org/docs/latest/tutorial/context-isolation#security-considerations
            sandbox: true,
            webSecurity: true,
            webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        },
    });
    // Initialise electron-trpc
    (0, main_1.createIPCHandler)({
        createContext: api_1.createTRPCContext,
        router: api_1.appRouter,
        windows: [win]
    });
    if (isProduction) {
        // load bundled React app
        win.loadFile((0, node_path_1.join)(FRONTEND_PROD_PATH, "index.html"));
    }
    else {
        // show loading spinner while local server is ready
        win.loadFile((0, node_path_1.join)(__dirname, "../renderer/loading.html"));
        await (0, waitForServerUp_1.default)(FRONTEND_DEV_PATH);
        // load locally served React app in dev mode
        win.loadURL(FRONTEND_DEV_PATH);
        // Open the DevTools.
        win.webContents.openDevTools();
    }
};
electron_1.app.whenReady().then(() => {
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
//# sourceMappingURL=main.js.map