# Export Progress Feedback

## Overview

Add real-time progress feedback to the interview data export process. When a user starts an export, the dialog closes immediately and a persistent toast shows pipeline progress — stage labels, per-file counts during file generation, and a progress bar. The user can continue navigating the dashboard while the export runs. Multiple concurrent exports are supported.

## Architecture

### SSE Route Handler

A new route handler at `/api/export-interviews` replaces the `exportInterviews` server action for running the export pipeline. It streams Server-Sent Events (SSE) as the pipeline progresses, following the same pattern as `/api/generate-test-interviews`.

The route handler:

1. Authenticates with `requireApiAuth()`
2. Validates the request body against a Zod schema (interview IDs + export options)
3. Runs the export pipeline as an Effect program that pushes events to an `Effect.Queue`
4. Converts the queue to an `Effect.Stream`, maps events to SSE-formatted text, and produces the response via `Stream.toReadableStream`
5. Uses `safeRevalidateTag` for cache invalidation (route handler context)

### SSE Event Protocol

```
data: {"type":"stage","stage":"fetching","message":"Fetching interview data..."}
data: {"type":"stage","stage":"formatting","message":"Formatting sessions..."}
data: {"type":"stage","stage":"generating","message":"Generating files...","current":0,"total":18}
data: {"type":"progress","stage":"generating","current":5,"total":18}
data: {"type":"stage","stage":"archiving","message":"Creating archive..."}
data: {"type":"stage","stage":"uploading","message":"Uploading..."}
data: {"type":"complete","zipUrl":"https://...","zipKey":"networkCanvasExport-123.zip"}
data: {"type":"error","message":"Something went wrong"}
```

- `stage` events mark transitions between pipeline phases
- `progress` events provide per-file granularity within the generating stage
- `complete` returns the zip URL/key for the client to trigger download
- `error` communicates failures

### Pipeline Changes

The export pipeline (`lib/export/pipeline.ts`) is modified to accept an `Effect.Queue` and push progress events to it between steps.

The file generation step (`generateOutputFiles`) becomes an Effect-returning function (no longer wrapped in `Effect.tryPromise`). Its internals are converted from building an array of Promises and using `Promise.all` to using `Effect.forEach` with `{ concurrency: "unbounded" }`. Each file export is wrapped as an Effect via `Effect.tryPromise`, and per-file completion is tracked via `Effect.Ref` and reported to the queue via `Effect.tap`. The function signature changes from a curried async function to an Effect, and its callsite in `pipeline.ts` updates accordingly (direct `yield*` instead of wrapping in `Effect.tryPromise`).

The `total` file count is computed eagerly before invoking `Effect.forEach` — the existing code already builds the full list of export items (sessions x formats x entity types) before executing them. This count is sent with the initial `stage: 'generating'` event so the client knows the total from the start.

The SSE stream is modeled as:

```
Queue (pipeline pushes events) → Stream.fromQueue → Stream.map (SSE format) → Stream.toReadableStream → Response
```

The pipeline and stream consumer run as concurrent Effect fibers. Cancellation is handled by Effect's fiber interruption — when the client disconnects, the stream closes, which interrupts the pipeline fiber.

### Client-Side Architecture

#### ExportProgressProvider

A React context provider that lives in the dashboard layout (`app/dashboard/layout.tsx`). It manages active exports and provides:

- `startExport(interviewIds, exportOptions)` — kicks off the SSE fetch, creates the progress toast, returns immediately
- Internally manages an `AbortController` per export for cancellation

#### Flow

1. User selects interviews and clicks export
2. Export options dialog opens (unchanged)
3. User clicks "Start export process"
4. Dialog closes immediately
5. `startExport()` is called from the context
6. A persistent toast appears showing the current pipeline stage
7. User can navigate the dashboard freely
8. As SSE events arrive, the toast is updated via `toast.update(id, ...)`
9. On complete: zip is fetched and downloaded automatically, toast transitions to success and auto-dismisses after 5 seconds
10. On error: toast transitions to error state and stays until dismissed
11. After successful download: `updateExportTime` server action is called to update interview export timestamps
12. Cleanup: temporary zip file is deleted from UploadThing after download
13. PostHog event tracking: client-side `posthog.captureException` on error, preserved from existing flow

#### Cancellation

- Each progress toast has a dedicated "Cancel" button in the toast body
- The toast's `onClose` callback also aborts the export (closing = cancelling)
- Aborting the `AbortController` closes the SSE stream
- The route handler detects disconnection via Effect fiber interruption and cleans up temp files

#### Concurrent Exports

Multiple exports can run simultaneously. Each gets its own toast, SSE connection, and AbortController. No race conditions — each export uses its own temp directory and unique zip filename.

### Toast System Changes

The existing `@base-ui/react` toast system supports everything needed:

- `timeout: 0` makes a toast persistent (never auto-dismisses). Note: `type` is purely a visual variant and does not affect persistence — always set `timeout: 0` explicitly for persistent toasts.
- `update(id, data)` modifies title, description, type, and timeout on an existing toast
- `close(id)` dismisses a specific toast

Changes to `components/ui/Toast.tsx`:

- Add `loading` variant to `toastVariants` CVA config (styling)
- Add a spinner icon to `variantIcons` for the `loading` type
- Add support for a cancel action button in the toast body (via `ToastData`)

The progress toast description is a React node containing the stage label text, and during the generating stage, an inline `ProgressBar` component.

#### Toast States

**During export (persistent, `type: 'loading'`, `timeout: 0`):**

- Early stages (fetching, formatting, archiving, uploading): spinner + stage label + cancel button
- Generating stage: spinner + "Generating files... X / Y" + horizontal progress bar + cancel button

**On success (`type: 'success'`, `timeout: 5000`):**

- "Export complete!" with "Your download should start automatically."

**On error (`type: 'destructive'`, `timeout: 0`):**

- "Export failed" with error message, stays until dismissed

## Files Changed

### New

| File | Purpose |
|------|---------|
| `app/api/export-interviews/route.ts` | SSE route handler |
| `components/ExportProgressProvider.tsx` | React context for managing active exports |
| `schemas/export.ts` | Zod schema for route handler request body (reuses `ExportOptionsSchema` from `~/lib/network-exporters/utils/types`) |

### Modified

| File | Change |
|------|--------|
| `lib/export/pipeline.ts` | Accept `Effect.Queue`, push stage/progress events |
| `lib/network-exporters/formatters/session/generateOutputFiles.ts` | Convert to `Effect.forEach` with concurrency, track per-file progress via `Ref` |
| `app/dashboard/interviews/_components/ExportInterviewsDialog.tsx` | Replace server action call with `startExport()` from context, close immediately |
| `app/dashboard/layout.tsx` | Wrap children in `ExportProgressProvider` |
| `components/ui/Toast.tsx` | Add `loading` variant, spinner icon, cancel button support |
| `actions/interviews.ts` | Remove `exportInterviews` server action (replaced by route handler). `updateExportTime` stays. |

### Unchanged

- `lib/export/services/*`, `lib/export/layers/*`, `lib/export/errors.ts` — service abstractions
- `lib/network-exporters/formatters/*` (except `generateOutputFiles`) — formatters
- `app/dashboard/_components/InterviewsTable/InterviewsTable.tsx` — delegates to dialog, no changes needed

## Testing

- Unit tests for the modified `generateOutputFiles` Effect pipeline
- Unit tests for `ExportProgressProvider` (mock SSE, verify toast lifecycle)
- Storybook story for the toast loading variant with progress bar
- E2E test: trigger export, verify progress toast appears, verify download completes
