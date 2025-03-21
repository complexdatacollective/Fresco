import {
  caseProperty,
  codebookHashProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { groupBy } from 'es-toolkit';
import { insertEgoIntoSessionNetworks } from '../../session/insertEgoIntoSessionNetworks';
import { resequenceIds } from '../../session/resequenceIds';

export const mockCodebook = {
  ego: {
    variables: {
      'mock-uuid-1': { name: 'egoName', type: 'text' },
      'mock-uuid-2': { name: 'egoAge', type: 'number' },
      'mock-uuid-3': { name: 'boolVar', type: 'boolean' },
    },
  },
  node: {
    'mock-node-type': {
      name: 'person',
      color: 'color',
      variables: {
        'mock-uuid-1': { name: 'firstName', type: 'text' },
        'mock-uuid-2': { name: 'age', type: 'number' },
        'mock-uuid-3': { name: 'layout', type: 'layout' },
        'mock-uuid-4': { name: 'boolWithValues', type: 'boolean' },
        'mock-uuid-5': { name: 'nullBool', type: 'boolean' },
        'mock-uuid-6': { name: 'unusedBool', type: 'boolean' },
      },
    },
  },
  edge: {
    'mock-edge-type': {
      name: 'peer',
      color: 'color',
    },
    'mock-edge-type-2': {
      name: 'likes',
      color: 'color',
    },
  },
};

export const mockExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

export const mockNetwork = {
  nodes: [
    {
      [entityPrimaryKeyProperty]: '1',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Dee',
        'mock-uuid-2': 40,
        'mock-uuid-3': { x: 0, y: 0 },
        'mock-uuid-4': true,
        'mock-uuid-5': null,
        'mock-uuid-6': null,
        'mock-uuid-7': null,
        'mock-uuid-8': null,
      },
    },
    {
      [entityPrimaryKeyProperty]: '2',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Carl',
        'mock-uuid-2': 0,
        'mock-uuid-3': { x: 0, y: 0 },
        'mock-uuid-4': false,
        'mock-uuid-5': null,
      },
    },
    {
      [entityPrimaryKeyProperty]: '3',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Jumbo',
        'mock-uuid-2': 50,
        'mock-uuid-3': null,
        'mock-uuid-4': true,
        'mock-uuid-5': null,
      },
    },
    {
      [entityPrimaryKeyProperty]: '4',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Francis',
        'mock-uuid-2': 10,
        'mock-uuid-3': { x: 0, y: 0 },
        'mock-uuid-4': null,
        'mock-uuid-5': null,
      },
    },
  ],
  edges: [{ from: '1', to: '2', type: 'mock-edge-type' }],
  ego: {
    [entityPrimaryKeyProperty]: 'ego-id-1',
    [entityAttributesProperty]: {
      'mock-uuid-1': 'Enzo',
      'mock-uuid-2': 40,
      'mock-uuid-3': false,
    },
  },
  sessionVariables: {
    [caseProperty]: 123,
    [protocolName]: 'protocol name',
    [protocolProperty]: 'protocol-uid-1',
    [sessionProperty]: 'session-id-1',
    [sessionStartTimeProperty]: 100,
    [sessionFinishTimeProperty]: 200,
    [sessionExportTimeProperty]: 300,
    [codebookHashProperty]: '14fa461bf4b98155e82adc86532938553b4d33a9',
    APP_VERSION: 'mock-app-version',
    COMMIT_HASH: 'mock-commit-hash',
  },
};

export const mockNetwork2 = {
  nodes: [
    {
      [entityPrimaryKeyProperty]: '10',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Jimbo',
        'mock-uuid-2': 20,
        'mock-uuid-3': { x: 10, y: 50 },
      },
    },
    {
      [entityPrimaryKeyProperty]: '20',
      type: 'mock-node-type',
      [entityAttributesProperty]: {
        'mock-uuid-1': 'Jambo',
        'mock-uuid-2': 30,
        'mock-uuid-3': { x: 20, y: 20 },
      },
    },
  ],
  edges: [{ from: '10', to: '20', type: 'mock-edge-type' }],
  ego: {
    [entityPrimaryKeyProperty]: 'ego-id-10',
    [entityAttributesProperty]: {
      'mock-uuid-1': 'Enzo',
      'mock-uuid-2': 40,
      'mock-uuid-3': true,
    },
  },
  sessionVariables: {
    [caseProperty]: 456,
    [protocolName]: 'protocol name',
    [protocolProperty]: 'protocol-uid-1',
    [sessionProperty]: 'session-id-2',
    [sessionStartTimeProperty]: 1000,
    [sessionFinishTimeProperty]: 2000,
    [sessionExportTimeProperty]: 3000,
    [codebookHashProperty]: '14fa461bf4b98155e82adc86532938553b4d33a9',
    APP_VERSION: 'mock-app-version',
    COMMIT_HASH: 'mock-commit-hash',
  },
};

// Function designed to mirror the flow in FileExportManager.exportSessions()
export const processMockNetworks = (networkCollection) => {
  const sessionsWithEgo = insertEgoIntoSessionNetworks(networkCollection);
  const sessionsByProtocol = groupBy(
    sessionsWithEgo,
    (s) => s.sessionVariables[protocolProperty],
  );
  const sessionsWithResequencedIDs = resequenceIds(sessionsByProtocol);

  return sessionsWithResequencedIDs;
};
