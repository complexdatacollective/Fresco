# Auth Mode Redesign: Mutually Exclusive Password/Passkey Modes

**Date**: 2026-03-03
**Status**: Approved

## Problem

Authentication methods (password, TOTP, passkey) have interdependencies that aren't enforced:

1. "Trouble signing in?" recovery code flow is always visible, but passkey-only users have no recovery codes.
2. TOTP toggle appears for passkey-only users even though passkeys are inherently multi-factor.
3. No clear recovery path for passkey-only users who lose access.
4. Mixed auth states create confusing UX.

## Design

### Core Model

Two mutually exclusive authentication modes:

| | Password Mode | Passkey Mode |
|---|---|---|
| Primary auth | Password | Passkey(s) |
| Optional 2FA | TOTP | N/A (inherently MFA) |
| Self-service recovery | Recovery codes (when TOTP enabled) | None |
| Admin recovery | Reset Auth (temp password) | Reset Auth (temp password) |

A user is always in exactly one mode. Switching between modes is an explicit, atomic action.

### Mode Detection

Check `Key.hashed_password`:
- Non-null → password mode
- Null → passkey mode

### Flow 1: Password Mode → Passkey Mode

1. User clicks "Switch to Passkey Authentication" in settings.
2. Confirmation dialog explains: password and TOTP (if enabled) will be removed.
3. User enters current password to verify identity.
4. Browser prompts passkey registration (WebAuthn).
5. Atomic transaction: set `Key.hashed_password = null`, delete `TotpCredential`, delete all `RecoveryCode`s, store new `WebAuthnCredential`.
6. UI refreshes to passkey-mode settings.

If passkey registration fails, nothing is deleted. User stays in password mode.

### Flow 2: Passkey Mode → Password Mode

1. User clicks "Switch to Password Authentication" in settings.
2. Confirmation dialog explains: all passkeys will be removed.
3. User verifies with passkey (existing reauth flow).
4. User enters and confirms new password.
5. Atomic transaction: set password hash, delete all `WebAuthnCredential`s.
6. UI refreshes to password-mode settings.

### Flow 3: Admin Reset (unchanged)

Existing `resetAuthForUser()` already works correctly:
1. Atomically deletes all passkeys, TOTP, recovery codes.
2. Sets random temp password.
3. Admin shares temp password with user.
4. User is now in password mode.

### Settings UI Changes

**Passkey-mode users see:**
- Passkey management (add/remove) — existing behavior
- "Switch to Password Authentication" action
- TOTP section is **hidden** (not disabled)
- No password change option

**Password-mode users see:**
- Password change — existing behavior
- TOTP settings — existing behavior
- "Switch to Passkey Authentication" action
- No passkey management section

### Sign-in Page Changes

- "Trouble signing in?" link remains always visible. If a passkey-only user clicks it and enters a recovery code, it simply fails (no codes exist). This avoids leaking auth mode information from the unauthenticated sign-in page.
- All other sign-in behavior unchanged.

### What Stays the Same

- Passkey add/remove within passkey mode (existing constraints)
- TOTP enable/disable/regenerate within password mode (existing logic)
- Recovery code generation and usage (existing logic)
- Sign-up flow (choose passkey or password at account creation)
- Rate limiting, event logging
- Admin "Reset Auth" action

### Edge Cases

- **Single-user instance**: If the sole admin is in passkey mode and loses their passkey, there's no admin to reset them. The existing "single account warning" (from TOTP settings) should also appear in passkey mode.
- **Last passkey removal**: Already prevented — cannot remove last passkey when no password is set.
- **Mid-switch failure**: Atomic transactions ensure no partial state. Registration failure = no changes applied.
