import { contextBridge, ipcRenderer } from 'electron';
import type { RendererGlobalElectronTRPC } from 'electron-trpc/src/types';

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

const electronTRPC: RendererGlobalElectronTRPC = {
    sendMessage: (operation) => ipcRenderer.send(ELECTRON_TRPC_CHANNEL, operation),
    onMessage: (callback) =>
        ipcRenderer.on(ELECTRON_TRPC_CHANNEL, (_event, args) => callback(args)),
};

contextBridge.exposeInMainWorld('electronTRPC', electronTRPC);