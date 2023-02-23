import { appRouter, createTRPCContext } from "@codaco/api";
import { createIPCHandler } from 'electron-trpc/main';
import { app, BrowserWindow, protocol } from 'electron';
import { parse, join } from "node:path";
import handleMigrations from "./handleMigrations";
import waitForServerUp from '../utils/waitForServerUp';

const isProduction = process.env.NODE_ENV === "production";
console.log("isProduction", isProduction);
const FRONTEND_PROD_PATH = join(__dirname, "../renderer/");
const FRONTEND_DEV_PATH = 'http://localhost:3000/';

const createWindow = async () => {

  // await handleMigrations();

  // The Vite build of the client code uses src URLs like "/assets/main.1234.js" and we need to
  // intercept those requests and serve the files from the dist folder.
  protocol.interceptFileProtocol("file", (request, callback) => {
    const parsedUrl = parse(request.url);

    if (parsedUrl.dir.includes("assets")) {
      const webAssetPath = join(__dirname, "..", "assets", parsedUrl.base);
      callback({ path: webAssetPath })
    } else {
      callback({ url: request.url });
    }
  });

  const win = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      allowRunningInsecureContent: false, // https://www.electronjs.org/docs/latest/tutorial/security#8-do-not-enable-allowrunninginsecurecontent
      enableBlinkFeatures: "", // https://www.electronjs.org/docs/latest/tutorial/security#10-do-not-use-enableblinkfeatures
      experimentalFeatures: false, // https://www.electronjs.org/docs/latest/tutorial/security#9-do-not-enable-experimental-features
      nodeIntegration: false,
      contextIsolation: true,
      // prefer exposing a method via contextBridge before turning off the sandbox. https://www.electronjs.org/docs/latest/api/context-bridge
      // https://www.electronjs.org/docs/latest/tutorial/context-isolation#security-considerations
      sandbox: true, // enable when using Node.js api in the preload script like https://github.com/cawa-93/vite-electron-builder/tree/main/packages/preload/src
      webSecurity: true, // https://www.electronjs.org/docs/latest/tutorial/security#6-do-not-disable-websecurity
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
    },
  });

  // Initialise electron-trpc
  createIPCHandler({
    createContext: createTRPCContext,
    router: appRouter,
    windows: [win]
  });

  if (isProduction) {
    // load bundled React app
    win.loadFile(join(FRONTEND_PROD_PATH, "index.html"));
  } else {
    // show loading spinner while local server is ready
    win.loadFile(join(__dirname, "../renderer/loading.html"));
    await waitForServerUp(FRONTEND_DEV_PATH)
    // load locally served React app in dev mode
    win.loadURL(FRONTEND_DEV_PATH);

    // Open the DevTools.
    win.webContents.openDevTools();
  }

};

app.whenReady().then(() => {

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
