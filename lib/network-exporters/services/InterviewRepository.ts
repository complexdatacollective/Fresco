import { Context, type Effect } from 'effect';
import type { DatabaseError } from '~/lib/network-exporters/errors';
import type { InterviewExportInput } from '~/lib/network-exporters/input';

export class InterviewRepository extends Context.Tag(
  'NetworkExporters/InterviewRepository',
)<
  InterviewRepository,
  {
    readonly getForExport: (
      ids: readonly string[],
    ) => Effect.Effect<InterviewExportInput[], DatabaseError>;
  }
>() {}
