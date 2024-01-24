import { z } from 'zod';

const ExportOptionsSchema = z.object({
  exportGraphML: z.boolean(),
  exportCSV: z.boolean(),
  globalOptions: z.object({
    exportFilename: z.string(),
    unifyNetworks: z.boolean(),
    useScreenLayoutCoordinates: z.boolean(),
  }),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

export const validateExportOptions = (options: unknown) => {
  try {
    const validatedOptions = ExportOptionsSchema.parse(options);
    return validatedOptions;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error validating export options:', error);
    return null;
  }
};
