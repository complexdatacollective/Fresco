/* eslint-disable global-require */
import environments from './environments';

let hasWindow = false;
if (typeof window !== 'undefined' && window) {
  hasWindow = true;
}

let isElectron;
if (hasWindow) {
  isElectron = () => !!window.electron || !!window.require;
} else {
  // if no window object assume we are in nodejs environment (Electron main)
  isElectron = () => true;
}

let os;

if (hasWindow) {
  os = (window.require && window.require('os')) || window.os;
} else {
  os = require('os');
}

const isMacOS = () => isElectron && os.platform() === 'darwin';

const isWindows = () => isElectron && os.platform() === 'win32';

const isLinux = () => isElectron && os.platform() === 'linux';

let isCordova;
if (hasWindow) {
  isCordova = () => !!window.cordova;
} else {
  // if no window object assume we are in nodejs environment (Electron main)
  isCordova = () => false;
}

const isWeb = () => !isCordova() && !isElectron();

const getEnvironment = () => {
  if (isCordova()) return environments.CORDOVA;
  if (isElectron()) return environments.ELECTRON;
  return environments.WEB;
};

const inEnvironment =
  (tree) =>
  (...args) =>
    tree(getEnvironment())(...args);

export {
  inEnvironment,
  getEnvironment,
  isCordova,
  isElectron,
  isLinux,
  isMacOS,
  isWeb,
  isWindows,
};
