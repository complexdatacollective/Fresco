/* eslint-disable global-require */

import { isArray, isString } from 'lodash';
import inEnvironment from '../Environment';

const isValidProtocolUID = protocolUID => (isString(protocolUID) && protocolUID.length > 0);

const ensureArray = (filePath = []) => {
  if (!isArray(filePath)) {
    return [filePath];
  }

  return filePath;
};

const protocolPath = (environment) => {
  console.log('TODO 3: lib/interviewer/utils/protocol/protocolPath.js: protocolPath');
  return 'path/to/protocol';
  // if (environment === environments.ELECTRON) {
  //   const path = require('path');

  //   return (protocolUID, filePath = []) => {
  //     if (!isValidProtocolUID(protocolUID)) throw Error('Protocol name is not valid');
  //     return path.join(userDataPath(), 'protocols', protocolUID, ...ensureArray(filePath));
  //   };
  // }

  // if (environment === environments.CORDOVA) {
  //   return (protocolUID, filePath) => {
  //     if (!isValidProtocolUID(protocolUID)) throw Error('Protocol name is not valid');

  //     if (!filePath) {
  //       // Cordova expects a trailing slash:
  //       return `${userDataPath()}protocols/${protocolUID}/`;
  //     }

  //     return `${userDataPath()}protocols/${protocolUID}/${filePath}`;
  //   };
  // }

  // throw new Error('protocolPath() not specified on this platform');
};

export default inEnvironment(protocolPath);
