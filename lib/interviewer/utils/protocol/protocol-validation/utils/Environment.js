import environments from './environments';

export const isElectron = () => !!window.electron || !!window.require;

const os = (window.require && window.require('os')) || window.os;
export const isMacOS = () => isElectron && os.platform() === 'darwin';

export const isWindows = () => isElectron && os.platform() === 'win32';

export const isLinux = () => isElectron && os.platform() === 'linux';

export const isCordova = () => !!window.cordova;

export const isWeb = () => (!isCordova() && !isElectron());

const getEnvironment = () => {
  if (isCordova()) return environments.CORDOVA;
  if (isElectron()) return environments.ELECTRON;
  return environments.WEB;
};

const inEnvironment = tree =>
  (...args) =>
    tree(getEnvironment())(...args);

export default inEnvironment;
