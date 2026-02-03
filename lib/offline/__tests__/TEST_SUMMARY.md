# Phase 1 Test Summary: Foundation Infrastructure

This document summarizes the comprehensive test coverage for Phase 1 of the Offline Interview Capability.

## Test Files Created

### 1. `lib/offline/__tests__/db.test.ts` (29 tests)
Tests for the Dexie database schema and CRUD operations.

**Coverage:**
- Database initialization and schema validation
- CRUD operations for all 6 stores:
  - `interviews`: Offline interview data with sync status
  - `protocols`: Cached protocol definitions
  - `assets`: Cached protocol assets (images, videos, etc.)
  - `syncQueue`: Pending sync operations
  - `conflicts`: Detected data conflicts
  - `settings`: Offline system settings
- Index queries for efficient data retrieval
- TypeScript type safety validation

**Key Test Scenarios:**
- Adding, retrieving, updating, and deleting records
- Querying by indexed fields (protocolId, syncStatus, interviewId, etc.)
- Auto-increment IDs for syncQueue and conflicts
- Bulk operations for seeding data
- Filtering unresolved conflicts
- Upsert operations for settings

### 2. `hooks/__tests__/useNetworkStatus.test.ts` (8 tests)
Tests for the online/offline detection hook.

**Coverage:**
- Initial state based on `navigator.onLine`
- Response to `online` and `offline` events
- Multiple state transitions
- Proper cleanup of event listeners on unmount
- Graceful handling when navigator is undefined (SSR)

**Key Test Scenarios:**
- Starting online and going offline
- Starting offline and going online
- Multiple rapid transitions
- Memory leak prevention through proper cleanup
- No state updates after component unmount

### 3. `hooks/__tests__/useSyncStatus.test.ts` (13 tests)
Tests for the sync status hook with Dexie live queries.

**Coverage:**
- Zero state when database is empty
- Accurate counting of pending syncs
- Counting only unresolved conflicts (resolved conflicts ignored)
- Initialization status from settings
- Reactive updates when database changes
- Simultaneous updates across all metrics

**Key Test Scenarios:**
- Empty database returns zero counts
- Adding items to syncQueue increases pending count
- Adding unresolved conflicts increases conflict count
- Resolving conflicts decreases conflict count
- Setting initialization flag updates isInitialized
- All metrics update independently and correctly

### 4. `lib/offline/__tests__/tabSync.test.ts` (18 tests)
Tests for BroadcastChannel-based tab coordination.

**Coverage:**
- Sending messages through BroadcastChannel
- Receiving messages via listeners
- Message listener registration and cleanup
- Channel lifecycle (creation, reuse, closure)
- Error handling for posting failures
- Support for multiple concurrent listeners

**Key Test Scenarios:**
- Posting all three message types (INTERVIEW_SYNCED, INTERVIEW_UPDATED, PROTOCOL_CACHED)
- Channel created only once for efficiency
- Listeners receive messages correctly
- Cleanup functions properly remove listeners
- Multiple independent listeners work simultaneously
- Channel can be closed and reopened
- Errors during message posting are caught and logged

## Test Coverage Summary

**Total Tests:** 68 (all passing)

**Lines Tested:**
- Database layer: Complete CRUD coverage for all stores
- Network detection: All browser events and edge cases
- Sync status: All live query scenarios
- Tab coordination: All message types and lifecycle events

## Edge Cases Identified

### 1. Database Edge Cases

**Covered:**
- Empty database state
- Concurrent operations (bulk add/update)
- Index queries with no matches
- Filtering resolved vs unresolved conflicts
- Auto-increment ID collisions (handled by Dexie)

**Potential Uncovered Scenarios:**
- Database storage quota exceeded (browser limit)
  - **Impact:** Could prevent new interviews from being saved offline
  - **Recommendation:** Implement quota monitoring and user notification
  - **Suggested approach:** Use `navigator.storage.estimate()` to check available space

- Database corruption or migration failures
  - **Impact:** Could prevent app from loading offline
  - **Recommendation:** Add error boundaries and database repair logic
  - **Suggested approach:** Implement versioning with fallback to delete/recreate

- Very large interview data (>10MB)
  - **Impact:** Could cause performance issues or exceed IndexedDB limits
  - **Recommendation:** Implement data chunking or pagination
  - **Suggested approach:** Split large interviews into smaller records

### 2. Network Status Edge Cases

**Covered:**
- Online to offline transitions
- Offline to online transitions
- Navigator undefined (SSR compatibility)
- Rapid state changes
- Component cleanup

**Potential Uncovered Scenarios:**
- False positives from navigator.onLine
  - **Impact:** May show "online" when internet is unreachable (captive portal, no gateway)
  - **Recommendation:** Implement "heartbeat" check with actual server ping
  - **Suggested approach:** Periodic fetch to /api/health endpoint with timeout

- Slow or intermittent connections
  - **Impact:** May fail syncs even when "online"
  - **Recommendation:** Implement retry logic with exponential backoff
  - **Suggested approach:** Use retry library with network-aware delays

- Airplane mode edge cases on mobile
  - **Impact:** Some devices don't fire offline event immediately
  - **Recommendation:** Poll navigator.onLine periodically as backup
  - **Suggested approach:** Check every 30 seconds if event hasn't fired

### 3. Sync Status Edge Cases

**Covered:**
- Empty database
- Adding/removing sync items
- Resolving conflicts
- Simultaneous updates

**Potential Uncovered Scenarios:**
- Very large sync queues (>1000 items)
  - **Impact:** Could slow down UI with live query updates
  - **Recommendation:** Implement pagination or summary counts only
  - **Suggested approach:** Use count() without toArray() for large sets

- Rapid database changes causing rendering issues
  - **Impact:** May cause excessive re-renders
  - **Recommendation:** Debounce or throttle hook updates
  - **Suggested approach:** Use useDeferredValue or manual debouncing

- Database locked by another tab during query
  - **Impact:** Queries may timeout or fail
  - **Recommendation:** Implement retry logic for failed queries
  - **Suggested approach:** Wrap queries in try-catch with retries

### 4. Tab Synchronization Edge Cases

**Covered:**
- Message posting
- Message receiving
- Listener cleanup
- Channel lifecycle
- Error handling

**Potential Uncovered Scenarios:**
- BroadcastChannel not supported (older browsers)
  - **Impact:** Tabs won't synchronize changes
  - **Recommendation:** Implement polyfill using SharedWorker or localStorage
  - **Suggested approach:** Feature detection with fallback mechanism

- Message ordering issues
  - **Impact:** Out-of-order messages could cause inconsistent state
  - **Recommendation:** Add sequence numbers or timestamps to messages
  - **Suggested approach:** Include monotonic counter in message payload

- Tab closed before message received
  - **Impact:** State changes may not propagate
  - **Recommendation:** Use service worker for reliable delivery
  - **Suggested approach:** Service worker acts as message broker

- Very frequent messages causing performance issues
  - **Impact:** Could overwhelm tabs with update processing
  - **Recommendation:** Implement message throttling or batching
  - **Suggested approach:** Debounce rapid-fire messages (e.g., during typing)

### 5. Cross-Cutting Edge Cases

**Scenarios Not Yet Covered:**

1. **Race conditions during sync**
   - User edits interview while sync is in progress
   - **Recommendation:** Implement optimistic locking with version numbers

2. **Browser tab suspended/resumed**
   - IndexedDB connections may be closed by browser
   - **Recommendation:** Implement connection health checks and reconnection

3. **Clock skew between client and server**
   - Timestamps may be inconsistent
   - **Recommendation:** Use server timestamps for conflict detection

4. **Partial sync failures**
   - Some items sync successfully, others fail
   - **Recommendation:** Track sync status per-item, not per-batch

5. **User clearing browser data**
   - All offline data lost without warning
   - **Recommendation:** Implement export/import for backup

6. **Multiple devices offline then both come online**
   - Complex conflict resolution needed
   - **Recommendation:** Implement "last write wins" with manual override option

## Test Execution

All tests pass with the following configuration:
- Test runner: Vitest
- Environment: jsdom
- IndexedDB: fake-indexeddb polyfill
- React testing: @testing-library/react

**Command to run tests:**
```bash
pnpm test:unit lib/offline/__tests__ hooks/__tests__/useNetworkStatus.test.ts hooks/__tests__/useSyncStatus.test.ts
```

## Next Phase Testing Recommendations

For Phase 2 (Settings UI) and beyond:
1. Add integration tests that combine multiple layers
2. Test error boundaries and fallback UI
3. Add performance tests for large datasets
4. Implement E2E tests with Playwright for real browser behavior
5. Test service worker registration and lifecycle
6. Add accessibility tests for offline UI indicators
7. Test sync conflict resolution UI flows

## Maintenance Notes

- Tests use fake-indexeddb which closely mimics real IndexedDB but may have subtle differences
- BroadcastChannel is mocked in tests; real cross-tab behavior needs E2E testing
- Some act() warnings in useSyncStatus tests are expected due to async Dexie updates
- Keep tests updated as Dexie schema evolves (version migrations)
