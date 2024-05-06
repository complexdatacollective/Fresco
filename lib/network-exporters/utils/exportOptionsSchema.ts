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

export const defaultExportOptions: ExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    exportFilename: `networkCanvasExport-${Date.now()}`,
    unifyNetworks: false,
    useScreenLayoutCoordinates: false,
  },
};

export type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};
