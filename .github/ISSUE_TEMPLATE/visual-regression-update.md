---
name: Visual Regression Update
about: Update visual regression baselines after intentional UI changes
title: 'Visual Regression Update: [Brief description of UI changes]'
labels: ['testing', 'visual-regression', 'ui']
assignees: ''
---

## UI Changes Made

Describe the intentional UI changes that require visual regression baseline updates.

## Screenshots

Before/After screenshots showing the changes:

**Before:**
<!-- Attach screenshot of previous UI state -->

**After:**
<!-- Attach screenshot of new UI state -->

## Tests Affected

List the specific visual regression tests that need baseline updates:

- [ ] `dashboard-home-full-page`
- [ ] `dashboard-summary-stats`
- [ ] `dashboard-activity-feed`
- [ ] `protocols-page-full`
- [ ] `protocols-table`
- [ ] `participants-page-full`
- [ ] `participants-table`
- [ ] `interviews-page-full`
- [ ] `interviews-table`
- [ ] `settings-page-full`
- [ ] Other: ________________

## Update Process

To update the visual regression baselines:

1. **Local Update:**
   ```bash
   pnpm test:visual:update
   ```

2. **Review Generated Screenshots:**
   - Check `test-results/` directory for new baseline images
   - Verify the changes are correct and intentional

3. **Commit Changes:**
   ```bash
   git add test-results/
   git commit -m "Update visual regression baselines for [description]"
   ```

## Verification

- [ ] Local visual tests pass after update
- [ ] Changes have been reviewed and approved
- [ ] Baselines committed to repository
- [ ] CI/CD pipeline passes with new baselines

## Notes

Any additional context or considerations for the visual changes.