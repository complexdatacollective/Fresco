import { Context, type Effect } from 'effect';
import type { GetInterviewsForExportQuery } from '~/queries/interviews';
import type { DatabaseError } from '~/lib/network-exporters/errors';

export type InterviewExportData = GetInterviewsForExportQuery[number];

export class InterviewRepository extends Context.Tag('InterviewRepository')<
  InterviewRepository,
  {
    readonly getForExport: (
      ids: string[],
    ) => Effect.Effect<InterviewExportData[], DatabaseError>;
  }
>() {}
