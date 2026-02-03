# Offline E2E Tests

This directory contains end-to-end tests for the offline functionality in Fresco.

## Test Files

### `enable-offline-mode.spec.ts`
Tests the basic workflow of enabling offline mode and downloading protocols:

**Read-only tests:**
- Verifies offline mode section is visible in settings
- Checks offline mode toggle exists and is functional
- Verifies storage usage section is visible
- Visual snapshot of offline mode settings card

**Mutation tests:**
- Enable/disable offline mode toggle and verify localStorage persistence
- Download a protocol for offline use via the protocols table actions menu
- Verify download progress dialog appears during download
- Confirm "Available Offline" badge appears after successful download
- Visual snapshot of the download progress dialog

### `offline-interview.spec.ts`
Tests conducting interviews while offline:

**All mutation tests:**
- Start and conduct an interview while browser is offline
- Verify offline indicator appears when network is disconnected
- Start a new interview while completely offline
- Navigate between interview stages without network connection
- Verify data syncs automatically after reconnecting to network

### `conflict-resolution.spec.ts`
Tests conflict detection and resolution when the same interview is modified offline and online:

**All mutation tests:**
- Detect conflicts between local offline changes and server changes
- Resolve conflicts by choosing "Keep Local" option
- Resolve conflicts by choosing "Keep Server" option
- Resolve conflicts by choosing "Keep Both" option (creates duplicate)
- Visual snapshot of the conflict resolution dialog
- Verify no conflict dialog when changes are identical
- Verify conflict indicator appears in UI when conflict is detected

## Testing Patterns

These tests follow the standard E2E testing patterns for the Fresco project:

1. **Database Isolation**: Each test suite uses `database.restoreSnapshot()` in `beforeAll` to acquire a shared lock and restore the database to a known state.

2. **Read-only vs Mutations**: Tests are organized into "Read-only" and "Mutations" describe blocks:
   - Read-only tests can run in parallel across files (protected by shared lock)
   - Mutation tests run serially and use `database.isolate()` for exclusive access

3. **Element Selection**: Tests prefer semantic selectors:
   - `getByRole()` for interactive elements and landmarks
   - `getByTestId()` for non-semantic elements (e.g., `offline-mode-field`)
   - Avoid `getByText()` to prevent brittleness

4. **Offline Testing**: Uses Playwright's `page.context().setOffline(true/false)` to simulate network disconnection.

## Running the Tests

Run all offline tests:
```bash
pnpm test:e2e --grep offline
```

Run a specific test file:
```bash
pnpm test:e2e tests/e2e/specs/offline/enable-offline-mode.spec.ts
```

## Edge Cases Identified

During implementation, the following edge cases were noted but not fully tested:

1. **Storage Quota Exceeded**: What happens when device storage is full during protocol download?
   - The current implementation shows a warning at 80% and blocks at 95%
   - Need to test actual behavior when quota is exceeded mid-download

2. **Partial Download Failure**: Network interruption during protocol asset download
   - Tests should verify cleanup of partial downloads
   - Should test resume capability if implemented

3. **Multiple Simultaneous Downloads**: Downloading multiple protocols concurrently
   - Current implementation may not handle this well
   - Need to test queue behavior and progress tracking

4. **Conflict Resolution Edge Cases**:
   - What happens when a conflict exists for a completed interview?
   - Can conflicts occur across multiple interview stages?
   - How are conflicts handled if user navigates away during resolution?

5. **Offline Mode Disabled During Active Interview**:
   - What happens if offline mode is disabled while an interview is in progress offline?
   - Should test data persistence and sync behavior

6. **Service Worker Updates**:
   - How does the offline functionality handle service worker updates?
   - Should test cache invalidation and re-download scenarios

7. **Interview State Corruption**:
   - What happens if localStorage data becomes corrupted?
   - Need validation and error recovery tests

8. **Large Protocol Downloads**:
   - Test with protocols containing many large images/videos
   - Verify progress tracking accuracy and cancellation behavior

## Future Improvements

1. Add tests for network reconnection edge cases (intermittent connection)
2. Test offline mode with multiple concurrent interviews
3. Add performance tests for large protocol downloads
4. Test conflict resolution with complex multi-stage interview scenarios
5. Add tests for error recovery when sync fails repeatedly
6. Test storage cleanup and protocol removal from offline cache
