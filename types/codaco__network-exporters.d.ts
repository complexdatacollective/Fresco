declare module '@codaco/network-exporters/errors' {
  type ExportFormat =
    | 'graphml'
    | 'attributeList'
    | 'edgeList'
    | 'ego'
    | 'adjacencyMatrix';

  export class DatabaseError extends Error {
    readonly _tag: 'NetworkExporters/DatabaseError';
    readonly cause: unknown;
    constructor(args: { readonly cause: unknown });
  }

  export class OutputError extends Error {
    readonly _tag: 'NetworkExporters/OutputError';
    readonly cause: unknown;
    constructor(args: { readonly cause: unknown });
  }

  export class ExportGenerationError extends Error {
    readonly _tag: 'NetworkExporters/ExportGenerationError';
    readonly cause: unknown;
    readonly format: ExportFormat;
    readonly sessionId: string;
    readonly partitionEntity?: string;
    constructor(args: {
      readonly cause: unknown;
      readonly format: ExportFormat;
      readonly sessionId: string;
      readonly partitionEntity?: string;
    });
  }

  export class ProtocolNotFoundError extends Error {
    readonly _tag: 'NetworkExporters/ProtocolNotFoundError';
    readonly hash: string;
    readonly sessionId: string;
    constructor(args: { readonly hash: string; readonly sessionId: string });
  }

  export class SessionProcessingError extends Error {
    readonly _tag: 'NetworkExporters/SessionProcessingError';
    readonly cause: unknown;
    readonly stage: 'format' | 'insertEgo' | 'resequence';
    readonly sessionId: string;
    constructor(args: {
      readonly cause: unknown;
      readonly stage: 'format' | 'insertEgo' | 'resequence';
      readonly sessionId: string;
    });
  }

  export type ExportError = DatabaseError | OutputError;

  export function describeExportError(error: unknown, stage?: string): string;
}
