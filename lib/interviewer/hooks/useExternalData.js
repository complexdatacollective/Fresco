/* eslint-disable no-underscore-dangle */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import objectHash from 'object-hash';
import { mapKeys } from 'lodash';
import { entityAttributesProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import loadExternalData from '../utils/loadExternalData';
import getParentKeyByNameValue from '../utils/getParentKeyByNameValue';
import { getVariableTypeReplacements } from '../containers/withExternalData';
import { createSelector } from '@reduxjs/toolkit';
import { getActiveSession } from '../selectors/session';
import { getAssetManifest, getProtocolCodebook } from '../selectors/protocol';

const getSessionMeta = createSelector(
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
  });

const withUUID = (node) => objectHash(node);

// Replace string keys with UUIDs in codebook, according to stage subject.
const makeVariableUUIDReplacer = (
  protocolCodebook,
  stageSubject,
) => (node) => new Promise((resolve) => {
  setTimeout(() => {
    const stageNodeType = stageSubject.type;
    const codebookDefinition = protocolCodebook.node[stageNodeType] || {};

    const uuid = withUUID(node);

    const attributes = mapKeys(
      node.attributes,
      (attributeValue, attributeKey) => getParentKeyByNameValue(
        codebookDefinition.variables,
        attributeKey,
      ),
    );

    resolve({
      type: stageNodeType,
      [entityPrimaryKeyProperty]: uuid,
      [entityAttributesProperty]: attributes,
    });
  }, 0);
});

const useExternalData = (dataSource, subject) => {
  const {
    protocolUID,
    assetManifest,
    protocolCodebook,
  } = useSelector(getSessionMeta);

  const [externalData, setExternalData] = useState(null);
  const [status, setStatus] = useState({ isLoading: false, error: null });
  const updateStatus = (newStatus) => setStatus((s) => ({ ...s, ...newStatus }));

  useEffect(() => {
    if (!dataSource) { return; }
    // This is where we could set the loading state for URL assets
    setExternalData(null);
    updateStatus({ isLoading: true, error: null });

    const { url, name } = assetManifest[dataSource];

    const variableUUIDReplacer = makeVariableUUIDReplacer(protocolCodebook, subject);

    loadExternalData(name, url)
      .then(({ nodes }) => Promise.all(nodes.map(variableUUIDReplacer)))
      .then((uuidData) => getVariableTypeReplacements(
        name, uuidData, protocolCodebook, subject,
      ))
      .then((formattedData) => setExternalData(formattedData))
      .then(() => updateStatus({ isLoading: false }))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        updateStatus({ isLoading: false, error: e })
      });
  }, [dataSource, protocolUID, assetManifest, protocolCodebook, subject]);

  return [externalData, status];
};

export default useExternalData;
