import {
  caseProperty,
  egoProperty,
  ncCaseProperty,
  ncProtocolNameProperty,
  ncSessionProperty,
  protocolName,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import type { SessionWithResequencedIDs } from '~/lib/network-exporters/input';
import { egoListRows } from '../egoList';
import { mockCodebook, mockExportOptions, mockNetwork } from './mockObjects';

describe('egoListRows', () => {
  it('yields exactly one header and one data row', () => {
    const rows = Array.from(
      egoListRows(
        mockNetwork as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    expect(rows).toHaveLength(2);
    // printableAttribute maps caseProperty → ncCaseProperty in the header
    expect(rows[0]).toContain(ncCaseProperty);
    expect(rows[0]).toContain(ncSessionProperty);
    expect(rows[0]).toContain(ncProtocolNameProperty);
    // entityPrimaryKeyProperty → egoProperty in header
    expect(rows[0]).toContain(egoProperty);
    // session time fields pass through unchanged
    expect(rows[0]).toContain(sessionStartTimeProperty);
    expect(rows[0]).toContain(sessionFinishTimeProperty);
    expect(rows[0]).toContain(sessionExportTimeProperty);
    // processEntityVariables maps UUIDs to variable names from codebook
    expect(rows[0]).toContain('egoName');
    expect(rows[0]).toContain('egoAge');
    expect(rows[0]).toContain('boolVar');
  });

  it('data row contains session variable values', () => {
    const rows = Array.from(
      egoListRows(
        mockNetwork as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    // caseProperty value from mockNetwork.sessionVariables
    expect(rows[1]).toContain(String(mockNetwork.sessionVariables[caseProperty]));
    // protocolName value
    expect(rows[1]).toContain(mockNetwork.sessionVariables[protocolName]);
    // sessionProperty value
    expect(rows[1]).toContain(mockNetwork.sessionVariables[sessionProperty]);
  });

  it('data row contains ego attribute values', () => {
    const rows = Array.from(
      egoListRows(
        mockNetwork as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    // egoName attribute from mockNetwork.ego
    expect(rows[1]).toContain('Enzo');
    // egoAge attribute
    expect(rows[1]).toContain('40');
  });

  it('yields only header row when ego has no attributes', () => {
    const emptyNetwork = {
      ...mockNetwork,
      ego: { _uid: 'ego-id', attributes: {} },
      sessionVariables: {
        [caseProperty]: 'c1',
        [sessionProperty]: 's1',
        [protocolName]: 'p1',
        [sessionStartTimeProperty]: '100',
        [sessionFinishTimeProperty]: '200',
        [sessionExportTimeProperty]: '300',
        APP_VERSION: 'v1',
        COMMIT_HASH: 'abc',
      },
    };

    const rows = Array.from(
      egoListRows(
        emptyNetwork as unknown as SessionWithResequencedIDs,
        mockCodebook,
        mockExportOptions,
      ),
    );
    // Always yields header + one data row (ego is a single entity, not a list)
    expect(rows).toHaveLength(2);
  });
});
