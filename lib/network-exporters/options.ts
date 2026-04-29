import { z } from 'zod/mini';

export const ExportOptionsSchema = z.object({
  exportGraphML: z.boolean(),
  exportCSV: z.boolean(),
  globalOptions: z.object({
    useScreenLayoutCoordinates: z.boolean(),
    screenLayoutHeight: z.number(),
    screenLayoutWidth: z.number(),
  }),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

export type ExportFormat =
  | 'graphml'
  | 'attributeList'
  | 'edgeList'
  | 'ego'
  | 'adjacencyMatrix';
