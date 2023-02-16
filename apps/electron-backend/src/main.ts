import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import connectDB from "./connectPrisma";
import { waitForServerUp } from "./waitForServerUp";
import { createIPCHandler } from 'electron-trpc/main';
import { appRouter, createTRPCContext } from '@codaco/api';

// TODO: maybe better "production detection"
const isProduction = import.meta.env.PROD;
const FRONTEND_PROD_PATH = path.join(__dirname, "../dist-frontend/");
const FRONTEND_DEV_PATH = 'http://localhost:3000/';

async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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
    width: 1024,
  });

  await connectDB();

  if (isProduction) {
    // load bundled React app
    mainWindow.loadFile(path.join(FRONTEND_PROD_PATH, "index.html"));
  } else {
    // show loading spinner while local server is ready
    mainWindow.loadFile(path.join(__dirname, "../loading.html"));
    await waitForServerUp(FRONTEND_DEV_PATH)
    // load locally served React app in dev mode
    mainWindow.loadURL(FRONTEND_DEV_PATH);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }


  createIPCHandler({
    createContext: createTRPCContext,
    router: appRouter,
    windows: [mainWindow]
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
