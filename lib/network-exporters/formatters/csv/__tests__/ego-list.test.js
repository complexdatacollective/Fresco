import { beforeEach, describe, expect, it } from 'vitest';
import { makeWriteableStream } from '~/lib/network-exporters/utils/setupTestEnv';
import {
  caseProperty,
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  ncCaseProperty,
  ncProtocolNameProperty,
  ncSessionProperty,
  protocolName,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '~/lib/shared-consts';
import {
  EgoListFormatter,
  asEgoAndSessionVariablesList,
  toCSVStream,
} from '../ego-list';
import { mockCodebook, mockExportOptions } from './mockObjects';

const ego = {
  [egoProperty]: 123,
  [caseProperty]: 'case id',
  [sessionProperty]: 789,
  [protocolName]: 'protocol name',
  [sessionStartTimeProperty]: 100,
  [sessionFinishTimeProperty]: 200,
  [sessionExportTimeProperty]: 300,
  [entityPrimaryKeyProperty]: 1,
  [entityAttributesProperty]: {
    name: 'Jane',
  },
  APP_VERSION: 'mock-app-version',
  COMMIT_HASH: 'mock-commit-hash',
};

const baseCSVAttributes = [
  egoProperty,
  ncCaseProperty,
  ncSessionProperty,
  ncProtocolNameProperty,
  sessionStartTimeProperty,
  sessionFinishTimeProperty,
  sessionExportTimeProperty,
  'APP_VERSION',
  'COMMIT_HASH',
];

describe('asEgoAndSessionVariablesList', () => {
  it('transforms a network to ego', () => {
    const network = {
      nodes: [],
      edges: [],
      ego: { id: 1, [entityAttributesProperty]: {} },
    };
    expect(
      asEgoAndSessionVariablesList(network, mockCodebook, mockExportOptions),
    ).toEqual([network.ego]);
  });
});

describe('toCSVStream', () => {
  let writable;
  let testEgo;

  beforeEach(() => {
    writable = makeWriteableStream();
    testEgo = ego;
  });

  it('writes a simple CSV', async () => {
    toCSVStream([testEgo], writable);

    const csv = await writable.asString();

    const result = [
      ...baseCSVAttributes,
      'name\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      'Jane\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('escapes quotes', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            name: '"Queequeg"',
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      'name\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      '"""Queequeg"""\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('escapes quotes in attr names', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            '"quoted"': 1,
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      '"""quoted"""\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      '1\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('stringifies and quotes objects', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            location: { x: 1, y: 1 },
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      'location\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      '"{""x"":1,""y"":1}"\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('exports undefined values as blank', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            prop: undefined,
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      'prop\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      '\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('exports null values as blank', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            prop: null,
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      'prop\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      '\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });

  it('exports `false` values as "false"', async () => {
    toCSVStream(
      [
        {
          ...testEgo,
          [entityAttributesProperty]: {
            prop: false,
          },
        },
      ],
      writable,
    );
    const csv = await writable.asString();
    const result = [
      ...baseCSVAttributes,
      'prop\r\n1',
      'case id',
      789,
      'protocol name',
      100,
      200,
      300,
      'mock-app-version',
      'mock-commit-hash',
      'false\r\n',
    ].join(',');
    expect(csv).toEqual(result);
  });
});

describe('EgoListFormatter', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('writeToStream returns an abort controller', () => {
    const formatter = new EgoListFormatter({}, mockCodebook, mockExportOptions);
    const controller = formatter.writeToStream(writable);
    expect(controller.abort).toBeInstanceOf(Function);
  });
});
