import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { mapKeys } from 'lodash-es';
import { hash } from 'ohash';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getVariableTypeReplacements } from '../containers/withExternalData';
import { getAssetManifest, getProtocolCodebook } from '../selectors/protocol';
import { getActiveSession } from '../selectors/session';
import getParentKeyByNameValue from '../utils/getParentKeyByNameValue';
import loadExternalData from '../utils/loadExternalData';

export const getSessionMeta = createSelector(
  getActiveSession,
  getProtocolCodebook,
  getAssetManifest,
  (session, protocolCodebook, assetManifest) => {
    const { protocolUID } = session;

    return {
      protocolUID,
      assetManifest,
      protocolCodebook,
    };
  },
);

const withUUID = (node) => hash(node);

// Replace string keys with UUIDs in codebook, according to stage subject.
export const makeVariableUUIDReplacer =
  (protocolCodebook, subjectType) => (node) => {
    const codebookDefinition = protocolCodebook.node[subjectType] || {};

    const uuid = withUUID(node);

    const attributes = mapKeys(
      node.attributes,
      (_attributeValue, attributeKey) =>
        getParentKeyByNameValue(codebookDefinition.variables, attributeKey),
    );

    return {
      type: subjectType,
      [entityPrimaryKeyProperty]: uuid,
      [entityAttributesProperty]: attributes,
    };
  };

const useExternalData = (dataSource, subject) => {
  const { protocolUID, assetManifest, protocolCodebook } =
    useSelector(getSessionMeta);

  const [externalData, setExternalData] = useState(null);
  const [status, setStatus] = useState({ isLoading: false, error: null });
  const updateStatus = (newStatus) =>
    setStatus((s) => ({ ...s, ...newStatus }));

  useEffect(() => {
    if (!dataSource) {
      return;
    }
    // This is where we could set the loading state for URL assets
    setExternalData(null);
    updateStatus({ isLoading: true, error: null });

    const { url, name } = assetManifest[dataSource];

    const variableUUIDReplacer = makeVariableUUIDReplacer(
      protocolCodebook,
      subject.type,
    );

    loadExternalData(name, url)
      .then(({ nodes }) => nodes.map(variableUUIDReplacer))
      .then((uuidData) =>
        getVariableTypeReplacements(name, uuidData, protocolCodebook, subject),
      )
      .then((formattedData) => setExternalData(formattedData))
      .then(() => updateStatus({ isLoading: false }))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        updateStatus({ isLoading: false, error: e });
      });
  }, [dataSource, protocolUID, assetManifest, protocolCodebook, subject]);

  return [externalData, status];
};

export default useExternalData;
