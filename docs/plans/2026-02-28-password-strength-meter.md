# Password Strength Meter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an optional password complexity meter to `PasswordField` that auto-calculates strength and shows a colored progress bar with text label.

**Architecture:** A pure `getPasswordStrength()` utility scores passwords 0-4 based on length and character class diversity. `PasswordField` gets a `showStrengthMeter` boolean prop that renders a horizontal `ProgressBar` (existing component) below the input, with color controlled via Tailwind text-color classes leveraging `currentColor` inheritance.

**Tech Stack:** React, TypeScript, Vitest, existing `ProgressBar` component (`@base-ui/react/progress`), Tailwind CSS.

**Design doc:** `docs/plans/2026-02-28-password-strength-meter-design.md`

---

### Task 1: Create `getPasswordStrength` utility with tests

**Files:**
- Create: `app/(blobs)/(setup)/_components/getPasswordStrength.ts`
- Create: `app/(blobs)/(setup)/_components/__tests__/getPasswordStrength.test.ts`

**Step 1: Write the failing tests**

Create `app/(blobs)/(setup)/_components/__tests__/getPasswordStrength.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  type PasswordStrength,
} from '~/app/(blobs)/(setup)/_components/getPasswordStrength';

describe('getPasswordStrength', () => {
  it('returns score 0 for empty string', () => {
    const result = getPasswordStrength('');
    expect(result).toEqual<PasswordStrength>({
      score: 0,
      label: null,
      percent: 0,
      colorClass: null,
    });
  });

  it('returns score 1 (Weak) for short passwords', () => {
    const result = getPasswordStrength('abc');
    expect(result.score).toBe(1);
    expect(result.label).toBe('Weak');
    expect(result.percent).toBe(25);
    expect(result.colorClass).toBe('text-destructive');
  });

  it('returns score 1 (Weak) for long password with only 1 character class', () => {
    const result = getPasswordStrength('abcdefghijklmnop');
    expect(result.score).toBe(1);
    expect(result.label).toBe('Weak');
  });

  it('returns score 2 (Fair) for 8+ chars with 2 character classes', () => {
    const result = getPasswordStrength('abcdefG1');
    expect(result.score).toBe(2);
    expect(result.label).toBe('Fair');
    expect(result.percent).toBe(50);
    expect(result.colorClass).toBe('text-warning');
  });

  it('returns score 3 (Good) for 8+ chars with 3 character classes', () => {
    const result = getPasswordStrength('abcdeG1!');
    expect(result.score).toBe(3);
    expect(result.label).toBe('Good');
    expect(result.percent).toBe(75);
    expect(result.colorClass).toBe('text-success');
  });

  it('returns score 4 (Strong) for 12+ chars with all 4 character classes', () => {
    const result = getPasswordStrength('abcdefG1!xyz');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Strong');
    expect(result.percent).toBe(100);
    expect(result.colorClass).toBe('text-success');
  });

  it('returns score 2 when 12+ chars but only 2 classes', () => {
    const result = getPasswordStrength('abcdefghij12');
    expect(result.score).toBe(2);
  });

  it('returns score 3 when 12+ chars with 3 classes (not all 4)', () => {
    const result = getPasswordStrength('abcdefghiJ12');
    expect(result.score).toBe(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test app/\\(blobs\\)/\\(setup\\)/_components/__tests__/getPasswordStrength.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement `getPasswordStrength`**

Create `app/(blobs)/(setup)/_components/getPasswordStrength.ts`:

```typescript
export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | null;
  percent: number;
  colorClass: 'text-destructive' | 'text-warning' | 'text-success' | null;
};

const SCORE_MAP: Record<
  1 | 2 | 3 | 4,
  Pick<PasswordStrength, 'label' | 'colorClass'>
> = {
  1: { label: 'Weak', colorClass: 'text-destructive' },
  2: { label: 'Fair', colorClass: 'text-warning' },
  3: { label: 'Good', colorClass: 'text-success' },
  4: { label: 'Strong', colorClass: 'text-success' },
};

function countCharacterClasses(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count++;
  if (/[A-Z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[^a-zA-Z0-9]/.test(password)) count++;
  return count;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { score: 0, label: null, percent: 0, colorClass: null };
  }

  const classes = countCharacterClasses(password);
  let score: 1 | 2 | 3 | 4 = 1;

  if (password.length >= 12 && classes >= 4) {
    score = 4;
  } else if (password.length >= 8 && classes >= 3) {
    score = 3;
  } else if (password.length >= 8 && classes >= 2) {
    score = 2;
  }

  return {
    score,
    percent: score * 25,
    ...SCORE_MAP[score],
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test app/\\(blobs\\)/\\(setup\\)/_components/__tests__/getPasswordStrength.test.ts`
Expected: All 8 tests PASS.

**Step 5: Format and commit**

```bash
pnpm prettier --write "app/(blobs)/(setup)/_components/getPasswordStrength.ts" "app/(blobs)/(setup)/_components/__tests__/getPasswordStrength.test.ts"
git add "app/(blobs)/(setup)/_components/getPasswordStrength.ts" "app/(blobs)/(setup)/_components/__tests__/getPasswordStrength.test.ts"
git commit -m "feat: add getPasswordStrength utility with tests"
```

---

### Task 2: Update `PasswordField` to render the strength meter

**Files:**
- Modify: `app/(blobs)/(setup)/_components/PasswordField.tsx`

**Step 1: Update `PasswordField` component**

The updated `PasswordField.tsx`:

```typescript
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IconButton } from '~/components/ui/Button';
import ProgressBar from '~/components/ui/ProgressBar';
import InputField from '~/lib/form/components/fields/InputField';
import { cx } from '~/utils/cva';
import { getPasswordStrength } from '~/app/(blobs)/(setup)/_components/getPasswordStrength';

type PasswordFieldProps = React.ComponentProps<typeof InputField> & {
  showStrengthMeter?: boolean;
};

export default function PasswordField({
  showStrengthMeter,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(
    () =>
      showStrengthMeter
        ? getPasswordStrength(String(props.value ?? ''))
        : null,
    [showStrengthMeter, props.value],
  );

  return (
    <div className="flex flex-col gap-1">
      <InputField
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        prefixComponent={<Lock />}
        suffixComponent={
          <IconButton
            variant="text"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            icon={showPassword ? <EyeOff /> : <Eye />}
          />
        }
        {...props}
      />
      {showStrengthMeter && strength && strength.score > 0 && (
        <div
          className={cx(
            'flex items-center gap-2 transition-colors duration-200',
            strength.colorClass,
          )}
          aria-live="polite"
        >
          <div className="h-1.5 grow">
            <ProgressBar
              orientation="horizontal"
              percentProgress={strength.percent}
              nudge={false}
              label="Password strength"
            />
          </div>
          <span className="text-xs font-medium">{strength.label}</span>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No new type errors.

**Step 3: Run lint**

Run: `pnpm lint --fix`
Expected: No errors.

**Step 4: Format and commit**

```bash
pnpm prettier --write "app/(blobs)/(setup)/_components/PasswordField.tsx"
git add "app/(blobs)/(setup)/_components/PasswordField.tsx"
git commit -m "feat: add optional strength meter to PasswordField"
```

---

### Task 3: Verify existing consumers are unaffected

**Context:** `PasswordField` is used in two places:
- `app/(blobs)/(setup)/_components/SignInForm.tsx` — login form (no strength meter needed)
- `app/dashboard/settings/_components/UserManagement.tsx` — create user + change password forms

Neither currently passes `showStrengthMeter`, so they should render identically.

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass, no regressions.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No new type errors. Existing consumers pass `ComponentProps<typeof InputField>` props — the new optional prop doesn't break this since `PasswordFieldProps` extends it.

---

### Task 4: Add Storybook stories for PasswordField

**Files:**
- Create: `app/(blobs)/(setup)/_components/PasswordField.stories.tsx`

**Step 1: Create stories**

Create `app/(blobs)/(setup)/_components/PasswordField.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import PasswordField from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  title: 'Setup/PasswordField',
  component: PasswordField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-80">
        <PasswordField value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithStrengthMeter: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-80">
        <PasswordField
          value={value}
          onChange={setValue}
          showStrengthMeter
        />
      </div>
    );
  },
};

export const StrengthLevels: Story = {
  render: () => {
    const passwords = [
      { label: 'Weak', value: 'abc' },
      { label: 'Fair', value: 'abcdefG1' },
      { label: 'Good', value: 'abcdeG1!' },
      { label: 'Strong', value: 'abcdefG1!xyz' },
    ];

    return (
      <div className="flex w-80 flex-col gap-6">
        {passwords.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-sm font-medium">{label}</span>
            <PasswordField
              value={value}
              onChange={() => {}}
              showStrengthMeter
            />
          </div>
        ))}
      </div>
    );
  },
};
```

**Step 2: Format and commit**

```bash
pnpm prettier --write "app/(blobs)/(setup)/_components/PasswordField.stories.tsx"
git add "app/(blobs)/(setup)/_components/PasswordField.stories.tsx"
git commit -m "feat: add PasswordField storybook stories"
```

---

### Task 5: Enable strength meter on user creation form

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Context:** The "create user" form in `UserManagement.tsx` has a password field (line ~552) and a confirm password field (line ~563). The password field should show the strength meter; the confirm field should not.

**Step 1: Add `showStrengthMeter` to the password field**

In `UserManagement.tsx`, find the create-user password `<Field>` (around line 549-558) and add `showStrengthMeter` to it:

```typescript
<Field
  name="password"
  label="Password"
  component={PasswordField}
  required
  autoComplete="new-password"
  showStrengthMeter
  custom={{
    schema: passwordSchema,
    hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
  }}
/>
```

**Step 2: Format and commit**

```bash
pnpm prettier --write "app/dashboard/settings/_components/UserManagement.tsx"
git add "app/dashboard/settings/_components/UserManagement.tsx"
git commit -m "feat: enable strength meter on user creation password field"
```

---

### Task 6: Final verification

**Step 1: Run full checks**

```bash
pnpm typecheck
pnpm lint --fix
pnpm test
```

Expected: All pass.

**Step 2: Visual check in Storybook**

Open Storybook (`pnpm storybook`) and verify `Setup/PasswordField` stories render correctly. Check:
- Default story: no strength meter visible
- WithStrengthMeter: bar appears as you type, color transitions smoothly
- StrengthLevels: all 4 levels display with correct colors and labels
