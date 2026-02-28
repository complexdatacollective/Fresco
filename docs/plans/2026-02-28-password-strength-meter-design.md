# Password Strength Meter Design

## Overview

Add an optional password complexity meter to `PasswordField`. When enabled via a boolean prop, a colored progress bar with text label appears below the input, providing visual feedback on password strength.

## Decisions

- **Strength source**: Auto-calculated from password value (no external dependency)
- **API**: Single `showStrengthMeter` boolean prop on `PasswordField`
- **Scoring**: Simple heuristic based on length + character class diversity (no library)
- **Visual**: Horizontal `ProgressBar` (existing component) with color controlled via `currentColor` inheritance
- **Text label**: Shown alongside the bar for accessibility

## Strength Scoring

Pure function `getPasswordStrength(password: string)` returns score 0-4:

| Score | Label  | Criteria                                |
| ----- | ------ | --------------------------------------- |
| 0     | (none) | Empty password                          |
| 1     | Weak   | Length >= 1                             |
| 2     | Fair   | Length >= 8 + 2 character classes       |
| 3     | Good   | Length >= 8 + 3 character classes       |
| 4     | Strong | Length >= 12 + all 4 character classes  |

Character classes: lowercase, uppercase, digits, symbols.

## Visual Design

- Horizontal `ProgressBar` below `InputField`, full width
- Score to percentage: 0=0%, 1=25%, 2=50%, 3=75%, 4=100%
- Color via Tailwind text-color class on wrapper (ProgressBar uses `currentColor`):
  - Weak: `text-destructive`
  - Fair: `text-warning`
  - Good/Strong: `text-success`
- Small text label next to the bar
- Hidden when password is empty (score 0)

## Component Changes

- **`PasswordField.tsx`**: Add `showStrengthMeter` prop. Render strength bar + label below `InputField` when enabled.
- **`ProgressBar.tsx`**: No changes (already supports horizontal + `currentColor`).
- **New**: `getPasswordStrength()` utility function co-located with `PasswordField`.

## Accessibility

- ProgressBar has `aria-label` for screen readers
- Text label provides non-color-based strength indication
- `aria-live="polite"` on strength region for dynamic announcements
