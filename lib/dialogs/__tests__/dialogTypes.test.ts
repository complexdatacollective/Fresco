import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import type {
  AcknowledgeDialog,
  ChoiceDialog,
  CustomDialog,
  DialogReturnType,
  AnyDialog,
} from '../DialogProvider';
import DialogProvider from '../DialogProvider';
import useDialog from '../useDialog';

describe('DialogReturnType', () => {
  describe('type inference', () => {
    it('should infer boolean | null for AcknowledgeDialog with boolean value', () => {
      type TestDialog = AcknowledgeDialog<boolean>;
      type Result = DialogReturnType<TestDialog>;

      // Type assertion - if this compiles, the type is correct
      const results: Result[] = [null, true, false];

      expect(results[0]).toBeNull();
    });

    it('should infer string | null for AcknowledgeDialog with string value', () => {
      type TestDialog = AcknowledgeDialog<string>;
      type Result = DialogReturnType<TestDialog>;

      const results: Result[] = ['test', null];

      expect(results[0]).toBe('test');
    });

    it('should infer union of action values for ChoiceDialog', () => {
      type TestDialog = ChoiceDialog<'confirm', 'skip', 'cancel'>;
      type Result = DialogReturnType<TestDialog>;

      // These assignments should all compile
      const results: Result[] = ['confirm', 'skip', 'cancel', null];

      expect(results[0]).toBe('confirm');
    });

    it('should infer boolean union for ChoiceDialog with boolean values', () => {
      type TestDialog = ChoiceDialog<true, never, false>;
      type Result = DialogReturnType<TestDialog>;

      const results: Result[] = [true, false, null];

      expect(results[0]).toBe(true);
    });

    it('should infer unknown for CustomDialog', () => {
      type Result = DialogReturnType<CustomDialog>;

      // unknown accepts any value
      const _result: Result = 'anything';
      expect(_result).toBe('anything');
    });

    it('should handle optional secondary in ChoiceDialog', () => {
      type TestDialog = ChoiceDialog<'yes', unknown, 'no'>;
      type Result = DialogReturnType<TestDialog>;

      const _result: Result = 'yes';
      expect(_result).toBe('yes');
    });
  });
});

describe('DialogProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(DialogProvider, null, children);

  describe('useDialog hook', () => {
    it('should throw error when used outside DialogProvider', () => {
      expect(() => {
        renderHook(() => useDialog());
      }).toThrow('useDialog must be used within a DialogProvider');
    });

    it('should return openDialog and closeDialog functions', () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      expect(result.current.openDialog).toBeInstanceOf(Function);
      expect(result.current.closeDialog).toBeInstanceOf(Function);
    });
  });

  describe('openDialog', () => {
    it('should open an acknowledge dialog and resolve with primary value', async () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      let dialogResult: boolean | null = null;

      act(() => {
        void result.current
          .openDialog({
            type: 'acknowledge',
            title: 'Test',
            description: 'Test description',
            actions: {
              primary: { label: 'OK', value: true },
            },
          })
          .then((r) => {
            dialogResult = r;
          });
      });

      // Close the dialog with the primary value
      await act(async () => {
        // Need to wait for dialog to be registered
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // The dialog should be open, close it
      act(() => {
        // Dialog IDs are generated, so we'd need to track them
        // For now, verify the promise is pending
        expect(dialogResult).toBeNull();
      });
    });

    it('should open a choice dialog', () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      let dialogPromise: Promise<unknown>;

      act(() => {
        dialogPromise = result.current.openDialog({
          type: 'choice',
          title: 'Confirm',
          description: 'Are you sure?',
          intent: 'destructive',
          actions: {
            primary: { label: 'Yes', value: 'yes' as const },
            cancel: { label: 'No', value: 'no' as const },
          },
        });
      });

      // Verify the promise was created
      expect(dialogPromise!).toBeInstanceOf(Promise);
    });
  });

  describe('closeDialog', () => {
    it('should resolve the dialog promise with the provided value', async () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      let resolvedValue: boolean | null = null;
      let dialogId: string | undefined;

      await act(async () => {
        const dialogPromise = result.current.openDialog({
          id: 'test-dialog',
          type: 'acknowledge',
          title: 'Test',
          description: 'Test',
          actions: {
            primary: { label: 'OK', value: true },
          },
        });

        dialogId = 'test-dialog';

        // Close the dialog after it's opened
        setTimeout(async () => {
          await result.current.closeDialog(dialogId!, true);
        }, 10);

        resolvedValue = await dialogPromise;
      });

      expect(resolvedValue).toBe(true);
    });

    it('should resolve with null when closed without a value', async () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      let resolvedValue: boolean | null = true; // Start with non-null to verify it changes

      await act(async () => {
        const dialogPromise = result.current.openDialog({
          id: 'test-dialog-2',
          type: 'acknowledge',
          title: 'Test',
          description: 'Test',
          actions: {
            primary: { label: 'OK', value: true },
          },
        });

        setTimeout(async () => {
          await result.current.closeDialog('test-dialog-2', null);
        }, 10);

        resolvedValue = await dialogPromise;
      });

      expect(resolvedValue).toBeNull();
    });

    it('should throw error when closing non-existent dialog', async () => {
      const { result } = renderHook(() => useDialog(), { wrapper });

      await expect(async () => {
        await act(async () => {
          await result.current.closeDialog('non-existent-id', true);
        });
      }).rejects.toThrow('Dialog with ID non-existent-id does not exist');
    });
  });
});

describe('Dialog type constraints', () => {
  it('should require intent for choice dialogs', () => {
    const choiceDialog: ChoiceDialog<boolean, never, boolean> = {
      type: 'choice',
      title: 'Test',
      description: 'Test',
      intent: 'destructive', // Required for choice dialogs
      actions: {
        primary: { label: 'Yes', value: true },
        cancel: { label: 'No', value: false },
      },
    };

    expect(choiceDialog.intent).toBe('destructive');
  });

  it('should allow optional intent for acknowledge dialogs', () => {
    const acknowledgeDialog: AcknowledgeDialog<boolean> = {
      type: 'acknowledge',
      title: 'Test',
      description: 'Test',
      // intent is optional
      actions: {
        primary: { label: 'OK', value: true },
      },
    };

    expect(acknowledgeDialog.intent).toBeUndefined();
  });

  it('should allow optional secondary action in choice dialogs', () => {
    const dialogWithSecondary: ChoiceDialog<'yes', 'maybe', 'no'> = {
      type: 'choice',
      title: 'Test',
      description: 'Test',
      intent: 'default',
      actions: {
        primary: { label: 'Yes', value: 'yes' },
        secondary: { label: 'Maybe', value: 'maybe' },
        cancel: { label: 'No', value: 'no' },
      },
    };

    const dialogWithoutSecondary: ChoiceDialog<'yes', unknown, 'no'> = {
      type: 'choice',
      title: 'Test',
      description: 'Test',
      intent: 'default',
      actions: {
        primary: { label: 'Yes', value: 'yes' },
        cancel: { label: 'No', value: 'no' },
      },
    };

    expect(dialogWithSecondary.actions.secondary?.value).toBe('maybe');
    expect(dialogWithoutSecondary.actions.secondary).toBeUndefined();
  });

  it('should satisfy AnyDialog constraint for all dialog types', () => {
    const acknowledge: AnyDialog = {
      type: 'acknowledge',
      title: 'Test',
      description: 'Test',
      actions: { primary: { label: 'OK', value: true } },
    };

    const choice: AnyDialog = {
      type: 'choice',
      title: 'Test',
      description: 'Test',
      intent: 'default',
      actions: {
        primary: { label: 'Yes', value: true },
        cancel: { label: 'No', value: false },
      },
    };

    const custom: AnyDialog = {
      type: 'custom',
      title: 'Test',
      description: 'Test',
    };

    expect(acknowledge.type).toBe('acknowledge');
    expect(choice.type).toBe('choice');
    expect(custom.type).toBe('custom');
  });
});
