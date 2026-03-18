import { env } from '~/env.js';
import { ProductionLayer } from '~/lib/export/layers/ProductionLayer';
import { TestLayer } from '~/lib/export/layers/TestLayer';

export const ExportLayer = env.USE_LOCAL_FILE_STORAGE
  ? TestLayer
  : ProductionLayer;
