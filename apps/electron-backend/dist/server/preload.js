"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    trpc: (req) => electron_1.ipcRenderer.invoke('trpc', req),
};
electron_1.contextBridge.exposeInMainWorld('appApi', api);
