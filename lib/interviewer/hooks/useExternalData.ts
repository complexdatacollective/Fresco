import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type Codebook,
} from '@codaco/shared-consts';
import { mapKeys } from 'es-toolkit';
import { hash } from 'ohash';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { NcNode } from '~/schemas/network-canvas';
import { ensureError } from '~/utils/ensureError';
import { getVariableTypeReplacements } from '../containers/withExternalData';
import { getCurrentStage, getSessionMeta } from '../selectors/session';
import getParentKeyByNameValue from '../utils/getParentKeyByNameValue';
import loadExternalData from '../utils/loadExternalData';

const hashNode = (node: NcNode) => hash(node);

/**
 * This function is used to replace the variable keys in external data with the
 * corresponding UUIDs for those variables in the codebook. This puts attribute
 * values in the correct format for insertion into the network.
 */
export const makeVariableUUIDReplacer =
  (protocolCodebook: Codebook, subjectType: string) =>
  (node: NcNode): NcNode => {
    const codebookDefinition = protocolCodebook.node?.[subjectType] ?? null;

    if (!codebookDefinition) {
      throw new Error(`No codebook definition found for ${subjectType}`);
    }

    const nodeHash = hashNode(node);

    const attributes = mapKeys(
      node.attributes,
      (_attributeValue, attributeKey) =>
        getParentKeyByNameValue(codebookDefinition.variables, attributeKey),
    );

    return {
      type: subjectType,
      [entityPrimaryKeyProperty]: nodeHash,
      [entityAttributesProperty]: attributes,
    };
  };

const useExternalData = (dataSource?: string) => {
  const [data, setData] = useState<NcNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subject } = useSelector(getCurrentStage);
  const { protocolUID, assetManifest, protocolCodebook } =
    useSelector(getSessionMeta);

  useEffect(() => {
    if (!dataSource) {
      return;
    }
    // This is where we could set the loading state for URL assets
    setData(null);
    setError(null);

    const { url, name } = assetManifest[dataSource]!;

    const variableUUIDReplacer = makeVariableUUIDReplacer(
      protocolCodebook,
      subject.type,
    );

    const isCSV = name.split('.').pop() === 'csv';
    setIsLoading(true);

    loadExternalData(url, isCSV)
      .then((nodes) => nodes.map(variableUUIDReplacer))
      .then(
        (uuidData) =>
          getVariableTypeReplacements(
            name,
            uuidData,
            protocolCodebook,
            subject,
          ) as NcNode[],
      )
      .then((formattedData) => setData(formattedData))
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.error(e);
        setError(error.message);
      })
      .finally(() => setIsLoading(false));
  }, [dataSource, protocolUID, assetManifest, protocolCodebook, subject]);

  return {
    data,
    isLoading,
    error,
  };
};

export default useExternalData;
