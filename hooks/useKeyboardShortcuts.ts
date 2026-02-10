import { useCallback, useEffect, useMemo, type RefObject } from 'react';

/**
 * Common keyboard key values following the KeyboardEvent.key standard.
 */
export const Key = {
  // Arrow keys
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  // Navigation
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  // Actions
  Enter: 'Enter',
  Escape: 'Escape',
  Space: ' ',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  // Modifiers (for reference, though these are checked via event properties)
  Shift: 'Shift',
  Control: 'Control',
  Alt: 'Alt',
  Meta: 'Meta',
  // Function keys
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
} as const;

/**
 * Handler function for a keyboard shortcut.
 * Can optionally receive the keyboard event for advanced use cases.
 */
type ShortcutHandler = (event?: KeyboardEvent) => void;

/**
 * A single shortcut key or an array of shortcut keys.
 * Shortcut format: [Modifier+]...[Modifier+]Key
 * - Single keys: 'Enter', 'Escape', 'ArrowUp', 'a', 'F1'
 * - With modifiers: 'Ctrl+S', 'Shift+Enter', 'Ctrl+Shift+Z', 'Meta+K'
 * - Modifier aliases: 'Cmd' = 'Meta', 'Option' = 'Alt', 'Control' = 'Ctrl'
 */
type ShortcutKeys = string | string[];

/**
 * A tuple defining a keyboard shortcut binding.
 * [keys, handler] where keys can be a single key or array of keys.
 */
type ShortcutBinding = [ShortcutKeys, ShortcutHandler];

/**
 * Array of shortcut bindings.
 *
 * @example
 * ```ts
 * [
 *   [Key.Escape, handleCancel],
 *   [[Key.ArrowUp, Key.ArrowRight], handleIncrement],
 *   ['Ctrl+S', handleSave],
 * ]
 * ```
 */
type KeyboardShortcuts = ShortcutBinding[];

type UseKeyboardShortcutsOptions = {
  /**
   * When true, keyboard events are ignored
   */
  disabled?: boolean;
  /**
   * Whether to call preventDefault() on matched shortcuts
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Whether to call stopPropagation() on matched shortcuts
   * @default false
   */
  stopPropagation?: boolean;
  /**
   * Element ref to attach listeners to via useEffect.
   * When provided, attaches native event listeners directly.
   */
  elementRef?: RefObject<HTMLElement | null>;
  /**
   * Whether to listen on capture phase (only applies with elementRef)
   * @default false
   */
  capture?: boolean;
};

/**
 * Props object that can be spread onto an element to enable keyboard shortcuts.
 */
type KeyboardEventHandlers = {
  onKeyDown: (event: React.KeyboardEvent<Element>) => void;
};

type Modifier = 'Ctrl' | 'Alt' | 'Shift' | 'Meta';

type ParsedShortcut = {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
};

/**
 * Parse a shortcut string into its components
 */
function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split('+').map((p) => p.trim());
  const modifiers: Modifier[] = ['Ctrl', 'Alt', 'Shift', 'Meta'];

  let key = '';
  let ctrl = false;
  let alt = false;
  let shift = false;
  let meta = false;

  for (const part of parts) {
    const normalizedPart = part.charAt(0).toUpperCase() + part.slice(1);

    if (normalizedPart === 'Ctrl' || normalizedPart === 'Control') {
      ctrl = true;
    } else if (normalizedPart === 'Alt' || normalizedPart === 'Option') {
      alt = true;
    } else if (normalizedPart === 'Shift') {
      shift = true;
    } else if (
      normalizedPart === 'Meta' ||
      normalizedPart === 'Cmd' ||
      normalizedPart === 'Command' ||
      normalizedPart === 'Win' ||
      normalizedPart === 'Windows'
    ) {
      meta = true;
    } else if (!modifiers.includes(normalizedPart as Modifier)) {
      key = part;
    }
  }

  return { key, ctrl, alt, shift, meta };
}

/**
 * Check if a keyboard event matches a parsed shortcut
 */
function matchesShortcut(
  event: KeyboardEvent,
  parsed: ParsedShortcut,
): boolean {
  if (event.ctrlKey !== parsed.ctrl) return false;
  if (event.altKey !== parsed.alt) return false;
  if (event.shiftKey !== parsed.shift) return false;
  if (event.metaKey !== parsed.meta) return false;

  const eventKey = event.key;
  const parsedKey = parsed.key;

  // Direct match
  if (eventKey === parsedKey) return true;

  // Case-insensitive match for single letters
  if (
    eventKey.length === 1 &&
    parsedKey.length === 1 &&
    eventKey.toLowerCase() === parsedKey.toLowerCase()
  ) {
    return true;
  }

  // Match against Key constant values
  if (parsedKey in Key) {
    const keyValue = Key[parsedKey as keyof typeof Key] as string;
    if (eventKey === keyValue) return true;
  }

  return false;
}

/**
 * A hook for handling keyboard shortcuts on elements.
 *
 * Returns an object with event handlers that can be spread onto any element.
 *
 * @example
 * ```tsx
 * // Single keys
 * const keyboardHandlers = useKeyboardShortcuts([
 *   [Key.Escape, () => setEditing(false)],
 *   ['Ctrl+S', handleSave],
 * ]);
 *
 * return <div {...keyboardHandlers} tabIndex={0}>...</div>;
 * ```
 *
 * @example
 * ```tsx
 * // Multiple keys for same handler
 * const keyboardHandlers = useKeyboardShortcuts([
 *   [[Key.ArrowUp, Key.ArrowRight], handleIncrement],
 *   [[Key.ArrowDown, Key.ArrowLeft], handleDecrement],
 * ]);
 *
 * return <div {...keyboardHandlers} tabIndex={0}>...</div>;
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts,
  options: UseKeyboardShortcutsOptions = {},
): KeyboardEventHandlers {
  const {
    disabled = false,
    preventDefault = true,
    stopPropagation = false,
    elementRef,
    capture = false,
  } = options;

  // Parse all shortcuts once
  const parsedShortcuts = useMemo(() => {
    const result: { parsed: ParsedShortcut; handler: ShortcutHandler }[] = [];

    for (const [keys, handler] of shortcuts) {
      // Normalize keys to an array
      const keyArray = Array.isArray(keys) ? keys : [keys];

      for (const key of keyArray) {
        result.push({
          parsed: parseShortcut(key),
          handler,
        });
      }
    }

    return result;
  }, [shortcuts]);

  // Native event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      for (const { parsed, handler } of parsedShortcuts) {
        if (matchesShortcut(event, parsed)) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          handler(event);
          return;
        }
      }
    },
    [disabled, parsedShortcuts, preventDefault, stopPropagation],
  );

  // Ref-based binding with useEffect
  useEffect(() => {
    if (!elementRef?.current || disabled) return;

    const element = elementRef.current;
    element.addEventListener('keydown', handleKeyDown, { capture });

    return () => {
      element.removeEventListener('keydown', handleKeyDown, { capture });
    };
  }, [elementRef, handleKeyDown, disabled, capture]);

  // React event handler
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      handleKeyDown(event.nativeEvent);
    },
    [handleKeyDown],
  );

  return { onKeyDown };
}
