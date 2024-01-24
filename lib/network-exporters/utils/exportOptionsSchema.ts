import { z } from 'zod';

export const ExportOptionsSchema = z.object({
  exportGraphML: z.boolean(),
  exportCSV: z.boolean(),
  globalOptions: z.object({
    exportFilename: z.string(),
    unifyNetworks: z.boolean(),
    useScreenLayoutCoordinates: z.boolean(),
  }),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
