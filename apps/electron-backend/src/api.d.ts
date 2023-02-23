export interface IElectronAPI {
  node: () => string;
  chrome: () => string;
  electron: () => string;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
