# Offline Component Test Coverage

This document outlines the comprehensive test coverage for Phase 2 offline components.

## Test Files

### 1. OfflineModeSwitch.test.tsx (16 tests)

**Component:** `components/offline/OfflineModeSwitch.tsx`

**Coverage Areas:**
- Rendering
  - Renders after mounting (client-side only)
  - Custom className spreading
  - Additional props spreading (data-testid, aria-label, etc.)
- localStorage Initialization
  - Default unchecked state when localStorage is empty
  - Initialize from localStorage "true" value
  - Initialize from localStorage "false" value
  - Handle invalid localStorage values
- User Interaction
  - Toggle to checked on click
  - Toggle to unchecked on second click
  - Support multiple toggle operations
- localStorage Persistence
  - Save "true" on toggle on
  - Save "false" on toggle off
  - Persist across multiple toggles
  - Maintain state between component remounts
- Keyboard Interaction
  - Toggle with Space key
  - Toggle with Enter key

**Edge Cases Covered:**
- Invalid localStorage values default to unchecked
- Component does not render during SSR (client-side only with mounted check)
- State persists across component unmount/remount cycles

---

### 2. StorageUsage.test.tsx (19 tests)

**Component:** `components/offline/StorageUsage.tsx`

**Coverage Areas:**
- Rendering
  - Render storage info when API available
  - Show fallback when Storage API unavailable
  - Show fallback when estimate method unavailable
  - Show fallback when estimate throws error
  - Custom className spreading
  - Additional props spreading
  - No render while loading
- Byte Formatting
  - Format bytes (B)
  - Format kilobytes (KB)
  - Format megabytes (MB)
  - Format gigabytes (GB)
  - Format zero bytes
- Percentage Calculation
  - Display progress bar with correct percentage
  - Handle 0% usage
  - Handle 100% usage
  - Handle zero quota gracefully
- Missing Estimate Values
  - Handle missing usage value (defaults to 0)
  - Handle missing quota value (defaults to 0)
  - Handle both values missing

**Edge Cases Covered:**
- Browser Storage API not available (older browsers)
- Storage estimate method missing
- Storage estimate throws errors
- Missing/undefined usage or quota values
- Zero quota (division by zero protection)
- Async loading state (returns null while loading)

---

### 3. OfflineStatusBadge.test.tsx (21 tests)

**Component:** `components/offline/OfflineStatusBadge.tsx`

**Coverage Areas:**
- Rendering
  - Render without crashing
  - Custom className spreading
  - Additional props spreading
- Status Variants
  - "Online Only" label for online-only status
  - "Downloading" label for downloading status
  - "Available Offline" label for available-offline status
  - "Sync Required" label for sync-required status
- CSS Classes
  - Correct classes for online-only (border-current/20, text-current)
  - Correct classes for downloading (border-info, bg-info/10, text-info, animate-pulse)
  - Correct classes for available-offline (border-success, bg-success/10, text-success)
  - Correct classes for sync-required (border-warning, bg-warning/10, text-warning)
  - Base Badge variant classes always included
- Status Transitions
  - Update label when status prop changes
  - Update classes when status prop changes
  - Handle all status transitions correctly
- Combined Classes
  - Merge custom className with variant classes
  - Allow overriding variant classes
- Accessibility
  - Accessible as generic element
  - Support custom ARIA attributes
  - Visible text for screen readers
- Badge Component Integration
  - Renders as Badge with outline variant

**Edge Cases Covered:**
- Status prop changes trigger correct re-renders
- Custom classes merge properly without overriding critical styles
- All four status variants work correctly
- Accessibility attributes can be added for enhanced screen reader support

---

## Test Strategy

### Unit Testing Approach
All tests use Vitest with React Testing Library following these principles:
- **Isolation**: Each test is independent with proper setup/teardown
- **User-centric**: Tests interact with components as users would (clicks, keyboard)
- **Accessibility-first**: Use semantic queries (getByRole, getByLabelText)
- **No implementation details**: Test behavior, not implementation

### Mocking Strategy
- **localStorage**: Mocked in test environment, cleared between tests
- **navigator.storage**: Mocked with different scenarios (available, unavailable, errors)
- **Progress component**: Uses Radix UI, tested via integration

### Test Patterns
1. **AAA Pattern**: Arrange-Act-Assert structure throughout
2. **Descriptive names**: Clear test names explain what is being tested
3. **Wait for async**: All async operations properly awaited with waitFor
4. **User events**: Use @testing-library/user-event for realistic interactions

---

## Edge Cases Identified

### Handled Edge Cases
1. **OfflineModeSwitch**
   - Invalid localStorage values
   - SSR rendering (component only renders client-side)
   - State persistence across remounts

2. **StorageUsage**
   - Browser compatibility (older browsers without Storage API)
   - API errors during estimate call
   - Missing estimate values (usage/quota)
   - Zero quota (prevents division by zero)
   - Async loading state

3. **OfflineStatusBadge**
   - Dynamic status changes
   - Custom className merging
   - All status variant transitions

### Potential Uncovered Edge Cases

#### OfflineModeSwitch
1. **Concurrent Tab Updates**: If multiple tabs update offline mode simultaneously, there could be race conditions. Consider implementing cross-tab communication (BroadcastChannel or storage events).
2. **localStorage Quota**: If localStorage is full, setItem will throw. Should add try-catch error handling.
3. **Private Browsing**: Some browsers disable localStorage in private mode. Consider graceful degradation.

#### StorageUsage
1. **Rapid Storage Changes**: Component doesn't re-fetch storage info after mount. Consider adding periodic refresh or manual refresh capability.
2. **Storage Permissions**: Some browsers require user permission for storage APIs. Consider handling permission denials.
3. **IndexedDB Impact**: Storage estimate includes all storage (localStorage, IndexedDB, Cache API). Large IndexedDB usage might not be obvious to users.

#### OfflineStatusBadge
1. **Animation Performance**: The animate-pulse class on "downloading" status might impact performance on low-end devices. Consider respecting prefers-reduced-motion.
2. **Status Change Notifications**: Rapid status changes might be missed by screen reader users. Consider using aria-live regions.
3. **Color Accessibility**: Status colors rely on semantic colors (success, warning, info). Ensure sufficient contrast ratios in all themes.

---

## Recommendations

### For Production
1. **Add error boundaries** around components to catch and handle unexpected errors gracefully
2. **Implement cross-tab sync** for OfflineModeSwitch using BroadcastChannel or storage events
3. **Add try-catch** for localStorage operations with fallback to in-memory state
4. **Respect prefers-reduced-motion** for animate-pulse in OfflineStatusBadge
5. **Add aria-live** to OfflineStatusBadge for status change announcements
6. **Consider periodic refresh** for StorageUsage to show live usage updates
7. **Add visual quota warnings** when storage usage exceeds 80-90%

### For Testing
1. **Add integration tests** to verify components work together in SettingsCard
2. **Add E2E tests** to verify offline mode behavior in actual browser environment
3. **Add visual regression tests** in Storybook/Chromatic for status badge variants
4. **Test color contrast** for all status variants against light/dark themes

---

## Test Execution

Run all offline component tests:
```bash
pnpm test components/offline/__tests__/
```

Run specific test file:
```bash
pnpm test components/offline/__tests__/OfflineModeSwitch.test.tsx
```

Run with coverage:
```bash
pnpm test --coverage components/offline/__tests__/
```

---

## Summary

**Total Tests**: 56
- OfflineModeSwitch: 16 tests
- StorageUsage: 19 tests
- OfflineStatusBadge: 21 tests

**Coverage**: Comprehensive coverage of all component functionality including:
- Rendering behavior
- User interactions
- State management
- Error handling
- Accessibility
- Edge cases

**Quality**: All tests follow best practices, use semantic queries, and test user-visible behavior rather than implementation details.
