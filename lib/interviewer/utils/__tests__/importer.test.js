/* eslint-env jest */

jest.mock('../filesystem');
jest.mock('../protocol/protocolPath');

describe('importer', () => {
  describe('Electron', () => {
    it('copies the protocol files to the user data directory', () => {});
  });

  describe('Cordova', () => {
    it('copies the protocol files to the user data directory', () => {});
  });
});
