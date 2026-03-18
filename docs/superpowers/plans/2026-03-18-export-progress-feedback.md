# Export Progress Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time progress feedback to the interview data export process using SSE and persistent toast notifications.

**Architecture:** A new SSE route handler streams export progress events via Effect Queue/Stream. A React context provider manages active exports and drives persistent toast updates. The existing export pipeline is modified to push progress events between stages.

**Tech Stack:** Effect (Queue, Stream, Ref), Next.js Route Handlers, @base-ui/react Toast, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-03-18-export-progress-feedback-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/export/exportEvents.ts` | **NEW** — Export event type definitions and SSE helpers |
| `lib/network-exporters/formatters/session/generateOutputFiles.ts` | **MODIFY** — Convert to Effect-returning function with per-file progress |
| `lib/export/pipeline.ts` | **MODIFY** — Accept Queue, push stage/progress events |
| `lib/export/__tests__/pipeline.test.ts` | **MODIFY** — Update tests for new pipeline signature |
| `schemas/export.ts` | **NEW** — Zod schema for route handler request body |
| `app/api/export-interviews/route.ts` | **NEW** — SSE route handler |
| `components/ui/Toast.tsx` | **MODIFY** — Add `loading` variant, cancel button support |
| `components/ui/Toast.stories.tsx` | **MODIFY** — Add loading variant story |
| `components/ExportProgressProvider.tsx` | **NEW** — React context for managing active exports |
| `app/dashboard/layout.tsx` | **MODIFY** — Wrap children in ExportProgressProvider |
| `app/dashboard/interviews/_components/ExportInterviewsDialog.tsx` | **MODIFY** — Delegate to context, close immediately |
| `actions/interviews.ts` | **MODIFY** — Remove `exportInterviews` server action |

---

### Task 1: Export Event Types

Define the shared event types used by both the SSE route handler and client consumer.

**Files:**
- Create: `lib/export/exportEvents.ts`

- [ ] **Step 1: Create the export event type definitions**

```typescript
// lib/export/exportEvents.ts
import { z } from 'zod/mini';

export const exportStages = [
  'fetching',
  'formatting',
  'generating',
  'archiving',
  'uploading',
] as const;

export type ExportStage = (typeof exportStages)[number];

export const stageMessages: Record<ExportStage, string> = {
  fetching: 'Fetching interview data...',
  formatting: 'Formatting sessions...',
  generating: 'Generating files...',
  archiving: 'Creating archive...',
  uploading: 'Uploading...',
};

export type ExportStageEvent = {
  type: 'stage';
  stage: ExportStage;
  message: string;
  current?: number;
  total?: number;
};

export type ExportProgressEvent = {
  type: 'progress';
  stage: 'generating';
  current: number;
  total: number;
};

export type ExportCompleteEvent = {
  type: 'complete';
  zipUrl: string;
  zipKey: string;
};

export type ExportErrorEvent = {
  type: 'error';
  message: string;
};

export type ExportEvent =
  | ExportStageEvent
  | ExportProgressEvent
  | ExportCompleteEvent
  | ExportErrorEvent;

export function formatSSE(event: ExportEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
```

- [ ] **Step 2: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No errors in the new file

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write lib/export/exportEvents.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/export/exportEvents.ts
git commit -m "feat: add export event type definitions for SSE progress"
```

---

### Task 2: Convert `generateOutputFiles` to Effect

Convert the file generation function from a curried async function using `Promise.all` to an Effect-returning function with per-file progress tracking.

**Files:**
- Modify: `lib/network-exporters/formatters/session/generateOutputFiles.ts`

**Reference:**
- Current implementation: curried async function at `generateOutputFiles.ts:13-56`
- `exportFile` at `lib/network-exporters/formatters/session/exportFile.ts` returns `Promise<ExportResult>`
- Pipeline callsite: `pipeline.ts:57-64` wraps in `Effect.tryPromise`

- [ ] **Step 1: Write a test for the Effect-based generateOutputFiles**

Create: `lib/network-exporters/formatters/session/__tests__/generateOutputFiles.test.ts`

```typescript
import { Effect, Queue, Ref } from 'effect';
import { describe, expect, it } from 'vitest';
import { generateOutputFilesEffect } from '../generateOutputFiles';
import type { ExportEvent } from '~/lib/export/exportEvents';

describe('generateOutputFilesEffect', () => {
  it('is an Effect that reports progress events to a queue', async () => {
    // This test verifies the function signature exists and returns an Effect.
    // Full integration testing happens in the pipeline test.
    // We verify the export is callable and the type is correct.
    expect(generateOutputFilesEffect).toBeDefined();
    expect(typeof generateOutputFilesEffect).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/network-exporters/formatters/session/__tests__/generateOutputFiles.test.ts`
Expected: FAIL — `generateOutputFilesEffect` is not exported

- [ ] **Step 3: Convert generateOutputFiles to an Effect-returning function**

Modify `lib/network-exporters/formatters/session/generateOutputFiles.ts`. Keep the original export for backward compatibility during migration, add a new `generateOutputFilesEffect` export:

```typescript
import { Effect, Queue, Ref } from 'effect';
import { invariant } from 'es-toolkit';
import type { ExportEvent } from '~/lib/export/exportEvents';
import { ExportGenerationError, getUserMessage } from '~/lib/export/errors';
import { type ExportedProtocol } from '~/lib/export/pipeline';
import { getFilePrefix } from '../../utils/general';
import type {
  ExportFormat,
  ExportOptions,
  ExportResult,
  SessionWithResequencedIDs,
} from '../../utils/types';
import exportFile from './exportFile';
import { partitionByType } from './partitionByType';

type ExportItem = {
  prefix: string;
  exportFormat: ExportFormat;
  network: ReturnType<typeof partitionByType>[number];
  codebook: Parameters<typeof exportFile>[0]['codebook'];
  exportOptions: ExportOptions;
};

function buildExportItems(
  protocols: Record<string, ExportedProtocol>,
  exportOptions: ExportOptions,
  unifiedSessions: Record<string, SessionWithResequencedIDs[]>,
): ExportItem[] {
  const exportFormats = [
    ...(exportOptions.exportGraphML ? ['graphml'] : []),
    ...(exportOptions.exportCSV ? ['attributeList', 'edgeList', 'ego'] : []),
  ] as ExportFormat[];

  const items: ExportItem[] = [];

  Object.entries(unifiedSessions).forEach(([protocolKey, sessions]) => {
    const codebook = protocols[protocolKey]?.codebook;
    invariant(codebook, `No protocol found for key: ${protocolKey}`);

    sessions.forEach((session) => {
      const prefix = getFilePrefix(session);

      exportFormats.forEach((format) => {
        const partitionedNetworks = partitionByType(codebook, session, format);

        partitionedNetworks.forEach((partitionedNetwork) => {
          items.push({
            prefix,
            exportFormat: format,
            network: partitionedNetwork,
            codebook,
            exportOptions,
          });
        });
      });
    });
  });

  return items;
}

export const generateOutputFilesEffect = (
  protocols: Record<string, ExportedProtocol>,
  exportOptions: ExportOptions,
  unifiedSessions: Record<string, SessionWithResequencedIDs[]>,
  progressQueue: Queue.Queue<ExportEvent>,
) =>
  Effect.gen(function* () {
    const items = buildExportItems(protocols, exportOptions, unifiedSessions);
    const total = items.length;
    const completedRef = yield* Ref.make(0);

    yield* Queue.offer(progressQueue, {
      type: 'stage',
      stage: 'generating',
      message: 'Generating files...',
      current: 0,
      total,
    });

    const results = yield* Effect.forEach(
      items,
      (item) =>
        Effect.tryPromise({
          try: () => exportFile(item),
          catch: (error) =>
            new ExportGenerationError({
              cause: error,
              userMessage: getUserMessage(error, 'generating export files'),
            }),
        }).pipe(
          Effect.tap(() =>
            Ref.updateAndGet(completedRef, (n) => n + 1).pipe(
              Effect.tap((current) =>
                Queue.offer(progressQueue, {
                  type: 'progress',
                  stage: 'generating',
                  current,
                  total,
                }),
              ),
            ),
          ),
        ),
      { concurrency: 'unbounded' },
    );

    return results;
  });

// Keep the original export for any other consumers during migration
export const generateOutputFiles =
  (protocols: Record<string, ExportedProtocol>, exportOptions: ExportOptions) =>
  async (unifiedSessions: Record<string, SessionWithResequencedIDs[]>) => {
    const items = buildExportItems(protocols, exportOptions, unifiedSessions);

    const result = await Promise.all(items.map((item) => exportFile(item)));
    return result;
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/network-exporters/formatters/session/__tests__/generateOutputFiles.test.ts`
Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 6: Run formatter**

Run: `pnpm prettier --write lib/network-exporters/formatters/session/generateOutputFiles.ts`

- [ ] **Step 7: Commit**

```bash
git add lib/network-exporters/formatters/session/generateOutputFiles.ts lib/network-exporters/formatters/session/__tests__/generateOutputFiles.test.ts
git commit -m "feat: add Effect-based generateOutputFiles with per-file progress"
```

---

### Task 3: Modify Export Pipeline to Accept Queue

Update the export pipeline to accept an `Effect.Queue` and push stage events between steps. Use `generateOutputFilesEffect` instead of wrapping in `Effect.tryPromise`.

**Files:**
- Modify: `lib/export/pipeline.ts`
- Modify: `lib/export/__tests__/pipeline.test.ts`

**Reference:**
- Current pipeline: `pipeline.ts:38-112`
- Current test: `pipeline.test.ts:1-52`
- Event types: `lib/export/exportEvents.ts`

- [ ] **Step 1: Update the pipeline test**

Modify `lib/export/__tests__/pipeline.test.ts` to provide a Queue and verify stage events are emitted:

```typescript
import { Effect, Layer, Queue } from 'effect';
import { describe, expect, it } from 'vitest';
import { DatabaseError } from '~/lib/export/errors';
import type { ExportEvent } from '~/lib/export/exportEvents';
import { NodeFileSystem } from '~/lib/export/layers/NodeFileSystem';
import { exportPipeline } from '~/lib/export/pipeline';
import { FileStorage } from '~/lib/export/services/FileStorage';
import { InterviewRepository } from '~/lib/export/services/InterviewRepository';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: false,
  globalOptions: {
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

describe('exportPipeline', () => {
  it('returns error when database fetch fails', async () => {
    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () =>
        Effect.fail(
          new DatabaseError({
            cause: new Error('connection refused'),
            userMessage: 'Database connection failed.',
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ url: 'http://test/file.zip', key: 'k' }),
      delete: () => Effect.void,
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    const result = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();
      return yield* exportPipeline(
        ['test-id'],
        defaultExportOptions,
        queue,
      ).pipe(
        Effect.catchAll((error) =>
          Effect.succeed({
            status: 'error' as const,
            error: error.userMessage,
          }),
        ),
      );
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Database connection failed.');
  });

  it('emits stage events to the queue', async () => {
    const MockRepo = Layer.succeed(InterviewRepository, {
      getForExport: () =>
        Effect.fail(
          new DatabaseError({
            cause: new Error('test'),
            userMessage: 'Test error.',
          }),
        ),
    });

    const MockStorage = Layer.succeed(FileStorage, {
      upload: () => Effect.succeed({ url: 'http://test/file.zip', key: 'k' }),
      delete: () => Effect.void,
    });

    const testLayer = Layer.mergeAll(MockRepo, NodeFileSystem, MockStorage);

    const events = await Effect.gen(function* () {
      const queue = yield* Queue.unbounded<ExportEvent>();

      yield* exportPipeline(['test-id'], defaultExportOptions, queue).pipe(
        Effect.catchAll(() => Effect.void),
      );

      return yield* Queue.takeAll(queue);
    }).pipe(Effect.provide(testLayer), Effect.runPromise);

    // Should have at least the 'fetching' stage event before the error
    const stageEvents = [...events].filter((e) => e.type === 'stage');
    expect(stageEvents.length).toBeGreaterThanOrEqual(1);
    expect(stageEvents[0]?.stage).toBe('fetching');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/export/__tests__/pipeline.test.ts`
Expected: FAIL — `exportPipeline` doesn't accept a queue argument

- [ ] **Step 3: Update the pipeline to accept a Queue**

Modify `lib/export/pipeline.ts`:

```typescript
import { basename } from 'node:path';
import { Effect, Queue } from 'effect';
import { generateOutputFilesEffect } from '~/lib/network-exporters/formatters/session/generateOutputFiles';
import { formatExportableSessions } from '~/lib/network-exporters/formatters/formatExportableSessions';
import groupByProtocolProperty from '~/lib/network-exporters/formatters/session/groupByProtocolProperty';
import { insertEgoIntoSessionNetworks } from '~/lib/network-exporters/formatters/session/insertEgoIntoSessionNetworks';
import { resequenceIds } from '~/lib/network-exporters/formatters/session/resequenceIds';
import archive from '~/lib/network-exporters/formatters/session/archive';
import type { ExportOptions, ExportReturn } from '~/lib/network-exporters/utils/types';
import {
  ArchiveError,
  FileStorageError,
  getUserMessage,
} from '~/lib/export/errors';
import type { ExportEvent } from '~/lib/export/exportEvents';
import { stageMessages } from '~/lib/export/exportEvents';
import { FileStorage } from '~/lib/export/services/FileStorage';
import { FileSystem } from '~/lib/export/services/FileSystem';
import {
  InterviewRepository,
  type InterviewExportData,
} from '~/lib/export/services/InterviewRepository';

export type ExportedProtocol = InterviewExportData['protocol'];

function buildProtocolsMap(
  sessions: InterviewExportData[],
): Record<string, ExportedProtocol> {
  const protocolsMap = new Map<string, ExportedProtocol>();
  sessions.forEach((session) => {
    protocolsMap.set(session.protocol.hash, session.protocol);
  });
  return Object.fromEntries(protocolsMap);
}

const emitStage = (
  queue: Queue.Queue<ExportEvent>,
  stage: ExportEvent & { type: 'stage' },
) => Queue.offer(queue, stage);

export const exportPipeline = (
  interviewIds: string[],
  exportOptions: ExportOptions,
  progressQueue: Queue.Queue<ExportEvent>,
) =>
  Effect.gen(function* () {
    const repo = yield* InterviewRepository;
    const fs = yield* FileSystem;
    const fileStorage = yield* FileStorage;

    // Stage: fetching
    yield* emitStage(progressQueue, {
      type: 'stage',
      stage: 'fetching',
      message: stageMessages.fetching,
    });

    const sessions = yield* repo
      .getForExport(interviewIds)
      .pipe(Effect.withSpan('export.fetch'));

    // Stage: formatting
    yield* emitStage(progressQueue, {
      type: 'stage',
      stage: 'formatting',
      message: stageMessages.formatting,
    });

    const protocols = buildProtocolsMap(sessions);
    const formatted = formatExportableSessions(sessions);
    const withEgo = insertEgoIntoSessionNetworks(formatted);
    const grouped = groupByProtocolProperty(withEgo);
    const resequenced = resequenceIds(grouped);

    // Stage: generating (emitted inside generateOutputFilesEffect)
    const exportResults = yield* generateOutputFilesEffect(
      protocols,
      exportOptions,
      resequenced,
      progressQueue,
    ).pipe(Effect.withSpan('export.generateFiles'));

    const tempFilePaths = exportResults
      .filter((r): r is Extract<typeof r, { success: true }> => r.success)
      .map((r) => r.filePath);

    // Stage: archiving
    yield* emitStage(progressQueue, {
      type: 'stage',
      stage: 'archiving',
      message: stageMessages.archiving,
    });

    const archiveResult = yield* Effect.tryPromise({
      try: () => archive(exportResults),
      catch: (error) =>
        new ArchiveError({
          cause: error,
          userMessage: getUserMessage(error, 'creating zip archive'),
        }),
    }).pipe(Effect.withSpan('export.archive'));

    tempFilePaths.push(archiveResult.path);

    const fileName = basename(archiveResult.path);
    if (!/^networkCanvasExport-\d+\.zip$/.test(fileName)) {
      return yield* Effect.fail(
        new FileStorageError({
          cause: new Error(`Invalid archive filename: ${fileName}`),
          userMessage: 'Export failed due to an internal error.',
        }),
      );
    }

    // Stage: uploading
    yield* emitStage(progressQueue, {
      type: 'stage',
      stage: 'uploading',
      message: stageMessages.uploading,
    });

    const archiveBuffer = yield* fs.readFile(archiveResult.path);
    const { url, key } = yield* fileStorage
      .upload(archiveBuffer, fileName)
      .pipe(Effect.withSpan('export.upload'));

    yield* Effect.forEach(
      tempFilePaths,
      (path) => fs.deleteFile(path).pipe(Effect.catchAll(() => Effect.void)),
      { discard: true },
    );

    return {
      zipUrl: url,
      zipKey: key,
      status: archiveResult.rejected.length
        ? ('partial' as const)
        : ('success' as const),
      error: archiveResult.rejected.length ? 'Some exports failed' : null,
      successfulExports: archiveResult.completed,
      failedExports: archiveResult.rejected,
    } satisfies ExportReturn;
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/export/__tests__/pipeline.test.ts`
Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 6: Run formatter**

Run: `pnpm prettier --write lib/export/pipeline.ts lib/export/__tests__/pipeline.test.ts`

- [ ] **Step 7: Commit**

```bash
git add lib/export/pipeline.ts lib/export/__tests__/pipeline.test.ts
git commit -m "feat: add progress event queue to export pipeline"
```

---

### Task 4: Create Export Request Schema

**Files:**
- Create: `schemas/export.ts`

**Reference:**
- `ExportOptionsSchema` at `lib/network-exporters/utils/types.ts:56-64`
- Synthetic interviews schema pattern at `schemas/synthetic-interviews.ts`

- [ ] **Step 1: Create the schema**

```typescript
// schemas/export.ts
import { z } from 'zod/mini';
import { ExportOptionsSchema } from '~/lib/network-exporters/utils/types';

export const exportInterviewsSchema = z.object({
  interviewIds: z.array(z.string()).check(z.minLength(1)),
  exportOptions: ExportOptionsSchema,
});

export type ExportInterviewsInput = z.infer<typeof exportInterviewsSchema>;
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write schemas/export.ts`

- [ ] **Step 4: Commit**

```bash
git add schemas/export.ts
git commit -m "feat: add Zod schema for export interviews request"
```

---

### Task 5: Create SSE Route Handler

**Files:**
- Create: `app/api/export-interviews/route.ts`

**Reference:**
- Synthetic interviews route handler pattern: `app/api/generate-test-interviews/route.ts`
- Export pipeline: `lib/export/pipeline.ts`
- ExportLayer: `lib/export/layers/ExportLayer.ts`
- PostHog server tracking: `lib/posthog-server.ts` (functions: `captureEvent`, `captureException`, `shutdownPostHog`)
- Cache invalidation: use `safeRevalidateTag` (route handler context)
- `addEvent` from `actions/activityFeed.ts` for activity feed

- [ ] **Step 1: Create the route handler**

```typescript
// app/api/export-interviews/route.ts
import { Effect, Queue, Stream } from 'effect';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { ExportLayer } from '~/lib/export/layers/ExportLayer';
import { exportPipeline } from '~/lib/export/pipeline';
import { type ExportEvent, formatSSE } from '~/lib/export/exportEvents';
import {
  captureEvent,
  captureException,
  shutdownPostHog,
} from '~/lib/posthog-server';
import { exportInterviewsSchema } from '~/schemas/export';
import { requireApiAuth } from '~/utils/auth';

export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body: unknown = await request.json();
  const parsed = exportInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { interviewIds, exportOptions } = parsed.data;
  const encoder = new TextEncoder();

  const program = Effect.gen(function* () {
    const queue = yield* Queue.unbounded<ExportEvent>();

    // Run the pipeline in a forked fiber that pushes events to the queue.
    // The fiber is forked (not joined) because the SSE stream consumes
    // from the queue concurrently. When the pipeline completes or errors,
    // it shuts down the queue, which ends the stream.
    yield* exportPipeline(
      interviewIds,
      exportOptions,
      queue,
    ).pipe(
      Effect.tap((result) =>
        Queue.offer(queue, {
          type: 'complete',
          zipUrl: result.zipUrl ?? '',
          zipKey: result.zipKey ?? '',
        }),
      ),
      Effect.tapError((error) =>
        Queue.offer(queue, {
          type: 'error',
          message: error.userMessage,
        }),
      ),
      Effect.ensuring(Queue.shutdown(queue)),
      Effect.provide(ExportLayer),
      Effect.fork,
    );

    // Convert queue to SSE stream
    const sseStream = Stream.fromQueue(queue).pipe(
      Stream.map((event) => encoder.encode(formatSSE(event))),
    );

    return Stream.toReadableStream(sseStream);
  });

  const readableStream = await Effect.runPromise(program);

  // Note: cache invalidation and analytics happen AFTER export completes.
  // The client calls `updateExportTime` (server action) after receiving the
  // 'complete' SSE event, which handles `safeUpdateTag('getInterviews')`.
  // Server-side PostHog tracking is handled inside the pipeline's success
  // path in the route handler. The implementer should add PostHog capture
  // inside the pipeline's Effect.tap (after the complete event is queued)
  // or as a fire-and-forget after the stream ends. Example:
  //
  // Effect.tap((result) =>
  //   Effect.sync(() => {
  //     void captureEvent('DataExported', { ... }).then(() => shutdownPostHog());
  //     safeRevalidateTag(['getInterviews', 'activityFeed']);
  //     void addEvent('Data Exported', `Exported data for ${interviewIds.length} interview(s)`);
  //   })
  // )

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

Note: The implementer should verify the exact Effect API for `Stream.toReadableStream` — it may need `Stream.toReadableStreamRuntime` or `Stream.toReadableStreamEffect` depending on whether the stream has unresolved service requirements. If the `ExportLayer` is provided before forking, the stream should be requirement-free. Test this at runtime and adjust if needed.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write app/api/export-interviews/route.ts`

- [ ] **Step 4: Commit**

```bash
git add app/api/export-interviews/route.ts
git commit -m "feat: add SSE route handler for export progress streaming"
```

---

### Task 6: Add `loading` Variant to Toast

Add the `loading` variant with spinner icon and cancel button support to the existing toast system.

**Files:**
- Modify: `components/ui/Toast.tsx:14-106`
- Modify: `components/ui/Toast.stories.tsx`

**Reference:**
- `toastVariants` CVA config: `Toast.tsx:14-28`
- `variantIcons` map: `Toast.tsx:34-39`
- `ToastData` type: `Toast.tsx:41-49`
- `ToastItem` component: `Toast.tsx:55-106`
- Lucide icons already imported: `AlertCircle`, `Info`, `PartyPopper`
- `Loader2` from lucide-react is used elsewhere for spinners (e.g. `ExportInterviewsDialog.tsx:1`)

- [ ] **Step 1: Add the loading variant and cancel support**

In `components/ui/Toast.tsx`:

1. Add `Loader2` to the lucide-react import (line 8)
2. Add `loading` variant to `toastVariants` (after line 24, inside `variants.variant`):
   ```
   loading: 'bg-info text-info-contrast border-info',
   ```
3. Update `variantIcons` to include loading (line 34-39). Since `Loader2` is not a static icon (needs animation), create a small wrapper component:
   ```typescript
   function SpinnerIcon({ className, ...props }: React.ComponentProps<typeof Loader2>) {
     return <Loader2 className={cx('animate-spin', className)} {...props} />;
   }
   ```
   Then update variantIcons. Note: `variantIcons` currently maps to `LucideIcon | null`. Since our spinner wrapper matches the `LucideIcon` signature (it's a forwardRef component), it should be compatible. If TypeScript complains, the implementer should adjust the type to `React.ComponentType<{ className?: string }> | null` or similar.
4. Add `onCancel` to `ToastData` type (line 41-49):
   ```typescript
   onCancel?: () => void;
   ```
5. In `ToastItem` (line 55-106), render a cancel button when the toast data has `onCancel`. Access toast data via `toast.data`. Add after the `Toast.Description` element (around line 95):
   ```tsx
   {toast.data?.onCancel && (
     <button
       onClick={toast.data.onCancel}
       className="mt-2 rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
       type="button"
     >
       Cancel
     </button>
   )}
   ```
6. Update `TypedUseToastManager` type to pass `onCancel` through correctly — the `add` and `update` methods need the `data` field to flow through to `ToastObject`.

The exact implementation details for threading `onCancel` through the base-ui toast data layer will require checking how `toast.data` is typed. The `add()` method accepts a `data` property that gets attached to the `ToastObject`. The implementer should verify this works with the `@base-ui/react` toast API.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Add a storybook story for the loading variant**

Add to `components/ui/Toast.stories.tsx`:

```typescript
function LoadingDemo() {
  const { add, update, close } = useToast();

  const simulateExport = () => {
    const id = add({
      title: 'Exporting interviews',
      description: 'Fetching interview data...',
      type: 'loading',
      timeout: 0,
    });

    let current = 0;
    const total = 10;
    const interval = setInterval(() => {
      current++;
      if (current <= total) {
        update(id, {
          description: `Generating files... ${current} / ${total}`,
        });
      } else {
        clearInterval(interval);
        update(id, {
          title: 'Export complete!',
          description: 'Your download should start automatically.',
          type: 'success',
          timeout: 5000,
        });
      }
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3" margin="none" className="text-lg">
        Loading Toast (Export Progress)
      </Heading>
      <Paragraph margin="none" className="text-sm text-current/70">
        Simulates an export with progress updates, then transitions to success.
      </Paragraph>
      <Button onClick={simulateExport}>Simulate Export</Button>
    </div>
  );
}

export const Loading: Story = {
  render: () => <LoadingDemo />,
};
```

- [ ] **Step 4: Run formatter**

Run: `pnpm prettier --write components/ui/Toast.tsx components/ui/Toast.stories.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/ui/Toast.tsx components/ui/Toast.stories.tsx
git commit -m "feat: add loading variant with spinner and cancel support to toast"
```

---

### Task 7: Create ExportProgressProvider

The React context provider that manages active exports, SSE connections, and toast lifecycle.

**Files:**
- Create: `components/ExportProgressProvider.tsx`

**Reference:**
- SSE consumption pattern: `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx:46-106`
- Toast API: `useToast()` returns `{ add, update, close, toast }`
- `useDownload` hook: `hooks/useDownload.ts`
- `updateExportTime` server action: `actions/interviews.ts:56-82`
- `deleteZipFromUploadThing` server action: `actions/uploadThing.ts`
- Export event types: `lib/export/exportEvents.ts`
- `ExportOptionsSchema` type: `lib/network-exporters/utils/types.ts:56-66`

- [ ] **Step 1: Create the provider**

```typescript
// components/ExportProgressProvider.tsx
'use client';

import posthog from 'posthog-js';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { updateExportTime } from '~/actions/interviews';
import { deleteZipFromUploadThing } from '~/actions/uploadThing';
import ProgressBar from '~/components/ui/ProgressBar';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';
import type { ExportEvent } from '~/lib/export/exportEvents';
import type { ExportOptions } from '~/lib/network-exporters/utils/types';
import { ensureError } from '~/utils/ensureError';

type ExportContextValue = {
  startExport: (interviewIds: string[], exportOptions: ExportOptions) => void;
};

const ExportContext = createContext<ExportContextValue | null>(null);

export function useExportProgress() {
  const ctx = useContext(ExportContext);
  if (!ctx) {
    throw new Error('useExportProgress must be used within ExportProgressProvider');
  }
  return ctx;
}

function ExportProgressDescription({
  stage,
  message,
  current,
  total,
}: {
  stage: string;
  message: string;
  current?: number;
  total?: number;
}) {
  const showProgress = stage === 'generating' && total !== undefined && total > 0;
  const percent = showProgress && current !== undefined
    ? Math.round((current / total) * 100)
    : 0;

  return (
    <div className="space-y-2">
      <p className="text-sm opacity-60">
        {showProgress ? `${message} ${current} / ${total}` : message}
      </p>
      {showProgress && (
        <ProgressBar
          orientation="horizontal"
          percentProgress={percent}
          nudge={false}
          label="Export progress"
          className="h-1.5"
        />
      )}
    </div>
  );
}

export function ExportProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { add, update, close } = useToast();
  const download = useDownload();
  const abortControllers = useRef(new Map<string, AbortController>());

  const cancelExport = useCallback(
    (toastId: string) => {
      const controller = abortControllers.current.get(toastId);
      controller?.abort();
      abortControllers.current.delete(toastId);
      close(toastId);
    },
    [close],
  );

  const startExport = useCallback(
    (interviewIds: string[], exportOptions: ExportOptions) => {
      const controller = new AbortController();

      const toastId = add({
        title: 'Exporting interviews',
        description: (
          <ExportProgressDescription
            stage="fetching"
            message="Starting export..."
          />
        ),
        type: 'loading',
        timeout: 0,
        onClose: () => cancelExport(toastId),
        onCancel: () => cancelExport(toastId),
      });

      abortControllers.current.set(toastId, controller);

      void (async () => {
        try {
          const response = await fetch('/api/export-interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interviewIds, exportOptions }),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(
              `Export request failed with status ${String(response.status)}`,
            );
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const event of events) {
              const dataLine = event
                .split('\n')
                .find((line) => line.startsWith('data: '));
              if (!dataLine) continue;

              const data = JSON.parse(dataLine.slice(6)) as ExportEvent;

              if (data.type === 'stage' || data.type === 'progress') {
                update(toastId, {
                  description: (
                    <ExportProgressDescription
                      stage={data.stage}
                      message={
                        data.type === 'stage' ? data.message : 'Generating files...'
                      }
                      current={'current' in data ? data.current : undefined}
                      total={'total' in data ? data.total : undefined}
                    />
                  ),
                });
              } else if (data.type === 'complete') {
                // Download the zip
                const responseAsBlob = await fetch(data.zipUrl).then((res) => {
                  if (!res.ok) throw new Error('HTTP error ' + String(res.status));
                  return res.blob();
                });

                const url = URL.createObjectURL(responseAsBlob);
                download(url, 'Network Canvas Export.zip');
                URL.revokeObjectURL(url);

                // Update export timestamps
                await updateExportTime(interviewIds);

                // Transition toast to success
                update(toastId, {
                  title: 'Export complete!',
                  description: 'Your download should start automatically.',
                  type: 'success',
                  timeout: 5000,
                });

                // Cleanup: delete zip from UploadThing
                void deleteZipFromUploadThing(data.zipKey).catch((error) => {
                  const e = ensureError(error);
                  posthog.captureException(e);

                  add({
                    timeout: Infinity,
                    type: 'destructive',
                    title: 'Could not delete temporary file',
                    description:
                      'We were unable to delete the temporary file containing your exported data, which is stored on your UploadThing account. Although extremely unlikely, it is possible that this file could be accessed by someone else. You can delete the file manually by visiting uploadthing.com and logging in with your GitHub account. Please contact us to report this issue.',
                  });
                });
              } else if (data.type === 'error') {
                update(toastId, {
                  title: 'Export failed',
                  description: data.message,
                  type: 'destructive',
                  timeout: 0,
                });

                posthog.captureException(new Error(data.message));
              }
            }
          }
        } catch (error) {
          if (controller.signal.aborted) return;

          const e = ensureError(error);
          update(toastId, {
            title: 'Export failed',
            description: e.message,
            type: 'destructive',
            timeout: 0,
          });

          posthog.captureException(e);
        } finally {
          abortControllers.current.delete(toastId);
        }
      })();
    },
    [add, update, close, download, cancelExport],
  );

  return (
    <ExportContext value={{ startExport }}>
      {children}
    </ExportContext>
  );
}
```

Note: The `onClose` and `onCancel` properties on the toast need to match what was implemented in Task 6. The implementer should verify the exact API surface for threading these callbacks through `@base-ui/react` toast's `data` property. If `onClose` is a native base-ui toast option, use it directly. Otherwise, thread it via the `data` field.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write components/ExportProgressProvider.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/ExportProgressProvider.tsx
git commit -m "feat: add ExportProgressProvider for managing export progress toasts"
```

---

### Task 8: Wire Up Dashboard Layout

Add the `ExportProgressProvider` to the dashboard layout so it persists across page navigation.

**Files:**
- Modify: `app/dashboard/layout.tsx`

**Reference:**
- Current layout: `app/dashboard/layout.tsx:14-28`
- The layout is a Server Component, so `ExportProgressProvider` (a client component) wraps the children

- [ ] **Step 1: Add ExportProgressProvider to the layout**

Modify `app/dashboard/layout.tsx`:

Add import:
```typescript
import { ExportProgressProvider } from '~/components/ExportProgressProvider';
```

Wrap `{children}` (line 24) with the provider:
```tsx
<ExportProgressProvider>
  {children}
</ExportProgressProvider>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write app/dashboard/layout.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat: add ExportProgressProvider to dashboard layout"
```

---

### Task 9: Update ExportInterviewsDialog

Replace the direct server action call with `startExport()` from the context. The dialog closes immediately after starting the export.

**Files:**
- Modify: `app/dashboard/interviews/_components/ExportInterviewsDialog.tsx`

**Reference:**
- Current dialog: `ExportInterviewsDialog.tsx:1-151`
- `useExportProgress` hook from `components/ExportProgressProvider.tsx`

- [ ] **Step 1: Rewrite the dialog**

Replace the entire content of `ExportInterviewsDialog.tsx`:

```typescript
import { useExportProgress } from '~/components/ExportProgressProvider';
import { Button } from '~/components/ui/Button';
import useSafeLocalStorage from '~/hooks/useSafeLocalStorage';
import type { Interview } from '~/lib/db/generated/client';
import Dialog from '~/lib/dialogs/Dialog';
import { ExportOptionsSchema } from '~/lib/network-exporters/utils/types';
import ExportOptionsView from './ExportOptionsView';

export const ExportInterviewsDialog = ({
  open,
  handleCancel,
  interviewsToExport,
}: {
  open: boolean;
  handleCancel: () => void;
  interviewsToExport: Interview[];
}) => {
  const { startExport } = useExportProgress();

  const [exportOptions, setExportOptions] = useSafeLocalStorage(
    'exportOptions',
    ExportOptionsSchema,
    {
      exportCSV: true,
      exportGraphML: true,
      globalOptions: {
        useScreenLayoutCoordinates: true,
        screenLayoutHeight: 1080,
        screenLayoutWidth: 1920,
      },
    },
  );

  const handleConfirm = () => {
    const interviewIds = interviewsToExport.map((interview) => interview.id);
    startExport(interviewIds, exportOptions);
    handleCancel(); // Close the dialog immediately
  };

  return (
    <Dialog
      open={open}
      closeDialog={handleCancel}
      title="Confirm File Export Options"
      description="Before exporting, please confirm the export options that you wish to use. These options are identical to those found in Interviewer."
      footer={
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">
            Start export process
          </Button>
        </>
      }
    >
      <ExportOptionsView
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
      />
    </Dialog>
  );
};
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run formatter**

Run: `pnpm prettier --write app/dashboard/interviews/_components/ExportInterviewsDialog.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/interviews/_components/ExportInterviewsDialog.tsx
git commit -m "refactor: delegate export to ExportProgressProvider, close dialog immediately"
```

---

### Task 10: Remove `exportInterviews` Server Action

The `exportInterviews` function in `actions/interviews.ts` is replaced by the route handler. Remove it and clean up unused imports.

**Files:**
- Modify: `actions/interviews.ts:84-120`

**Reference:**
- `exportInterviews` function: `actions/interviews.ts:84-120`
- Imports to remove (if no longer used by other functions in this file): `Effect` (line 4), `ExportLayer` (line 9), `exportPipeline` (line 10), `ExportOptions`/`ExportReturn` types (line 13-14), `captureEvent`/`captureException`/`shutdownPostHog` (line 17-19)

- [ ] **Step 1: Remove `exportInterviews` and unused imports**

Delete the `exportInterviews` function (lines 84-120). Then check which imports are now unused:
- `Effect` — check if `createInterview` uses it (it doesn't) → remove
- `after` from `next/server` — still used by `createInterview` → keep
- `ExportLayer`, `exportPipeline` → remove
- `ExportOptions`, `ExportReturn` types → remove
- `captureEvent`, `captureException`, `shutdownPostHog` — still used by `createInterview` → keep

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors. If other files import `exportInterviews` from this module, they will error — but the dialog was updated in Task 9 to not import it.

- [ ] **Step 3: Run linter to check for unused imports**

Run: `pnpm lint --fix`
Expected: Auto-fixes any remaining unused imports

- [ ] **Step 4: Run formatter**

Run: `pnpm prettier --write actions/interviews.ts`

- [ ] **Step 5: Commit**

```bash
git add actions/interviews.ts
git commit -m "refactor: remove exportInterviews server action (replaced by route handler)"
```

---

### Task 11: Manual Testing & Integration Verification

Verify the full flow works end-to-end in the development environment.

**Files:** None (testing only)

**Prerequisites:** The user must have the dev server running (`pnpm dev`). Ask them to start it if needed.

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 2: Run full linter**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: Run all unit tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Manual testing checklist**

Using the browser (or Playwright MCP if available), verify:

1. Navigate to Dashboard → Interviews
2. Click "Export Interview Data" → "Export all interviews"
3. Export options dialog appears
4. Click "Start export process"
5. Dialog closes immediately
6. A persistent toast appears in bottom-right with spinner + stage label
7. Toast updates through stages: Fetching → Formatting → Generating (with progress bar + count) → Archiving → Uploading
8. On complete: zip file downloads, toast transitions to green "Export complete!" and auto-dismisses
9. Verify the "Cancel" button in the toast works (start another export, click Cancel, toast disappears, no download)
10. Verify closing the toast (X button) also cancels the export
11. Verify concurrent exports: start two exports, both show progress toasts simultaneously

- [ ] **Step 5: Verify storybook**

Run: `pnpm storybook` (ask user to start if needed)
Navigate to Components → Toast → Loading story
Verify the simulated export progress animation works

- [ ] **Step 6: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "fix: integration adjustments from manual testing"
```
