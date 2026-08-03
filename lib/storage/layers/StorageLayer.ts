import { makeProductionLayer } from '~/lib/storage/layers/ProductionLayer';
import { getStorageProvider } from '~/queries/storageProvider';

export const getStorageLayer = async () => {
  const provider = await getStorageProvider();
  return makeProductionLayer(provider);
};
