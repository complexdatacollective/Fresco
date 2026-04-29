import { type Panel, type StageSubject } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useContractHandlers } from '~/lib/interviewer/contract/context';
import { getVariableTypeReplacements } from '~/lib/interviewer/utils/externalData';
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
  const { onRequestAsset } = useContractHandlers();

  const [externalData, setExternalData] = useState<NcNode[] | null>(null);
  const [status, setStatus] = useState<{
    isLoading: boolean;
    error: Error | null;
  }>({ isLoading: false, error: null });

  useEffect(() => {
    if (
      !dataSource ||
      dataSource === 'existing' ||
      !subject ||
      subject.entity === 'ego'
    ) {
      return;
    }

    let cancelled = false;

    setExternalData(null);
    setStatus({ isLoading: true, error: null });

    const asset = assetManifest[dataSource];
    if (!asset) {
      setStatus({
        isLoading: false,
        error: new Error(`Unknown asset id: ${String(dataSource)}`),
      });
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const url = await onRequestAsset(asset.assetId);
        const { nodes } = await loadExternalData(asset.name, url);
        const replacer = makeVariableUUIDReplacer(codebook, subject.type);
        const uuidData = nodes.map(replacer);
        const formatted = getVariableTypeReplacements(
          asset.name,
          uuidData,
          codebook,
          subject,
        );
        if (!cancelled) {
          setExternalData(formatted);
          setStatus({ isLoading: false, error: null });
        }
      } catch (e) {
        const error = ensureError(e);
        posthog.captureException(error, {
          tags: { feature: 'external-data', dataSource: String(dataSource) },
        });
        // eslint-disable-next-line no-console
        console.error(error);
        if (!cancelled) setStatus({ isLoading: false, error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataSource, assetManifest, codebook, subject, onRequestAsset]);

  return { externalData, status };
};

export default useExternalData;
