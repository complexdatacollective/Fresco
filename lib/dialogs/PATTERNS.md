# Dialog Async Action Patterns

When a dialog confirmation triggers an asynchronous operation, choose the
appropriate pattern based on the operation's characteristics.

## Pattern 1: Async Confirm Dialog

**Use when:** The operation is short-lived (< 30s), safe to cancel, and can be
retried. The dialog stays open with a loading indicator, and cancel/close abort
the request.

**Examples:** Finishing an interview, deleting a record, toggling a setting.

**How it works:**

1. User clicks confirm — primary button enters loading state (spinner, disabled).
2. Cancel, close button, backdrop click, and Escape all trigger
   `AbortController.abort()` on the in-flight request.
3. On success: dialog closes, `confirm()` resolves with `true`.
4. On abort: dialog closes, `confirm()` resolves with `null`.
5. On error: error shown inline in dialog, user can retry or dismiss.

```tsx
import useDialog from '~/lib/dialogs/useDialog';

function MyComponent() {
  const { confirm } = useDialog();

  const handleAction = async () => {
    const result = await confirm({
      title: 'Finish Interview',
      description: 'Your responses cannot be changed after finishing.',
      confirmLabel: 'Finish Interview',
      onConfirm: async (signal: AbortSignal) => {
        const response = await fetch('/api/interviews/123/finish', {
          method: 'POST',
          signal,
        });
        if (!response.ok) {
          throw new Error('Failed to finish interview');
        }
      },
    });

    if (result === true) {
      router.push('/interview/finished');
    }
    // result === false: user cancelled before confirming
    // result === null: user aborted during action, or error occurred
  };
}
```

**Return values:**

| Value   | Meaning                                      |
| ------- | -------------------------------------------- |
| `true`  | Action completed successfully                |
| `false` | User cancelled before confirming             |
| `null`  | User aborted during action, or action failed |

## Pattern 2: Dedicated Progress Page

**Use when:** The operation is long-running (> 30s), irreversible, or too costly
to cancel. The dialog collects intent and closes immediately, then the UI
transitions to a dedicated progress view.

**Examples:** Bulk data export, protocol migration, batch operations.

**How it works:**

1. Dialog collects user intent and closes immediately (sync `onConfirm`).
2. UI navigates to or renders a dedicated progress view.
3. Progress view polls the server or uses SSE/WebSockets for status updates.
4. No abort — the action is committed once started.

```tsx
import useDialog from '~/lib/dialogs/useDialog';

function BulkExportComponent() {
  const { confirm } = useDialog();
  const router = useRouter();

  const handleExport = async () => {
    const result = await confirm({
      title: 'Export All Data',
      description:
        'This will export all interview data. This process cannot be ' +
        'cancelled once started and may take several minutes.',
      confirmLabel: 'Start Export',
      intent: 'default',
      onConfirm: () => {
        // Sync — just collect intent, no async work here
      },
    });

    if (result === true) {
      // Navigate to a dedicated progress page
      router.push('/dashboard/export/progress?jobId=abc123');
    }
  };
}

// Progress page component
function ExportProgressPage({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<'running' | 'complete' | 'error'>(
    'running',
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/export/${jobId}/status`);
      const data = await res.json();
      setProgress(data.progress);
      if (data.status !== 'running') {
        setStatus(data.status);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <Surface>
      <Heading level="h1">Exporting Data</Heading>
      <ProgressBar value={progress} />
      {status === 'complete' && <p>Export complete! Download your file.</p>}
      {status === 'error' && <p>Export failed. Please try again.</p>}
    </Surface>
  );
}
```

## Choosing Between Patterns

| Criteria      | Pattern 1 (Async Dialog) | Pattern 2 (Progress Page) |
| ------------- | ------------------------ | ------------------------- |
| Duration      | < 30 seconds             | > 30 seconds              |
| Cancellable   | Yes                      | No                        |
| Retryable     | Yes                      | Depends                   |
| Server impact | Idempotent               | May not be                |
| User feedback | Loading spinner + cancel | Full progress UI          |
| Complexity    | Low                      | Higher                    |
