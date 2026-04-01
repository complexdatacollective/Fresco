import { env } from '~/env.js';
import { TestLayer } from '~/lib/storage/layers/TestLayer';
import { makeProductionLayer } from '~/lib/storage/layers/ProductionLayer';
import { getStorageProvider } from '~/queries/storageProvider';

export const getStorageLayer = async () => {
  if (env.E2E_TEST) {
    return TestLayer;
  }

  const provider = await getStorageProvider();
  return makeProductionLayer(provider);
};
