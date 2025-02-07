/* eslint-env jest */

import { Codebook, ncUUIDProperty } from '@codaco/shared-consts';
import {
  Document,
  DOMParser,
  Element,
  LiveNodeList,
  MIME_TYPE,
} from '@xmldom/xmldom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExportOptions } from '~/lib/network-exporters/utils/types';
import {
  mockCodebook,
  mockExportOptions,
  mockNetwork,
  mockNetwork2,
  processMockNetworks,
} from '../../csv/__tests__/mockObjects';
import graphMLGenerator from '../createGraphML';

function getDataElementByKey(elements: Element[], key: string) {
  return elements.find((element) => element.getAttribute('key') === key);
}

function getNodeById(nodes: Element[], id: string) {
  return nodes.find((node) => node.getAttribute('id') === id);
}

const getChildElements = (parentEl: Element, elements: LiveNodeList<Element>) =>
  Array.from(elements).filter((el) => el.parentNode === parentEl);

const buildXML = (...args: Parameters<typeof graphMLGenerator>) => {
  let xmlString = graphMLGenerator(...args);

  const parser = new DOMParser();
  const result = parser.parseFromString(xmlString, MIME_TYPE.XML_APPLICATION);
  return result;
};

describe('buildGraphML', () => {
  const edgeType = mockCodebook.edge['mock-edge-type'].name;
  const nodeType = mockCodebook.node['mock-node-type'].name;
  const codebook = mockCodebook as unknown as Codebook; // Codebook type mistakenly requires variables on all entities - fixed in schema 8
  let exportOptions: ExportOptions;
  let xml: Document;

  beforeEach(() => {
    exportOptions = {
      ...mockExportOptions,
      exportGraphML: true,
    };

    const processedNetworks = processMockNetworks([mockNetwork, mockNetwork2]);
    const protocolNetwork = processedNetworks['protocol-uid-1']![0]!;
    xml = buildXML(protocolNetwork, codebook, exportOptions);
  });

  it('produces a graphml document', () => {
    expect(xml.getElementsByTagName('graphml')).toHaveLength(1);
  });

  it('creates a single graph element when not merging', () => {
    expect(xml.getElementsByTagName('graph')).toHaveLength(1);
  });

  it('defaults to undirected edges', () => {
    const graphElement = xml.getElementsByTagName('graph')[0]!;

    expect(graphElement.getAttribute('edgedefault')).toEqual('undirected');
  });

  it('adds nodes', () => {
    expect(xml.getElementsByTagName('node')).toHaveLength(4);
  });

  it('adds edges', () => {
    expect(xml.getElementsByTagName('edge')).toHaveLength(1);
  });

  it('adds node and edge type data key', () => {
    const node = xml.getElementsByTagName('node')[0]!;
    const edge = xml.getElementsByTagName('edge')[0]!;

    const nodeTypeDataElement = getDataElementByKey(
      Array.from(node.getElementsByTagName('data')),
      'networkCanvasType',
    );
    const edgeTypeDataElement = getDataElementByKey(
      Array.from(edge.getElementsByTagName('data')),
      'networkCanvasType',
    );

    expect(nodeTypeDataElement?.textContent).toEqual(nodeType);
    expect(edgeTypeDataElement?.textContent).toEqual(edgeType);
  });

  describe('ego', () => {
    it('adds ego data', () => {
      const graphData = getChildElements(
        xml.getElementsByTagName('graph')[0]!,
        xml.getElementsByTagName('data'),
      ).reduce(
        (acc, node) => ({
          ...acc,
          [node.getAttribute('key')!]: node.textContent,
        }),
        {},
      );

      expect(graphData).toMatchObject({
        [ncUUIDProperty]: 'ego-id-1',
        'mock-uuid-1': 'Enzo',
        'mock-uuid-2': '40',
        'mock-uuid-3': 'false',
      });
    });

    it('omits networkCanvasUUID data element when network.codebook.ego is empty', () => {
      const processedNetworks = processMockNetworks([
        mockNetwork,
        mockNetwork2,
      ]);
      const protocolNetwork = processedNetworks['protocol-uid-1']![0]!;
      const { ego, ...egolessCodebook } = codebook;
      const egolessNetwork = {
        ...protocolNetwork,
        ego: {
          _uid: 'ego-id-1',
          attributes: {},
        },
      };
      const noEgoXML = buildXML(egolessNetwork, egolessCodebook, exportOptions);
      const graphData = getChildElements(
        noEgoXML.getElementsByTagName('graph')[0]!,
        noEgoXML.getElementsByTagName('data'),
      ).reduce(
        (acc, node) => ({
          ...acc,
          [node.getAttribute('key')!]: node.textContent,
        }),
        {},
      ) as Record<string, string>;
      expect(graphData[ncUUIDProperty]).toBeUndefined();
    });
  });

  it('infers int types', () => {
    // This indicates that transposition worked for nodes
    expect(
      xml.getElementById('mock-uuid-2')?.getAttribute('attr.type'),
    ).toEqual('int');
  });

  it('converts layout types', () => {
    expect(
      xml.getElementById('mock-uuid-3_X')?.getAttribute('attr.type'),
    ).toEqual('double');
    expect(
      xml.getElementById('mock-uuid-3_Y')?.getAttribute('attr.type'),
    ).toEqual('double');
  });

  it('exports edge labels', () => {
    // This indicates that [non-]transposition worked for edges
    const edge = xml.getElementsByTagName('edge')[0];
    expect(edge?.getElementsByTagName('data')[1]?.textContent).toEqual(
      edgeType,
    );
  });

  it('includes 0 and false values', () => {
    const carl = getNodeById(
      Array.from(xml.getElementsByTagName('node')),
      '2',
    )!;

    const zeroValue = getDataElementByKey(
      Array.from(carl.getElementsByTagName('data')),
      'age',
    );

    const falseValue = getDataElementByKey(
      Array.from(carl.getElementsByTagName('data')),
      'boolWithValues',
    );

    expect(zeroValue?.textContent).toEqual('0');
    expect(falseValue?.textContent).toEqual('false');
  });

  it('excludes null values', () => {
    const nodes = Array.from(xml.getElementsByTagName('node'));
    const dee = getNodeById(nodes, '1')!;
    const deeData = Array.from(dee.getElementsByTagName('data'));
    expect(deeData.length).toEqual(13);
    expect(getDataElementByKey(deeData, 'mock-uuid-5')?.textContent).toEqual(
      undefined,
    );

    const carl = getNodeById(nodes, '2')!;
    const carlData = Array.from(carl.getElementsByTagName('data'));
    expect(carlData.length).toEqual(13);
    expect(getDataElementByKey(carlData, 'mock-uuid-5')?.textContent).toEqual(
      undefined,
    );

    const jumbo = getNodeById(nodes, '3')!;
    expect(jumbo.getElementsByTagName('data').length).toEqual(9);

    const francis = getNodeById(nodes, '4')!;
    const francisData = Array.from(francis.getElementsByTagName('data'));
    expect(francis.getElementsByTagName('data').length).toEqual(11);
    expect(
      getDataElementByKey(francisData, 'mock-uuid-5')?.textContent,
    ).toEqual(undefined);
    expect(
      getDataElementByKey(francisData, 'mock-uuid-4')?.textContent,
    ).toEqual(undefined);
  });

  it('includes keys for all used variables', () => {
    const graphData = Array.from(xml.getElementsByTagName('key'))
      .filter((node) => node.getAttribute('for') === 'node')
      .reduce(
        (acc, node) => ({
          ...acc,
          [node.getAttribute('id')!]: node.getAttribute('for'),
        }),
        {},
      );

    expect(graphData).toMatchObject({
      'mock-uuid-1': 'node',
      'mock-uuid-2': 'node',
      'mock-uuid-3_X': 'node',
      'mock-uuid-3_screenSpaceY': 'node',
      'mock-uuid-3_screenSpaceX': 'node',
      'mock-uuid-3_Y': 'node',
      'mock-uuid-4': 'node',
      'mock-uuid-5': 'node',
    });
  });
});
