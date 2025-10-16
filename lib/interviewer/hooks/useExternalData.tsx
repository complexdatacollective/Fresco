import { type Panel, type StageSubject } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getVariableTypeReplacements } from '~/lib/network-exporters/utils/externalData';
import { ensureError } from '~/utils/ensureError';
import { getAssetManifest, getCodebook } from '../ducks/modules/protocol';
import loadExternalData, {
  makeVariableUUIDReplacer,
} from '../utils/loadExternalData';

const useExternalData = (
  dataSource: Panel['dataSource'],
  subject: StageSubject | null,
) => {
  const assetManifest = useSelector(getAssetManifest);
  const codebook = useSelector(getCodebook);

  const [externalData, setExternalData] = useState<NcNode[] | null>(null);
  const [status, setStatus] = useState<{
    isLoading: boolean;
    error: Error | null;
  }>({ isLoading: false, error: null });

  const updateStatus = (newStatus: {
    isLoading?: boolean;
    error?: Error | null;
  }) =>
    setStatus((s: { isLoading: boolean; error: Error | null }) => ({
      ...s,
      ...newStatus,
    }));

  useEffect(() => {
    if (
      !dataSource ||
      dataSource === 'existing' ||
      !subject ||
      subject.entity === 'ego' // Only run this when the stage subject is a node or edge
    ) {
      return;
    }
    // This is where we could set the loading state for URL assets
    setExternalData(null);
    updateStatus({ isLoading: true, error: null });

    const { url, name } = assetManifest[dataSource]!;

    const variableUUIDReplacer = makeVariableUUIDReplacer(
      codebook,
      subject.type,
    );

    loadExternalData(name, url)
      .then(({ nodes }) => nodes.map(variableUUIDReplacer))
      .then((uuidData) =>
        getVariableTypeReplacements(name, uuidData, codebook, subject),
      )
      .then((formattedData) => setExternalData(formattedData))
      .then(() => updateStatus({ isLoading: false }))
      .catch((e) => {
        const error = ensureError(e);
        // eslint-disable-next-line no-console
        console.error(e);
        updateStatus({ isLoading: false, error: error });
      });
  }, [dataSource, assetManifest, codebook, subject]);

  return {
    externalData,
    status,
  };
};

export default useExternalData;
