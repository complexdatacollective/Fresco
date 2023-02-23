"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Manual inlining of electron-trpc's exposeElectronTRPC function due to
 * incompatibility with sandboxing.
 *
 * If this becomes an issue, we could instead bundle this preload script with vite.
 *
 * See: https://github.com/jsonnull/electron-trpc/issues/116
 */
// Defined here: https://github.com/jsonnull/electron-trpc/blob/main/packages/electron-trpc/src/constants.ts
const ELECTRON_TRPC_CHANNEL = 'electron-trpc';
const electronTRPC = {
    sendMessage: (operation) => electron_1.ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback) => electron_1.ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args)),
};
electron_1.contextBridge.exposeInMainWorld('electronTRPC', electronTRPC);
//# sourceMappingURL=preload.js.map