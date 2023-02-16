import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';

process.once('loaded', async () => {
  exposeElectronTRPC();
});

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});