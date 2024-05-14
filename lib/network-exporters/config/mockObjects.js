import { groupBy } from 'lodash';
import { caseProperty, sessionStartTimeProperty, sessionFinishTimeProperty, sessionExportTimeProperty, protocolName, entityPrimaryKeyProperty, entityAttributesProperty, protocolProperty, sessionProperty, codebookHashProperty } from '../src/utils/reservedAttributes';
import { insertEgoIntoSessionNetworks, resequenceIds, unionOfNetworks } from '../src/formatters/network';

export const mockCodebook = {
  ego: {
    variables: {
      'mock-uuid-1': { name: 'egoName', type: 'string' },
      'mock-uuid-2': { name: 'egoAge', type: 'number' },
      'mock-uuid-3': { name: 'boolVar', type: 'boolean' },
    },
  },
  node: {
    'mock-node-type': {
      name: 'person',
      variables: {
        'mock-uuid-1': { name: 'firstName', type: 'string' },
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
    },
    'mock-edge-type-2': {
      name: 'likes',
    },
  },
};

export const mockExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    unifyNetworks: false,
    useDirectedEdges: false,
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

export const mockNetwork = {
  nodes: [
    { [entityPrimaryKeyProperty]: '1', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Dee', 'mock-uuid-2': 40, 'mock-uuid-3': { x: 0, y: 0 }, 'mock-uuid-4': true, 'mock-uuid-5': null } },
    { [entityPrimaryKeyProperty]: '2', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Carl', 'mock-uuid-2': 0, 'mock-uuid-3': { x: 0, y: 0 }, 'mock-uuid-4': false, 'mock-uuid-5': null } },
    { [entityPrimaryKeyProperty]: '3', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Jumbo', 'mock-uuid-2': 50, 'mock-uuid-3': null, 'mock-uuid-4': true, 'mock-uuid-5': null } },
    { [entityPrimaryKeyProperty]: '4', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Francis', 'mock-uuid-2': 10, 'mock-uuid-3': { x: 0, y: 0 }, 'mock-uuid-4': null, 'mock-uuid-5': null } },
  ],
  edges: [
    { from: '1', to: '2', type: 'mock-edge-type' },
  ],
  ego: {
    [entityPrimaryKeyProperty]: 'ego-id-1',
    [entityAttributesProperty]: {
      'mock-uuid-1': 'Dee',
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
  },
};

export const mockNetwork2 = {
  nodes: [
    { [entityPrimaryKeyProperty]: '10', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Jimbo', 'mock-uuid-2': 20, 'mock-uuid-3': { x: 10, y: 50 } } },
    { [entityPrimaryKeyProperty]: '20', type: 'mock-node-type', [entityAttributesProperty]: { 'mock-uuid-1': 'Jambo', 'mock-uuid-2': 30, 'mock-uuid-3': { x: 20, y: 20 } } },
  ],
  edges: [
    { from: '10', to: '20', type: 'mock-edge-type' },
  ],
  ego: {
    [entityPrimaryKeyProperty]: 'ego-id-10',
    [entityAttributesProperty]: {
      'mock-uuid-1': 'Dee',
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
  },
};

// Function designed to mirror the flow in FileExportManager.exportSessions()
export const processMockNetworks = (networkCollection, unify) => {
  const sessionsWithEgo = insertEgoIntoSessionNetworks(networkCollection);
  const sessionsByProtocol = groupBy(sessionsWithEgo, `sessionVariables.${protocolProperty}`);
  const sessionsWithResequencedIDs = resequenceIds(sessionsByProtocol);

  if (!unify) {
    return sessionsWithResequencedIDs;
  }
  return unionOfNetworks(sessionsWithResequencedIDs);
};
