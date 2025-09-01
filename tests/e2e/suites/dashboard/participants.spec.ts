import { expect, test } from '@playwright/test';

// Parallel tests - no mutations!

test.describe.parallel('Participants page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/participants');
  });

  // Visual snapshot of this page
  test('should match visual snapshot', async ({ page }) => {
    expect(await page.screenshot()).toMatchSnapshot('participants-page.png');
  });

  test('should display participants list', async ({ page }) => {
    // Should show participants page in a data table.
  });

  test('should search participants', async ({ page }) => {
    // should be able to use the search box to locate a specific participant
  });

  test('should short participants by identifier ascending and descending', async ({
    page,
  }) => {
    // Should be able to sort participants by identifier (P001, P002, etc.)
  });

  test('should short participants by label ascending and descending', async ({
    page,
  }) => {
    // Should be able to sort participants by label (e.g. "Alice", "Bob", etc.)
  });

  test('should allow participant URLs to be exported', async ({ page }) => {
    // Should select individual participants,
    // Exported csv should match expected data.
  });

  test('should bulk select and export participants', async ({ page }) => {
    // Use the select all checkbox to export all participants. verify it matches expected data.
  });

  test('copy unique URL button', async ({ page }) => {
    // Should copy the unique URL of a participant to the clipboard
  });
});

// Mutations allowed here. Use database snapshots to return to initial state.
test.describe.serial('Participants page - serial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/participants');
  });

  test('should be able to upload participant csv', async ({ page }) => {
    // Should use the import participants button to upload a csv, and verify that csv members appear in the table
  });

  test('should add a new participant', async ({ page }) => {
    // Should be able to click a button, fill out a form, and add a new participant.
  });

  test('should edit participant information', async ({ page }) => {
    // Should be able to use the menu to edit a participant, change the identifier and label, click the "update" button, and have the changes appear
  });

  test('should delete single participant with interviews', async ({ page }) => {
    // Should show confirm prompt that includes warning
  });

  test('should delete single participant with no interviews', async ({
    page,
  }) => {
    // Should be able to use the menu to delete a participant, confirm the deletion, and have the participant removed from the list
  });

  test('should allow all participants to be deleted', async ({ page }) => {
    // Should be able to use delete all button to delete all participants.
  });

  // Visual snapshot of empty state should match
  test('should match visual snapshot', async ({ page }) => {
    expect(await page.screenshot()).toMatchSnapshot(
      'participants-empty-state.png',
    );
  });
});
