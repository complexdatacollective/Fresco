# Auth Mode Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce mutually exclusive password/passkey authentication modes with explicit switching flows and conditional settings UI.

**Architecture:** Two auth modes determined by `Key.hashed_password` (non-null = password mode, null = passkey mode). Two new server actions handle mode switching atomically. The settings UI conditionally renders sections based on auth mode. No database schema changes needed.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, SimpleWebAuthn, Tailwind CSS, shadcn/ui, Zod

**Design Doc:** `docs/plans/2026-03-03-auth-mode-redesign.md`

---

### Task 1: Create `switchToPasskeyMode` Server Action

New server action that atomically: verifies password, registers a passkey, removes password + TOTP + recovery codes.

**Files:**
- Modify: `actions/webauthn.ts` (add new action after `resetAuthForUser` at ~line 584)

**Step 1: Write the action**

Add to `actions/webauthn.ts`:

```typescript
export async function switchToPasskeyMode(
  currentPassword: string,
  credential: RegistrationResponseJSON,
) {
  const session = await requireApiAuth();

  // Verify current password
  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (!key?.hashed_password) {
    return { error: 'Already using passkey authentication.', data: null };
  }

  const valid = await verifyPassword(currentPassword, key.hashed_password);
  if (!valid) {
    return { error: 'Incorrect password.', data: null };
  }

  // Verify the WebAuthn registration
  const challenge = getChallengeCookie();
  if (!challenge) {
    return { error: 'Registration challenge expired.', data: null };
  }
  clearChallengeCookie();

  const config = getWebAuthnConfig();
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
    });
  } catch {
    return { error: 'Passkey verification failed.', data: null };
  }

  if (
    !verification.verified ||
    !verification.registrationInfo
  ) {
    return { error: 'Passkey verification failed.', data: null };
  }

  const { credential: regCredential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;
  const authenticatorName = aaguid ? await getAuthenticatorName(aaguid) : null;

  // Atomic switch: remove password + TOTP + recovery codes, add passkey
  await prisma.$transaction([
    prisma.key.update({
      where: { id: key.id },
      data: { hashed_password: null },
    }),
    prisma.totpCredential.deleteMany({ where: { user_id: session.user.userId } }),
    prisma.recoveryCode.deleteMany({ where: { user_id: session.user.userId } }),
    prisma.webAuthnCredential.create({
      data: {
        user_id: session.user.userId,
        credentialId: regCredential.id,
        publicKey: isoBase64URL.fromBuffer(regCredential.publicKey),
        counter: regCredential.counter,
        transports: credential.response.transports?.join(',') ?? null,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        aaguid: aaguid ?? null,
        friendlyName: authenticatorName,
        createdAt: new Date(),
      },
    }),
  ]);

  void addEvent(
    'Switched to Passkey Auth',
    `User ${session.user.username} switched to passkey authentication`,
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}
```

Note: `RegistrationResponseJSON` is already imported from `@simplewebauthn/server`. `verifyRegistrationResponse`, `isoBase64URL`, `getWebAuthnConfig`, `getChallengeCookie`, `clearChallengeCookie`, and `getAuthenticatorName` are already used in the file. Check exact imports and helper names at the top of `actions/webauthn.ts`.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no new errors related to this action)

**Step 3: Commit**

```
feat: add switchToPasskeyMode server action
```

---

### Task 2: Create `switchToPasswordMode` Server Action

New server action that atomically: sets password hash, deletes all passkeys. Passkey verification happens client-side before calling this action (existing `verifyPasskeyReauth` flow).

**Files:**
- Modify: `actions/webauthn.ts` (add after `switchToPasskeyMode`)

**Step 1: Write the action**

```typescript
export async function switchToPasswordMode(newPassword: string) {
  const session = await requireApiAuth();

  // Verify user is currently in passkey mode
  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (key?.hashed_password) {
    return { error: 'Already using password authentication.', data: null };
  }

  const hashed = await hashPassword(newPassword);

  // Atomic switch: set password, remove all passkeys
  await prisma.$transaction([
    prisma.key.updateMany({
      where: { user_id: session.user.userId },
      data: { hashed_password: hashed },
    }),
    prisma.webAuthnCredential.deleteMany({
      where: { user_id: session.user.userId },
    }),
  ]);

  void addEvent(
    'Switched to Password Auth',
    `User ${session.user.username} switched to password authentication`,
  );
  safeUpdateTag('getUsers');

  return { error: null, data: null };
}
```

Note: The passkey reauth verification must happen before calling this action. The client calls `verifyPasskeyReauth()` first, then calls `switchToPasswordMode()` with the new password. This is the same pattern used by the existing "Set Password" flow.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```
feat: add switchToPasswordMode server action
```

---

### Task 3: Refactor Settings UI - Conditional Auth Sections

The `UserManagement` component currently renders `TwoFactorSettings` and `PasskeySettings` unconditionally. Refactor to show sections based on auth mode, and add "Switch Authentication Method" action.

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Add auth mode detection and conditional rendering**

In `UserManagement.tsx`, the component already receives `hasPassword` (resolved from `hasPasswordPromise`). Use this to determine auth mode.

Replace the "Current User" section (lines ~476-531) where `TwoFactorSettings` and `PasskeySettings` are rendered. The key changes:

1. When `hasPassword` is true (password mode):
   - Show the password change button (existing)
   - Show `TwoFactorSettings` (existing)
   - Show "Switch to Passkey Authentication" button (new)
   - Hide `PasskeySettings`

2. When `hasPassword` is false (passkey mode):
   - Hide the password change button
   - Hide `TwoFactorSettings`
   - Show `PasskeySettings` (existing)
   - Show "Switch to Password Authentication" button (new)
   - Show single-user warning if `users.length === 1`

3. Update the security warning (lines 510-518): Only show for password-mode users without 2FA. Passkey-mode users are already secure.

The "Current User" `Surface` section should be restructured:

```tsx
{/* Current User section inside the Surface */}
{hasPassword ? (
  <>
    <TwoFactorSettings
      hasTwoFactor={hasTwoFactor}
      userCount={users.length}
      sandboxMode={sandboxMode}
    />
    {!sandboxMode && (
      <SettingsField
        label="Switch to Passkey Authentication"
        description="Replace your password with a passkey. Your password and two-factor authentication will be removed."
        testId="switch-to-passkey-field"
        control={
          <Button
            size="sm"
            color="primary"
            onClick={() => setShowSwitchToPasskey(true)}
          >
            Switch to Passkey
          </Button>
        }
      />
    )}
  </>
) : (
  <>
    <PasskeySettings
      initialPasskeys={initialPasskeys}
      sandboxMode={sandboxMode}
      hasPassword={hasPassword}
    />
    {users.length === 1 && !sandboxMode && (
      <Alert variant="warning">
        <AlertDescription>
          You are the only user. If you lose access to all your passkeys, you will need to reset the application database.
        </AlertDescription>
      </Alert>
    )}
    {!sandboxMode && (
      <SettingsField
        label="Switch to Password Authentication"
        description="Replace your passkeys with a password. All registered passkeys will be removed."
        testId="switch-to-password-field"
        control={
          <Button
            size="sm"
            color="primary"
            onClick={() => setShowSwitchToPassword(true)}
          >
            Switch to Password
          </Button>
        }
      />
    )}
  </>
)}
```

**Step 2: Add state variables**

Add to the component state declarations (around line 212):

```typescript
const [showSwitchToPasskey, setShowSwitchToPasskey] = useState(false);
const [showSwitchToPassword, setShowSwitchToPassword] = useState(false);
```

**Step 3: Update imports**

Add new action imports:

```typescript
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  resetAuthForUser,
  setPassword,
  switchToPasskeyMode,
  switchToPasswordMode,
  verifyPasskeyReauth,
} from '~/actions/webauthn';
```

Also import `SettingsField` if not already imported:
```typescript
import SettingsField from '~/components/settings/SettingsField';
```

**Step 4: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`
Expected: PASS

**Step 5: Commit**

```
refactor: conditionally render auth settings based on auth mode
```

---

### Task 4: Build "Switch to Passkey" Dialog

Add the dialog flow for switching from password mode to passkey mode: password verification -> passkey registration -> atomic switch.

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Add the dialog and handler**

Add a handler function (after `handleSetPassword`):

```typescript
const handleSwitchToPasskey = async (values: unknown): Promise<FormSubmissionResult> => {
  const { currentPassword } = values as { currentPassword: string };

  // Step 1: Generate registration options
  const { error: genError, data: regData } = await generateRegistrationOptions();
  if (genError || !regData) {
    return { success: false, formErrors: [genError ?? 'Failed to start registration'] };
  }

  // Step 2: Prompt passkey creation (must happen in same user gesture chain)
  let credential;
  try {
    credential = await startRegistration({ optionsJSON: regData.options });
  } catch (e) {
    if (e instanceof Error && e.name === 'NotAllowedError') {
      return { success: false, formErrors: ['Passkey registration was cancelled.'] };
    }
    return { success: false, formErrors: ['Passkey registration failed.'] };
  }

  // Step 3: Atomic switch on server
  const result = await switchToPasskeyMode(currentPassword, credential);
  if (result.error) {
    return { success: false, formErrors: [result.error] };
  }

  // Reload the page to reflect new auth mode
  window.location.reload();
  return { success: true };
};
```

Add the dialog JSX (after the existing dialogs, before closing `</div>`):

```tsx
<FormStoreProvider>
  <Dialog
    open={showSwitchToPasskey}
    closeDialog={() => setShowSwitchToPasskey(false)}
    title="Switch to Passkey Authentication"
    description="Enter your current password, then register a passkey. Your password and two-factor authentication will be removed."
    footer={
      <>
        <Button onClick={() => setShowSwitchToPasskey(false)}>Cancel</Button>
        <SubmitButton form="switchToPasskeyForm" color="destructive">
          Switch to Passkey
        </SubmitButton>
      </>
    }
  >
    <FormWithoutProvider onSubmit={handleSwitchToPasskey} id="switchToPasskeyForm">
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={currentUsername}
        readOnly
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <Field
        name="currentPassword"
        label="Current Password"
        component={PasswordField}
        required
        autoComplete="current-password"
      />
    </FormWithoutProvider>
  </Dialog>
</FormStoreProvider>
```

Note: Import `startRegistration` from `@simplewebauthn/browser` — this is already imported at the top of the file for the passkey reauth flow. Also import `generateRegistrationOptions` if not already done in Task 3. Check existing imports.

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`
Expected: PASS

**Step 3: Commit**

```
feat: add switch-to-passkey dialog in settings
```

---

### Task 5: Build "Switch to Password" Dialog

Add the dialog flow for switching from passkey mode to password mode: passkey reauth -> password entry -> atomic switch.

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Add the dialog and handler**

Add state for tracking reauth within this flow:

```typescript
const [switchToPasswordReauthed, setSwitchToPasswordReauthed] = useState(false);
const [switchToPasswordReauthError, setSwitchToPasswordReauthError] = useState<string | null>(null);
const [switchToPasswordReauthLoading, setSwitchToPasswordReauthLoading] = useState(false);
```

Add reauth handler:

```typescript
const handleSwitchToPasswordReauth = async () => {
  setSwitchToPasswordReauthError(null);
  setSwitchToPasswordReauthLoading(true);

  try {
    const { error: genError, data: regData } = await generateAuthenticationOptions();
    if (genError || !regData) {
      setSwitchToPasswordReauthError(genError ?? 'Failed to start verification');
      setSwitchToPasswordReauthLoading(false);
      return;
    }

    const credential = await startAuthentication({ optionsJSON: regData.options });
    const result = await verifyPasskeyReauth({ credential });

    if (result.error) {
      setSwitchToPasswordReauthError(result.error);
      setSwitchToPasswordReauthLoading(false);
      return;
    }

    setSwitchToPasswordReauthed(true);
    setSwitchToPasswordReauthLoading(false);
  } catch (e) {
    if (e instanceof Error && e.name === 'NotAllowedError') {
      setSwitchToPasswordReauthLoading(false);
      return;
    }
    setSwitchToPasswordReauthError('Verification failed');
    setSwitchToPasswordReauthLoading(false);
  }
};
```

Add password submit handler:

```typescript
const handleSwitchToPassword = async (values: unknown): Promise<FormSubmissionResult> => {
  const { newPassword, confirmNewPassword } = values as {
    newPassword: string;
    confirmNewPassword: string;
  };

  if (newPassword !== confirmNewPassword) {
    return { success: false, formErrors: ['Passwords do not match'] };
  }

  const result = await switchToPasswordMode(newPassword);
  if (result.error) {
    return { success: false, formErrors: [result.error] };
  }

  window.location.reload();
  return { success: true };
};
```

Add dialog JSX:

```tsx
<FormStoreProvider>
  <Dialog
    open={showSwitchToPassword}
    closeDialog={() => {
      setShowSwitchToPassword(false);
      setSwitchToPasswordReauthed(false);
      setSwitchToPasswordReauthError(null);
    }}
    title="Switch to Password Authentication"
    description="All your passkeys will be removed and replaced with a password."
    footer={
      switchToPasswordReauthed ? (
        <>
          <Button onClick={() => {
            setShowSwitchToPassword(false);
            setSwitchToPasswordReauthed(false);
          }}>
            Cancel
          </Button>
          <SubmitButton form="switchToPasswordForm" color="destructive">
            Switch to Password
          </SubmitButton>
        </>
      ) : null
    }
  >
    {switchToPasswordReauthed ? (
      <FormWithoutProvider onSubmit={handleSwitchToPassword} id="switchToPasswordForm">
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={currentUsername}
          readOnly
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <Field
          name="newPassword"
          label="New Password"
          component={PasswordField}
          showStrengthMeter
          required
          autoComplete="new-password"
          custom={{
            schema: passwordSchema,
            hint: 'At least 8 characters with lowercase, uppercase, number, and symbol',
          }}
        />
        <Field
          name="confirmNewPassword"
          label="Confirm New Password"
          component={PasswordField}
          required
          autoComplete="new-password"
          sameAs="newPassword"
        />
      </FormWithoutProvider>
    ) : (
      <div className="flex flex-col items-center gap-4 py-4">
        <Paragraph className="text-center">
          Verify your identity with a passkey to continue.
        </Paragraph>
        {switchToPasswordReauthError && (
          <p className="text-destructive text-sm">{switchToPasswordReauthError}</p>
        )}
        <Button
          onClick={() => void handleSwitchToPasswordReauth()}
          disabled={switchToPasswordReauthLoading}
          color="primary"
        >
          {switchToPasswordReauthLoading ? 'Verifying...' : 'Verify with passkey'}
        </Button>
      </div>
    )}
  </Dialog>
</FormStoreProvider>
```

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`
Expected: PASS

**Step 3: Commit**

```
feat: add switch-to-password dialog in settings
```

---

### Task 6: Remove `removePassword` Action and Clean Up Dead Code

The `removePassword` action and its associated recovery code generation are no longer needed since switching modes is now handled by the dedicated switch actions. Also remove the "Change Password" / "Set Password" button for passkey-mode users since mode switching is now explicit.

**Files:**
- Modify: `actions/webauthn.ts` (remove `removePassword`)
- Modify: `app/dashboard/settings/_components/UserManagement.tsx` (conditionally hide password button for passkey mode)

**Step 1: Remove `removePassword` from `actions/webauthn.ts`**

Delete the `removePassword` function (lines ~473-529). Check if it's imported or used anywhere else first.

Run: `pnpm knip` or grep for `removePassword` across the codebase to confirm it's unused.

**Step 2: Conditionally show password button only in password mode**

In `UserManagement.tsx`, the password change button (lines ~499-508) should only show when `hasPassword` is true:

```tsx
{!sandboxMode && hasPassword && (
  <Button
    onClick={() => setIsChangingPassword(true)}
    size="sm"
    className="tablet:w-auto w-full"
    color="primary"
  >
    Change Password
  </Button>
)}
```

Remove the conditional `hasPassword ? 'Change Password' : 'Set Password'` logic since passkey-mode users now use the "Switch to Password" flow instead of "Set Password".

Also remove the passkey reauth flow within the password change dialog (the `!passkeyVerified` branch, lines ~697-712) since that flow is replaced by the switch-to-password dialog. Simplify the password dialog to only handle password changes for password-mode users.

**Step 3: Clean up unused state**

Remove `passkeyVerified`, `passkeyReauthError`, `reauthLoading` state variables and `handlePasskeyReauth`, `handleSetPassword` functions since these are replaced by the switch-to-password flow.

**Step 4: Run typecheck, lint, and knip**

Run: `pnpm typecheck && pnpm lint --fix && pnpm knip`
Expected: PASS, no unused exports

**Step 5: Commit**

```
refactor: remove dead code from old password/passkey hybrid flows
```

---

### Task 7: Update Security Warning

The existing security warning ("Your account is only protected by a password...") only applies to password-mode users without 2FA. Ensure it's hidden for passkey-mode users.

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Update the warning condition**

The current condition (line ~510):
```tsx
{!hasTwoFactor && initialPasskeys.length === 0 && !sandboxMode && (
```

Change to only show for password-mode users without 2FA:
```tsx
{hasPassword && !hasTwoFactor && !sandboxMode && (
```

Update the warning text to be simpler since passkeys are no longer mentioned as an option alongside password:
```tsx
<Alert variant="warning" className="my-0">
  <AlertTitle>Security Warning</AlertTitle>
  <AlertDescription>
    Your account is only protected by a password. Enable two-factor
    authentication for stronger security.
  </AlertDescription>
</Alert>
```

**Step 2: Run lint**

Run: `pnpm lint --fix`
Expected: PASS

**Step 3: Commit**

```
fix: only show security warning for password-mode users without 2FA
```

---

### Task 8: Update the "Reset Auth" Button Visibility in User Table

Currently the "Reset Auth" button shows when a user has TOTP or passkeys. This is correct — it should show whenever a user has non-default auth that needs resetting. No changes needed to the logic, but verify and update the column display.

**Files:**
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Review and update the auth mode column**

Consider replacing the separate "2FA" and "Passkeys" columns with a single "Auth Method" column that shows "Password", "Password + 2FA", or "Passkey" to better reflect the mutually exclusive model:

```tsx
{
  id: 'authMethod',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Auth Method" />
  ),
  cell: ({ row }) => {
    const hasPasskeys = row.original.webAuthnCredentials.length > 0;
    const has2FA = row.original.totpCredential?.verified === true;

    if (hasPasskeys) return 'Passkey';
    if (has2FA) return 'Password + 2FA';
    return 'Password';
  },
},
```

Remove the old `2fa` and `passkeys` columns.

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint --fix`
Expected: PASS

**Step 3: Commit**

```
refactor: replace 2FA/passkeys columns with unified auth method column
```

---

### Task 9: Format and Final Verification

**Step 1: Run formatter**

Run: `pnpm prettier --write "app/dashboard/settings/_components/UserManagement.tsx" "app/dashboard/settings/_components/PasskeySettings.tsx" "app/dashboard/settings/_components/TwoFactorSettings.tsx" "actions/webauthn.ts"`

**Step 2: Run full quality checks**

Run: `pnpm typecheck && pnpm lint --fix && pnpm test`
Expected: All PASS

**Step 3: Manual testing checklist**

Start the dev server and verify:

1. **Password-mode user sees:**
   - Password change button
   - Two-factor settings
   - "Switch to Passkey" button
   - No passkey management section

2. **Passkey-mode user sees:**
   - Passkey management (add/remove)
   - "Switch to Password" button
   - No two-factor section
   - No password change button
   - Single-user warning if applicable

3. **Switch password -> passkey:**
   - Enter password
   - Browser prompts passkey registration
   - Page reloads to passkey-mode settings

4. **Switch passkey -> password:**
   - Verify with passkey
   - Enter new password
   - Page reloads to password-mode settings

5. **Admin reset:**
   - Reset another user's auth
   - User gets temp password
   - User signs in and is in password mode

6. **Sign-in page:**
   - "Trouble signing in?" still works for password+2FA users
   - Passkey sign-in still works

**Step 4: Commit any final fixes**

```
chore: format and fix any remaining issues
```
