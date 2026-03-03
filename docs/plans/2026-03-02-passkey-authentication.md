# Passkey (WebAuthn) Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add WebAuthn passkey support as a full passwordless authentication alternative, alongside the existing password and password+TOTP flows.

**Architecture:** Uses `@simplewebauthn/server` and `@simplewebauthn/browser` for WebAuthn registration/verification. Challenges stored in HMAC-signed cookies (same pattern as existing 2FA tokens). RP ID derived from request headers at runtime — no new env vars. New `WebAuthnCredential` Prisma model linked to `User`. Passkeys bypass TOTP (inherent MFA). Users can remove their password after registering a passkey.

**Tech Stack:** SimpleWebAuthn, Prisma, Next.js Server Actions, Zod/mini, React

**Design Doc:** `docs/plans/2026-03-02-passkey-authentication-design.md`

**Browser Quirks Reference:** <https://simplewebauthn.dev/docs/advanced/browser-quirks>

---

## Browser Quirks — Cross-Cutting Concerns

These quirks affect all client-side WebAuthn calls (Tasks 11, 12, 16). Every component that calls `startRegistration()` or `startAuthentication()` must follow these rules.

### Safari User Gesture Requirement (iOS < 17.4, macOS < 14.4)

Safari requires that `startRegistration()` and `startAuthentication()` be invoked within a **native click handler's async chain**. The gesture context is lost if:

- A non-native fetch wrapper (ofetch, axios) is used between the click and the WebAuthn call
- Synthetic events from UI libraries replace native click events
- Excessive async indirection breaks the call chain

**Our mitigation:** Next.js Server Actions use native `fetch` internally, so calling a server action followed immediately by `startAuthentication()` / `startRegistration()` within the same `async onClick` handler preserves the user gesture. **Do not** insert `setTimeout`, extra `await`s for non-essential work, or third-party fetch wrappers between the server action call and the SimpleWebAuthn call.

**Pattern to follow in all WebAuthn button handlers:**

```typescript
// CORRECT: single async chain from click → server action → WebAuthn call
const handleClick = async () => {
  const { data } = await generateOptions(); // server action (native fetch)
  const result = await startAuthentication({ optionsJSON: data.options }); // immediate
  await verifyResult({ credential: result }); // server action
};

// WRONG: breaks gesture chain
const handleClick = async () => {
  const { data } = await generateOptions();
  await someUnrelatedAsyncWork(); // breaks Safari gesture
  const result = await startAuthentication({ optionsJSON: data.options });
};
```

### Safari Conditional UI Limit (iOS < 17.4, macOS < 14.4)

On older Safari, only **one** `navigator.credentials.create()` or `.get()` call is allowed per page navigation without a user gesture. This means:

- Conditional mediation (autofill passkey) counts as that one call
- If conditional mediation is active, a subsequent button-triggered `.get()` call may fail without a fresh user gesture
- In SPAs, this limit only resets on full page reload

**Our mitigation:** Since the sign-in page is server-rendered (not SPA navigation), each visit gets a fresh allowance. If we implement conditional mediation in the future, we must abort the conditional `.get()` before starting a button-triggered one. For the initial implementation, **skip conditional mediation** and use only the explicit "Sign in with a passkey" button to avoid this edge case.

### Firefox Ed25519 Key Registration (Firefox < 119)

Security keys using Ed25519 (`-8` algorithm) may fail registration in Firefox versions before 119 due to a bug in authenticator-rs. This is resolved in Firefox 119+. **No action needed** — the bug is old enough that essentially all Firefox users have the fix. If a registration failure surfaces with the error "Leftover bytes detected while parsing authenticator data", this is the cause.

### Edge Legacy — TextEncoder

The legacy (non-Chromium) Edge browser lacks `TextEncoder`. `@simplewebauthn/browser` depends on it. **No action needed** — legacy Edge is EOL and Fresco doesn't support it (minimum is modern Chromium-based Edge).

---

## Milestone 1: Database & Dependencies

### Task 1: Install SimpleWebAuthn packages

**Files:**

- Modify: `package.json`

**Step 1: Install dependencies**

Run: `pnpm add @simplewebauthn/server @simplewebauthn/browser`

**Step 2: Verify installation**

Run: `pnpm ls @simplewebauthn/server @simplewebauthn/browser`
Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add @simplewebauthn/server and @simplewebauthn/browser dependencies"
```

---

### Task 2: Add WebAuthnCredential Prisma model

**Files:**

- Modify: `lib/db/schema.prisma`

**Step 1: Add the WebAuthnCredential model to `lib/db/schema.prisma`**

Add after the `Key` model (around line 40):

```prisma
model WebAuthnCredential {
  id           String    @id @default(cuid())
  user_id      String
  credentialId String    @unique
  publicKey    String
  counter      BigInt    @default(0)
  transports   String?
  deviceType   String
  backedUp     Boolean   @default(false)
  friendlyName String?
  createdAt    DateTime  @default(now())
  lastUsedAt   DateTime?

  user User @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}
```

`credentialId` and `publicKey` are base64url-encoded strings. `transports` is comma-separated (e.g. `"internal,hybrid"`). `deviceType` is `"singleDevice"` or `"multiDevice"`.

**Step 2: Add the relation to the User model**

In the `User` model (line 14), add:

```prisma
webAuthnCredentials WebAuthnCredential[]
```

Place it after the `recoveryCodes` relation, so the User model becomes:

```prisma
model User {
  id                  String               @id @default(cuid())
  username            String               @unique
  auth_session        Session[]
  key                 Key[]
  totpCredential      TotpCredential?
  recoveryCodes       RecoveryCode[]
  webAuthnCredentials WebAuthnCredential[]
}
```

**Step 3: Generate Prisma client and create migration**

Run: `pnpm prisma generate`
Expected: Prisma Client generated successfully

Run: `pnpm prisma migrate dev --name add_webauthn_credential`
Expected: Migration created and applied

**Step 4: Verify the schema is valid**

Run: `pnpm prisma validate`
Expected: No errors

**Step 5: Commit**

```bash
git add lib/db/schema.prisma lib/db/migrations/
git commit -m "feat: add WebAuthnCredential model to Prisma schema"
```

---

### Task 3: Update `getUsers` query to include WebAuthn credential info

The settings page user table needs to show passkey status (like it shows 2FA status). Update the `getUsers` query.

**Files:**

- Modify: `queries/users.ts`

**Step 1: Write the failing test (if tests exist for getUsers) or update the query directly**

Modify `queries/users.ts` to include `webAuthnCredentials` in the select:

```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    totpCredential: {
      select: { verified: true },
    },
    webAuthnCredentials: {
      select: { id: true },
    },
  },
  orderBy: {
    username: 'asc',
  },
});
```

This adds a minimal `webAuthnCredentials` array (just IDs) so the UI can check `user.webAuthnCredentials.length > 0`.

**Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add queries/users.ts
git commit -m "feat: include webAuthnCredentials in getUsers query"
```

---

## Milestone 2: Server-Side WebAuthn Utilities

### Task 4: Create WebAuthn utility library

This library provides RP config derivation and challenge cookie creation/verification — used by the server actions.

**Files:**

- Create: `lib/webauthn.ts`
- Create: `lib/__tests__/webauthn.test.ts`

**Step 1: Write failing tests for the utility functions**

Create `lib/__tests__/webauthn.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map([['origin', 'https://fresco.example.com']])),
}));

vi.mock('~/queries/appSettings', () => ({
  getInstallationId: vi.fn().mockResolvedValue('test-installation-id'),
}));

describe('getWebAuthnConfig', () => {
  it('derives rpID and origin from the origin header', async () => {
    const { getWebAuthnConfig } = await import('../webauthn');
    const config = await getWebAuthnConfig();
    expect(config.rpID).toBe('fresco.example.com');
    expect(config.rpName).toBe('Fresco');
    expect(config.origin).toBe('https://fresco.example.com');
  });
});

describe('challenge cookie', () => {
  it('creates and verifies a valid challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge-base64url';

    const cookieValue = await createChallengeCookie(challenge);
    expect(typeof cookieValue).toBe('string');

    const result = await verifyChallengeCookie(cookieValue);
    expect(result).toBe(challenge);
  });

  it('rejects a tampered challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge';

    const cookieValue = await createChallengeCookie(challenge);
    const tampered = 'tampered' + cookieValue;

    const result = await verifyChallengeCookie(tampered);
    expect(result).toBeNull();
  });

  it('rejects an expired challenge cookie', async () => {
    const { createChallengeCookie, verifyChallengeCookie } =
      await import('../webauthn');
    const challenge = 'test-challenge';

    const cookieValue = await createChallengeCookie(challenge);

    // Fast-forward time past the 5 minute TTL
    vi.useFakeTimers();
    vi.advanceTimersByTime(6 * 60 * 1000);

    const result = await verifyChallengeCookie(cookieValue);
    expect(result).toBeNull();

    vi.useRealTimers();
  });
});
```

**Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run lib/__tests__/webauthn.test.ts`
Expected: FAIL — module `../webauthn` not found

**Step 3: Implement `lib/webauthn.ts`**

```typescript
import 'server-only';

import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { getInstallationId } from '~/queries/appSettings';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function deriveWebAuthnKey(installationId: string): Buffer {
  return Buffer.from(
    hkdfSync('sha256', installationId, '', 'fresco-webauthn-challenge', 32),
  );
}

export async function getWebAuthnConfig() {
  const headerStore = await headers();
  const origin =
    headerStore.get('origin') ??
    headerStore.get('referer') ??
    'http://localhost:3000';
  const url = new URL(origin);

  return {
    rpID: url.hostname,
    rpName: 'Fresco',
    origin: url.origin,
  };
}

export async function createChallengeCookie(
  challenge: string,
): Promise<string> {
  const installationId = await getInstallationId();
  if (!installationId) {
    throw new Error('Installation ID not configured');
  }

  const key = deriveWebAuthnKey(installationId);
  const timestamp = Date.now().toString();
  const payload = `${challenge}:${timestamp}`;
  const payloadEncoded = Buffer.from(payload).toString('base64url');
  const signature = createHmac('sha256', key)
    .update(payload)
    .digest('base64url');

  return `${payloadEncoded}:${signature}`;
}

export async function verifyChallengeCookie(
  cookie: string,
): Promise<string | null> {
  const installationId = await getInstallationId();
  if (!installationId) {
    return null;
  }

  const key = deriveWebAuthnKey(installationId);
  const separatorIndex = cookie.lastIndexOf(':');
  if (separatorIndex === -1) return null;

  const payloadEncoded = cookie.slice(0, separatorIndex);
  const signature = cookie.slice(separatorIndex + 1);

  let payload: string;
  try {
    payload = Buffer.from(payloadEncoded, 'base64url').toString();
  } catch {
    return null;
  }

  const expectedSignature = createHmac('sha256', key)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  const colonIndex = payload.lastIndexOf(':');
  if (colonIndex === -1) return null;

  const challenge = payload.slice(0, colonIndex);
  const timestampStr = payload.slice(colonIndex + 1);
  const timestamp = Number(timestampStr);

  if (Number.isNaN(timestamp)) return null;
  if (Date.now() - timestamp > CHALLENGE_TTL_MS) return null;

  return challenge;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run lib/__tests__/webauthn.test.ts`
Expected: All tests PASS

**Step 5: Run formatter and linter**

Run: `pnpm prettier --write lib/webauthn.ts lib/__tests__/webauthn.test.ts`
Run: `pnpm lint --fix`

**Step 6: Commit**

```bash
git add lib/webauthn.ts lib/__tests__/webauthn.test.ts
git commit -m "feat: add WebAuthn utility library with challenge cookie support"
```

---

### Task 5: Create WebAuthn Zod validation schemas

**Files:**

- Create: `schemas/webauthn.ts`

**Step 1: Create the validation schemas**

Create `schemas/webauthn.ts`:

```typescript
import { z } from 'zod/mini';

export const generateRegistrationOptionsSchema = z.object({
  friendlyName: z.optional(z.string().check(z.maxLength(100))),
});

export const verifyRegistrationSchema = z.object({
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
      transports: z.optional(z.array(z.string())),
    }),
    type: z.literal('public-key'),
    clientExtensionResults: z.object({}).catchall(z.unknown()),
    authenticatorAttachment: z.optional(z.string()),
  }),
});

export const verifyAuthenticationSchema = z.object({
  credential: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.optional(z.nullable(z.string())),
    }),
    type: z.literal('public-key'),
    clientExtensionResults: z.object({}).catchall(z.unknown()),
    authenticatorAttachment: z.optional(z.string()),
  }),
});

export const removePasskeySchema = z.object({
  credentialId: z.string(),
});
```

Note: The exact shape of these schemas may need adjustment to match `@simplewebauthn/browser`'s response types. Consult `@simplewebauthn/server`'s `RegistrationResponseJSON` and `AuthenticationResponseJSON` types and align the schemas accordingly. The above is a reasonable starting point.

**Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Run formatter**

Run: `pnpm prettier --write schemas/webauthn.ts`

**Step 4: Commit**

```bash
git add schemas/webauthn.ts
git commit -m "feat: add Zod schemas for WebAuthn request validation"
```

---

## Milestone 3: Server Actions

### Task 6: Create WebAuthn server actions for registration

**Files:**

- Create: `actions/webauthn.ts`
- Create: `actions/__tests__/webauthn.test.ts`

**Step 1: Write failing tests for registration actions**

Create `actions/__tests__/webauthn.test.ts` with tests for `generateRegistrationOptions` and `verifyRegistration`. Follow the mocking pattern from `actions/__tests__/auth.test.ts`:

- Mock `server-only`, `next/cache`, `next/headers`, `next/navigation`, `next/server`
- Mock `~/lib/db` with Prisma methods for `webAuthnCredential` (findMany, create) and `user` (findUnique)
- Mock `~/utils/auth` with `requireApiAuth`
- Mock `~/lib/webauthn` (getWebAuthnConfig, createChallengeCookie, verifyChallengeCookie)
- Mock `@simplewebauthn/server` (generateRegistrationOptions, verifyRegistrationResponse)

Test cases for `generateRegistrationOptions`:

- Returns options when authenticated
- Excludes existing credentials from the options
- Stores challenge in cookie

Test cases for `verifyRegistration`:

- Returns error when challenge cookie is invalid/expired
- Returns error when verification fails
- Stores credential in DB on success
- Returns the new credential info on success

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: FAIL

**Step 3: Implement registration actions in `actions/webauthn.ts`**

```typescript
'use server';

import {
  generateRegistrationOptions as generateRegOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { cookies } from 'next/headers';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { checkRateLimit, recordLoginAttempt } from '~/lib/rateLimit';
import { createSessionCookie } from '~/lib/session';
import {
  createChallengeCookie,
  getWebAuthnConfig,
  verifyChallengeCookie,
} from '~/lib/webauthn';
import { requireApiAuth } from '~/utils/auth';
import { getClientIp } from '~/utils/getClientIp';
import { addEvent } from './activityFeed';

const CHALLENGE_COOKIE_NAME = 'webauthn_challenge';

async function setChallengeCookie(challenge: string) {
  const cookieValue = await createChallengeCookie(challenge);
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 300, // 5 minutes
  });
}

async function getAndClearChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
  if (!cookieValue) return null;
  return verifyChallengeCookie(cookieValue);
}

export async function generateRegistrationOptions(friendlyName?: string) {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const existingCredentials = await prisma.webAuthnCredential.findMany({
    where: { user_id: session.user.userId },
    select: { credentialId: true, transports: true },
  });

  const options = await generateRegOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: session.user.username,
    userID: new TextEncoder().encode(session.user.userId),
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports?.split(',') as
        | AuthenticatorTransport[]
        | undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await setChallengeCookie(options.challenge);

  return {
    error: null,
    data: { options, friendlyName: friendlyName ?? null },
  };
}

export async function verifyRegistration(data: {
  credential: unknown;
  friendlyName?: string;
}) {
  const session = await requireApiAuth();
  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return { error: 'Challenge expired. Please try again.', data: null };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: data.credential as Parameters<
        typeof verifyRegistrationResponse
      >[0]['response'],
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
    });
  } catch {
    return { error: 'Registration verification failed.', data: null };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: 'Registration verification failed.', data: null };
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const newCredential = await prisma.webAuthnCredential.create({
    data: {
      user_id: session.user.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: BigInt(credential.counter),
      transports: credential.transports?.join(',') ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      friendlyName: data.friendlyName ?? null,
    },
  });

  void addEvent(
    'Passkey Registered',
    `User ${session.user.username} registered a passkey${data.friendlyName ? ` (${data.friendlyName})` : ''}`,
  );
  safeUpdateTag('activityFeed');
  safeUpdateTag('getUsers');

  return {
    error: null,
    data: {
      id: newCredential.id,
      friendlyName: newCredential.friendlyName,
      deviceType: newCredential.deviceType,
      createdAt: newCredential.createdAt,
    },
  };
}
```

Note: The exact types for `@simplewebauthn/server` may need adjustments based on the installed version's API. Consult the package's type exports (e.g. `AuthenticatorTransportFuture`) and adjust imports accordingly. Use `pnpm typecheck` to catch any mismatches.

**Step 4: Run tests**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: Registration tests PASS

**Step 5: Run formatter and linter**

Run: `pnpm prettier --write actions/webauthn.ts actions/__tests__/webauthn.test.ts`
Run: `pnpm lint --fix`

**Step 6: Commit**

```bash
git add actions/webauthn.ts actions/__tests__/webauthn.test.ts
git commit -m "feat: add WebAuthn registration server actions"
```

---

### Task 7: Add WebAuthn authentication server actions

**Files:**

- Modify: `actions/webauthn.ts`
- Modify: `actions/__tests__/webauthn.test.ts`

**Step 1: Write failing tests for authentication actions**

Add to `actions/__tests__/webauthn.test.ts`:

Test cases for `generateAuthenticationOptions`:

- Returns options with empty allowCredentials (discoverable flow)
- Stores challenge in cookie

Test cases for `verifyAuthentication`:

- Returns error when challenge cookie is missing/expired
- Returns error when credential is not found in DB
- Returns error when verification fails
- Creates session cookie on success
- Updates credential counter and lastUsedAt on success
- Applies rate limiting by IP
- Bypasses TOTP (no 2FA token required)

**Step 2: Run tests to verify new tests fail**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: New authentication tests FAIL

**Step 3: Add authentication actions to `actions/webauthn.ts`**

Add these two functions to the existing file:

```typescript
export async function generateAuthenticationOptions() {
  const config = await getWebAuthnConfig();

  const options = await generateAuthOptions({
    rpID: config.rpID,
    userVerification: 'preferred',
    // Empty allowCredentials = discoverable credentials flow
  });

  await setChallengeCookie(options.challenge);

  return { error: null, data: { options } };
}

export async function verifyAuthentication(data: { credential: unknown }) {
  const ipAddress = await getClientIp();

  const rateLimitResult = await checkRateLimit(null, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      error: 'Too many attempts. Please try again later.',
      data: null,
      rateLimited: true,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  const config = await getWebAuthnConfig();

  const challenge = await getAndClearChallengeCookie();
  if (!challenge) {
    return { error: 'Challenge expired. Please try again.', data: null };
  }

  const credential = data.credential as Parameters<
    typeof verifyAuthenticationResponse
  >[0]['response'];

  // Look up the stored credential by its ID
  const storedCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: credential.id },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!storedCredential) {
    void recordLoginAttempt(null, ipAddress, false);
    return { error: 'Passkey not recognized.', data: null };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      credential: {
        id: storedCredential.credentialId,
        publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
        counter: Number(storedCredential.counter),
        transports: storedCredential.transports?.split(',') as
          | AuthenticatorTransport[]
          | undefined,
      },
    });
  } catch {
    void recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return { error: 'Authentication failed.', data: null };
  }

  if (!verification.verified) {
    void recordLoginAttempt(storedCredential.user.username, ipAddress, false);
    return { error: 'Authentication failed.', data: null };
  }

  // Update counter and lastUsedAt
  await prisma.webAuthnCredential.update({
    where: { id: storedCredential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  await recordLoginAttempt(storedCredential.user.username, ipAddress, true);
  await createSessionCookie(storedCredential.user.id);

  void addEvent(
    'Passkey Login',
    `User ${storedCredential.user.username} logged in with a passkey`,
  );
  safeUpdateTag('activityFeed');

  return { error: null, data: { success: true } };
}
```

Note: The `checkRateLimit` function currently requires a username. For passkey discoverable flow, username is unknown. Check if `checkRateLimit` in `lib/rateLimit.ts` handles `null` usernames — if not, you'll need to modify it to support IP-only rate limiting (pass `null` for username).

**Step 4: Run tests**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: All tests PASS

**Step 5: Run formatter and linter**

Run: `pnpm prettier --write actions/webauthn.ts actions/__tests__/webauthn.test.ts`
Run: `pnpm lint --fix`

**Step 6: Commit**

```bash
git add actions/webauthn.ts actions/__tests__/webauthn.test.ts
git commit -m "feat: add WebAuthn authentication server actions"
```

---

### Task 8: Add passkey management actions (remove passkey, remove password, set password)

**Files:**

- Modify: `actions/webauthn.ts`

**Step 1: Write failing tests**

Add to `actions/__tests__/webauthn.test.ts`:

Test cases for `removePasskey`:

- Requires auth
- Returns error if credential doesn't belong to user
- Returns error if it's the user's only passkey and they have no password
- Deletes the credential on success

Test cases for `removePassword`:

- Requires auth
- Returns error if user has no passkeys
- Requires current password verification
- Sets `Key.hashed_password` to null on success
- Generates recovery codes if none exist

Test cases for `setPassword`:

- Requires auth (user must already be logged in, e.g. via passkey)
- Validates password strength
- Sets `Key.hashed_password` on success

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`

**Step 3: Implement the management actions**

Add to `actions/webauthn.ts`:

```typescript
export async function removePasskey(credentialDbId: string) {
  const session = await requireApiAuth();

  const credential = await prisma.webAuthnCredential.findUnique({
    where: { id: credentialDbId },
  });

  if (!credential || credential.user_id !== session.user.userId) {
    return { error: 'Passkey not found.', data: null };
  }

  // Check if this is the last passkey AND user has no password
  const [passkeyCount, key] = await Promise.all([
    prisma.webAuthnCredential.count({
      where: { user_id: session.user.userId },
    }),
    prisma.key.findFirst({
      where: { user_id: session.user.userId },
      select: { hashed_password: true },
    }),
  ]);

  if (passkeyCount <= 1 && !key?.hashed_password) {
    return {
      error: 'Cannot remove your only passkey without a password set.',
      data: null,
    };
  }

  await prisma.webAuthnCredential.delete({ where: { id: credentialDbId } });

  void addEvent(
    'Passkey Removed',
    `User ${session.user.username} removed a passkey${credential.friendlyName ? ` (${credential.friendlyName})` : ''}`,
  );
  safeUpdateTag(['activityFeed', 'getUsers']);

  return { error: null, data: null };
}

export async function getUserPasskeys() {
  const session = await requireApiAuth();

  const passkeys = await prisma.webAuthnCredential.findMany({
    where: { user_id: session.user.userId },
    select: {
      id: true,
      friendlyName: true,
      deviceType: true,
      createdAt: true,
      lastUsedAt: true,
      backedUp: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return { error: null, data: passkeys };
}
```

For `removePassword` and `setPassword`, add to the same file:

```typescript
import { hashPassword, verifyPassword } from '~/utils/password';
import { generateRecoveryCodes, hashRecoveryCode } from '~/lib/totp';

export async function removePassword(currentPassword: string) {
  const session = await requireApiAuth();

  // Must have at least one passkey to go passwordless
  const passkeyCount = await prisma.webAuthnCredential.count({
    where: { user_id: session.user.userId },
  });

  if (passkeyCount === 0) {
    return {
      error: 'Register a passkey before removing your password.',
      data: null,
    };
  }

  const key = await prisma.key.findFirst({
    where: { user_id: session.user.userId },
  });

  if (!key?.hashed_password) {
    return { error: 'No password is set.', data: null };
  }

  const valid = await verifyPassword(currentPassword, key.hashed_password);
  if (!valid) {
    return { error: 'Incorrect password.', data: null };
  }

  // Check if recovery codes exist; generate if not
  const existingCodes = await prisma.recoveryCode.count({
    where: { user_id: session.user.userId, usedAt: null },
  });

  let recoveryCodes: string[] | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.key.update({
      where: { id: key.id },
      data: { hashed_password: null },
    });

    if (existingCodes === 0) {
      recoveryCodes = generateRecoveryCodes();
      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((rc) => ({
          user_id: session.user.userId,
          codeHash: hashRecoveryCode(rc),
        })),
      });
    }
  });

  void addEvent(
    'Password Removed',
    `User ${session.user.username} removed their password (passkey-only)`,
  );
  safeUpdateTag('activityFeed');

  return { error: null, data: { recoveryCodes } };
}

export async function setPassword(newPassword: string) {
  const session = await requireApiAuth();

  const hashed = await hashPassword(newPassword);

  await prisma.key.updateMany({
    where: { user_id: session.user.userId },
    data: { hashed_password: hashed },
  });

  void addEvent('Password Set', `User ${session.user.username} set a password`);
  safeUpdateTag('activityFeed');

  return { error: null, data: null };
}
```

**Step 4: Run tests**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: All tests PASS

**Step 5: Typecheck, format, lint**

Run: `pnpm typecheck && pnpm prettier --write actions/webauthn.ts actions/__tests__/webauthn.test.ts && pnpm lint --fix`

**Step 6: Commit**

```bash
git add actions/webauthn.ts actions/__tests__/webauthn.test.ts
git commit -m "feat: add passkey management server actions (remove passkey, remove/set password)"
```

---

### Task 9: Add admin "Reset auth" action

**Files:**

- Modify: `actions/webauthn.ts` (or create a new action in `actions/users.ts` if more appropriate)

**Step 1: Write failing tests**

Test cases for `resetAuthForUser`:

- Requires auth
- Cannot reset your own auth
- Removes all passkeys, TOTP, and recovery codes for the target user
- Sets a random temporary password
- Returns the temporary password to display to the admin

**Step 2: Implement `resetAuthForUser`**

```typescript
import { randomBytes } from 'node:crypto';

export async function resetAuthForUser(userId: string) {
  const session = await requireApiAuth();

  if (session.user.userId === userId) {
    return { error: 'Cannot reset your own authentication.', data: null };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!targetUser) {
    return { error: 'User not found.', data: null };
  }

  // Generate a temporary password
  const tempPassword = randomBytes(12).toString('base64url');
  const hashedTempPassword = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.webAuthnCredential.deleteMany({ where: { user_id: userId } }),
    prisma.totpCredential.deleteMany({ where: { user_id: userId } }),
    prisma.recoveryCode.deleteMany({ where: { user_id: userId } }),
    prisma.key.updateMany({
      where: { user_id: userId },
      data: { hashed_password: hashedTempPassword },
    }),
  ]);

  void addEvent(
    'Auth Reset',
    `User ${session.user.username} reset authentication for ${targetUser.username}`,
  );
  safeUpdateTag(['activityFeed', 'getUsers']);

  return { error: null, data: { temporaryPassword: tempPassword } };
}
```

**Step 3: Run tests**

Run: `pnpm vitest run actions/__tests__/webauthn.test.ts`
Expected: All tests PASS

**Step 4: Format, lint, commit**

```bash
pnpm prettier --write actions/webauthn.ts actions/__tests__/webauthn.test.ts
pnpm lint --fix
git add actions/webauthn.ts actions/__tests__/webauthn.test.ts
git commit -m "feat: add admin resetAuthForUser action"
```

---

### Task 10: Add recovery code login action

Currently recovery codes only work after password+TOTP login (via `verifyTwoFactor`). We need a standalone recovery code login flow for passkey-only users who lost their device.

**Files:**

- Modify: `actions/auth.ts`
- Modify: `actions/__tests__/auth.test.ts`

**Step 1: Write failing tests**

Test cases for `recoveryCodeLogin`:

- Returns error when username not found
- Returns error when recovery code is invalid
- Returns error when rate limited
- Creates session on success
- Marks recovery code as used

**Step 2: Implement `recoveryCodeLogin` in `actions/auth.ts`**

```typescript
export async function recoveryCodeLogin(data: {
  username: string;
  recoveryCode: string;
}): Promise<FormSubmissionResult> {
  const ipAddress = await getClientIp();

  const rateLimitResult = await checkRateLimit(data.username, ipAddress);
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      formErrors: [`Too many attempts. Please try again later.`],
    };
  }

  const user = await prisma.user.findUnique({
    where: { username: data.username },
    select: { id: true, username: true },
  });

  if (!user) {
    void recordLoginAttempt(data.username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Invalid username or recovery code'],
    };
  }

  const codeHash = hashRecoveryCode(data.recoveryCode);

  const { count } = await prisma.recoveryCode.updateMany({
    where: {
      user_id: user.id,
      codeHash,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (count === 0) {
    void recordLoginAttempt(data.username, ipAddress, false);
    return {
      success: false,
      formErrors: ['Invalid username or recovery code'],
    };
  }

  await recordLoginAttempt(data.username, ipAddress, true);
  await createSessionCookie(user.id);

  void addEvent(
    'Recovery Code Login',
    `User ${user.username} logged in with a recovery code`,
  );
  safeUpdateTag('activityFeed');

  return { success: true };
}
```

Add `hashRecoveryCode` to the imports at the top of `actions/auth.ts`:

```typescript
import { createTwoFactorToken, hashRecoveryCode } from '~/lib/totp';
```

**Step 3: Run tests**

Run: `pnpm vitest run actions/__tests__/auth.test.ts`
Expected: All tests PASS

**Step 4: Format, lint, commit**

```bash
pnpm prettier --write actions/auth.ts actions/__tests__/auth.test.ts
pnpm lint --fix
git add actions/auth.ts actions/__tests__/auth.test.ts
git commit -m "feat: add standalone recovery code login action"
```

---

## Milestone 4: Sign-In Page UI

### Task 11: Add passkey sign-in button to SignInForm

**Files:**

- Modify: `app/(blobs)/(setup)/_components/SignInForm.tsx`

**Step 1: Add the passkey sign-in flow**

The sign-in form needs:

1. A "Sign in with a passkey" button below the form, separated by a divider
2. Feature detection: only show if `window.PublicKeyCredential` exists
3. On click: call `generateAuthenticationOptions()` → `startAuthentication()` from `@simplewebauthn/browser` → `verifyAuthentication()`
4. Error handling and loading states
5. A "Trouble signing in?" link that shows recovery code fields

**IMPORTANT — Safari user gesture handling (see "Browser Quirks" section above):**

- The button must use a native `onClick` handler (not a synthetic wrapper)
- The entire async chain (server action → `startAuthentication` → verify) must run in a single `async` function with no unrelated `await`s between steps
- Do NOT implement conditional mediation (autofill passkeys) in this initial implementation — it conflicts with the explicit button flow on older Safari

Modify `SignInForm.tsx`:

- Add state for `webauthnSupported` (checked in `useEffect`)
- Add state for `showRecovery` to toggle recovery code form
- Add the passkey button after the form's `DialogFooter`
- Import `startAuthentication` from `@simplewebauthn/browser`
- Import `generateAuthenticationOptions`, `verifyAuthentication` from `~/actions/webauthn`
- Import `recoveryCodeLogin` from `~/actions/auth`

The passkey button handler — note the single unbroken async chain from click → server action → WebAuthn → verify:

```typescript
const handlePasskeySignIn = async () => {
  setPasskeyError(null);
  setPasskeyLoading(true);

  try {
    // Step 1: Get challenge from server (uses native fetch via server action)
    const { error, data } = await generateAuthenticationOptions();
    if (error || !data) {
      setPasskeyError(error ?? 'Failed to start passkey authentication');
      return;
    }

    // Step 2: IMMEDIATELY call startAuthentication — no async work between
    // steps 1 and 2. This preserves the Safari user gesture context.
    const credential = await startAuthentication({ optionsJSON: data.options });

    // Step 3: Verify with server
    const result = await verifyAuthentication({ credential });
    if (result.error) {
      setPasskeyError(result.error);
      return;
    }

    router.push('/dashboard');
  } catch (e) {
    if (e instanceof Error && e.name === 'NotAllowedError') {
      // User cancelled the WebAuthn dialog — not an error
      return;
    }
    setPasskeyError('Passkey authentication failed');
  } finally {
    setPasskeyLoading(false);
  }
};
```

The recovery code form:

```typescript
const handleRecoveryLogin = async (data: unknown) => {
  const { username, recoveryCode } = data as {
    username: string;
    recoveryCode: string;
  };

  const result = await recoveryCodeLogin({ username, recoveryCode });

  if (result.success) {
    router.push('/dashboard');
  }

  return result;
};
```

Layout: Password form → divider with "or" → Passkey button → "Trouble signing in?" link → (conditionally) Recovery code form

**Step 2: Verify in the browser**

- Start dev server: user should already have it running
- Navigate to `/signin`
- Verify the passkey button renders (on a browser with WebAuthn support)
- Verify it doesn't render if WebAuthn is unavailable (test by overriding `window.PublicKeyCredential`)

**Step 3: Run formatter and linter**

Run: `pnpm prettier --write app/\(blobs\)/\(setup\)/_components/SignInForm.tsx`
Run: `pnpm lint --fix`

**Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/\(blobs\)/\(setup\)/_components/SignInForm.tsx
git commit -m "feat: add passkey sign-in button and recovery code login to SignInForm"
```

---

## Milestone 5: Settings Page — Passkey Management

### Task 12: Create PasskeySettings component

**Files:**

- Create: `app/dashboard/settings/_components/PasskeySettings.tsx`

**Step 1: Implement the component**

This component follows the same pattern as `TwoFactorSettings`:

Props:

```typescript
type PasskeySettingsProps = {
  initialPasskeys: Array<{
    id: string;
    friendlyName: string | null;
    deviceType: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    backedUp: boolean;
  }>;
  sandboxMode: boolean;
};
```

Behavior:

- **No passkeys**: `SettingsField` with description + "Add passkey" button (disabled if sandboxMode)
- **Has passkeys**: `SettingsField` with list of passkeys + "Add passkey" button + "Remove" per passkey
- **Add passkey flow**: Collect friendly name first (before the async chain), then `generateRegistrationOptions()` → `startRegistration()` from `@simplewebauthn/browser` → `verifyRegistration()` in a single unbroken async chain
- **Remove passkey**: Confirmation dialog → `removePasskey(id)` → update local state

**IMPORTANT — Safari user gesture handling (see "Browser Quirks" section):**
The "Add passkey" button handler must follow the same pattern as the sign-in flow: single unbroken async chain from click → server action → `startRegistration()` → verify. Collect the friendly name **before** starting the async chain (e.g. from an input field that's already visible, or use a two-step flow: step 1 = enter name + click "Register", step 2 = the click handler runs the async chain). Do NOT open a dialog, wait for user input, then start registration — that breaks the gesture chain on Safari < 17.4.

Show each passkey as a row with:

- Friendly name (or "Unnamed passkey")
- Device type badge ("Synced" for multiDevice, "Device-bound" for singleDevice)
- Created date (formatted)
- Last used date (formatted, or "Never")
- Remove button

**Step 2: Verify in browser**

Navigate to Settings > User Management. The component should appear in the "Current User" section.

**Step 3: Format, lint, typecheck**

Run: `pnpm prettier --write app/dashboard/settings/_components/PasskeySettings.tsx && pnpm lint --fix && pnpm typecheck`

**Step 4: Commit**

```bash
git add app/dashboard/settings/_components/PasskeySettings.tsx
git commit -m "feat: add PasskeySettings component for managing passkeys"
```

---

### Task 13: Integrate PasskeySettings into UserManagement

**Files:**

- Modify: `app/dashboard/settings/_components/UserManagement.tsx`
- Modify: `app/dashboard/settings/page.tsx`

**Step 1: Add PasskeySettings to UserManagement**

In `UserManagement.tsx`, import and render `PasskeySettings` after `TwoFactorSettings` in the "Current User" `Surface`:

```typescript
import PasskeySettings from '~/app/dashboard/settings/_components/PasskeySettings';
```

Add `passkeys` and `sandboxMode` to the component's props:

```typescript
type UserManagementProps = {
  users: GetUsersReturnType;
  currentUserId: string;
  currentUsername: string;
  hasTwoFactor: boolean;
  userCount: number;
  passkeys: Array<{
    id: string;
    friendlyName: string | null;
    deviceType: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    backedUp: boolean;
  }>;
  sandboxMode: boolean;
};
```

Render it after `TwoFactorSettings`:

```tsx
<PasskeySettings initialPasskeys={passkeys} sandboxMode={sandboxMode} />
```

In `app/dashboard/settings/page.tsx`, fetch passkeys and pass them down:

```typescript
const passkeys = await prisma.webAuthnCredential.findMany({
  where: { user_id: session.user.userId },
  select: {
    id: true,
    friendlyName: true,
    deviceType: true,
    createdAt: true,
    lastUsedAt: true,
    backedUp: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

Pass `passkeys` and `sandboxMode: !!env.SANDBOX_MODE` to `UserManagement`.

**Step 2: Update the user table to show passkey status**

In `makeUserColumns()`, add a "Passkeys" column after the "2FA" column:

```typescript
{
  id: 'passkeys',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Passkeys" />
  ),
  cell: ({ row }) =>
    row.original.webAuthnCredentials.length > 0
      ? `${row.original.webAuthnCredentials.length}`
      : '\u2014',
},
```

**Step 3: Replace "Reset 2FA" with "Reset Auth" button**

In the actions column, replace the "Reset 2FA" button with "Reset Auth" that calls `resetAuthForUser`. Show the temporary password in a dialog after successful reset.

**Step 4: Typecheck, format, lint**

Run: `pnpm typecheck && pnpm prettier --write app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/page.tsx && pnpm lint --fix`

**Step 5: Commit**

```bash
git add app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/page.tsx
git commit -m "feat: integrate PasskeySettings and Reset Auth into settings page"
```

---

## Milestone 6: Settings — Auth Mode Switching

### Task 14: Add "Remove password" and "Set password" UI to UserManagement

**Files:**

- Modify: `app/dashboard/settings/_components/UserManagement.tsx`

**Step 1: Add "Remove password" option**

When user has passkeys AND a password, show a "Remove password" button/link near "Change Password". On click:

1. Dialog asks for current password
2. Calls `removePassword(currentPassword)` from `actions/webauthn.ts`
3. If recovery codes were generated, show them in a dialog (reuse `RecoveryCodes` component)
4. Update local state to reflect passwordless mode

**Step 2: Add "Set password" option**

When user has no password (passkey-only), replace "Change Password" button with "Set password". On click:

1. Dialog with new password + confirm password fields
2. Calls `setPassword(newPassword)` from `actions/webauthn.ts`
3. Update local state

**Step 3: Update the "Change Password" button visibility**

- Show "Change Password" when `hasPassword` is true
- Show "Set Password" when `hasPassword` is false and user has passkeys
- Show "Remove Password" when `hasPassword` is true and user has passkeys

This requires passing `hasPassword` prop from the settings page. In `page.tsx`, check:

```typescript
const hasPassword = !!key?.hashed_password;
```

Where `key` is fetched for the current user.

**Step 4: Typecheck, format, lint, commit**

```bash
pnpm typecheck && pnpm prettier --write app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/page.tsx && pnpm lint --fix
git add app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/page.tsx
git commit -m "feat: add password remove/set options for auth mode switching"
```

---

## Milestone 7: Sandbox Mode Restrictions

### Task 15: Disable auth changes in sandbox mode

**Files:**

- Modify: `app/dashboard/settings/_components/TwoFactorSettings.tsx`
- Modify: `app/dashboard/settings/_components/UserManagement.tsx`
- Modify: `app/dashboard/settings/_components/PasskeySettings.tsx`

**Step 1: TwoFactorSettings — disable in sandbox**

Add `sandboxMode` prop. When true, disable the "Enable" button with a tooltip or description text "Not available in sandbox mode."

**Step 2: UserManagement — disable password change in sandbox**

When `sandboxMode` is true, hide/disable the "Change Password" button.

**Step 3: PasskeySettings — already handled**

Task 12 already includes `sandboxMode` prop that disables the "Add passkey" button.

**Step 4: Pass `sandboxMode` through from settings page**

The settings page already has access to `env.SANDBOX_MODE`. Pass `!!env.SANDBOX_MODE` to `UserManagement` (which passes it down to `TwoFactorSettings` and `PasskeySettings`).

**Step 5: Typecheck, format, lint, commit**

```bash
pnpm typecheck && pnpm prettier --write app/dashboard/settings/_components/TwoFactorSettings.tsx app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/_components/PasskeySettings.tsx && pnpm lint --fix
git add app/dashboard/settings/_components/TwoFactorSettings.tsx app/dashboard/settings/_components/UserManagement.tsx app/dashboard/settings/_components/PasskeySettings.tsx app/dashboard/settings/page.tsx
git commit -m "feat: disable auth changes in sandbox mode"
```

---

## Milestone 8: Onboarding Setup Changes

### Task 16: Add auth method choice to signup onboarding

**Files:**

- Modify: `app/(blobs)/(setup)/_components/SignUpForm.tsx`
- Modify: `app/(blobs)/(setup)/_components/OnboardSteps/CreateAccount.tsx`
- Modify: `actions/auth.ts`

**Step 1: Modify the CreateAccount step**

Update the copy to explain the auth method choice. Add a note recommending passkey or password+TOTP over password-only.

**Step 2: Modify SignUpForm to support auth method choice**

The form flow becomes:

1. Username field (always shown)
2. Auth method toggle/choice (two buttons or radio: "Set a password" / "Use a passkey")
3. If "Set a password": show existing password + confirm password fields
4. If "Use a passkey": trigger WebAuthn registration → show recovery codes

State management:

- `authMethod: 'password' | 'passkey'` state
- When `authMethod === 'passkey'`:
  - User enters username, selects "Use a passkey", then clicks a "Create account" button
  - The button's click handler runs the full async chain: `signupWithPasskey` (creates user + returns challenge) → `startRegistration()` → `verifySignupPasskey` (stores credential + returns recovery codes)
  - Show recovery codes before proceeding to step 2

**IMPORTANT — Safari user gesture handling (see "Browser Quirks" section):**
The passkey signup flow must happen in a single async chain from the "Create account" button click. The `signupWithPasskey` server action should create the user AND return WebAuthn registration options in one call, so that `startRegistration()` can be called immediately after without breaking the gesture chain. Do NOT split this into separate "create user" then "register passkey" steps with user interaction in between.

**Step 3: Create `signupWithPasskey` server action in `actions/auth.ts`**

```typescript
export async function signupWithPasskey(data: {
  username: string;
  credential: unknown;
  friendlyName?: string;
}) {
  // Validate username
  // Create user with null hashed_password
  // Store WebAuthn credential
  // Generate recovery codes
  // Create session
  // Return recovery codes
}
```

This action combines user creation + passkey registration in one transaction.

**Step 4: Handle sandbox mode**

When `env.SANDBOX_MODE` is true, don't show the auth method choice. Force password-only.

This requires making the `SignUpForm` aware of sandbox mode. Since it's a client component, pass `sandboxMode` as a prop from `CreateAccount` (which can read `env.SANDBOX_MODE` since it's a server component — but actually `CreateAccount` is currently a regular function component, not async). Check if `env` can be accessed there or if it needs to be passed down from `Setup`.

**Step 5: Handle browser without WebAuthn**

If `window.PublicKeyCredential` is not available, don't show the passkey option (only show password). Use the same feature detection as the sign-in form.

**Step 6: Typecheck, format, lint, commit**

```bash
pnpm typecheck && pnpm prettier --write app/\(blobs\)/\(setup\)/_components/SignUpForm.tsx app/\(blobs\)/\(setup\)/_components/OnboardSteps/CreateAccount.tsx actions/auth.ts && pnpm lint --fix
git add app/\(blobs\)/\(setup\)/_components/SignUpForm.tsx app/\(blobs\)/\(setup\)/_components/OnboardSteps/CreateAccount.tsx actions/auth.ts
git commit -m "feat: add auth method choice (password or passkey) to onboarding signup"
```

---

## Milestone 9: Storybook Stories

### Task 17: Add Storybook stories for new components

**Files:**

- Create: `app/dashboard/settings/_components/PasskeySettings.stories.tsx`

Check if `SignInForm` already has stories. If so, add new story variants. If not, create them.

**Step 1: PasskeySettings stories**

Variants:

- No passkeys registered
- One passkey registered
- Multiple passkeys (mix of synced and device-bound)
- Sandbox mode (buttons disabled)

**Step 2: SignInForm stories** (if applicable)

Variants:

- Default (WebAuthn available)
- WebAuthn unavailable (no passkey button)
- Recovery code form visible

**Step 3: Run Storybook to verify**

Run: `pnpm storybook` (user should have it running)
Navigate to the new stories and verify they render correctly.

**Step 4: Format, lint, commit**

```bash
pnpm prettier --write app/dashboard/settings/_components/PasskeySettings.stories.tsx
pnpm lint --fix
git add app/dashboard/settings/_components/PasskeySettings.stories.tsx
git commit -m "feat: add Storybook stories for PasskeySettings"
```

---

## Milestone 10: E2E Test Infrastructure

Playwright supports WebAuthn via the Chrome DevTools Protocol (CDP). We create a virtual authenticator in the browser context so passkey registration and authentication work in headless Chrome without real hardware.

### Task 18: Create WebAuthn e2e test helper

**Files:**

- Create: `tests/e2e/helpers/webauthn.ts`

**Step 1: Implement the virtual authenticator helper**

This helper creates and manages a virtual WebAuthn authenticator via CDP. It follows the pattern of the existing `helpers/totp.ts`.

```typescript
import { type BrowserContext, type CDPSession } from '@playwright/test';

type VirtualAuthenticator = {
  authenticatorId: string;
  cdpSession: CDPSession;
  remove: () => Promise<void>;
};

/**
 * Creates a virtual WebAuthn authenticator attached to the browser context.
 * This enables passkey registration and authentication in headless Chrome
 * without real hardware.
 *
 * Call this BEFORE navigating to pages that use WebAuthn.
 *
 * Usage:
 *   const authenticator = await createVirtualAuthenticator(page.context());
 *   // ... do WebAuthn operations ...
 *   await authenticator.remove();
 */
export async function createVirtualAuthenticator(
  context: BrowserContext,
): Promise<VirtualAuthenticator> {
  const cdpSession = await context.newCDPSession(context.pages()[0]!);

  await cdpSession.send('WebAuthn.enable');

  const { authenticatorId } = await cdpSession.send(
    'WebAuthn.addVirtualAuthenticator',
    {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    },
  );

  return {
    authenticatorId,
    cdpSession,
    remove: async () => {
      await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
        authenticatorId,
      });
      await cdpSession.send('WebAuthn.disable');
      await cdpSession.detach();
    },
  };
}

/**
 * Gets the number of credentials registered on the virtual authenticator.
 * Useful for asserting that registration succeeded.
 */
export async function getCredentialCount(
  authenticator: VirtualAuthenticator,
): Promise<number> {
  const { credentials } = await authenticator.cdpSession.send(
    'WebAuthn.getCredentials',
    { authenticatorId: authenticator.authenticatorId },
  );
  return credentials.length;
}
```

Key details:

- `protocol: 'ctap2'` — Modern FIDO2 protocol (required for discoverable credentials/passkeys)
- `hasResidentKey: true` — Supports discoverable credentials (the authenticator stores the credential)
- `hasUserVerification: true` + `isUserVerified: true` — Simulates biometric/PIN verification automatically
- `automaticPresenceSimulation: true` — No manual "touch" needed, tests run unattended
- `transport: 'internal'` — Simulates a platform authenticator (Touch ID, Windows Hello)

**Step 2: Verify the helper compiles**

Run: `pnpm tsc --noEmit --project tests/e2e/tsconfig.json` (or however the e2e tests are typechecked)
If there's no separate tsconfig for e2e tests, verify with `pnpm typecheck` that the file has no errors.

**Step 3: Format and commit**

```bash
pnpm prettier --write tests/e2e/helpers/webauthn.ts
git add tests/e2e/helpers/webauthn.ts
git commit -m "feat(e2e): add virtual WebAuthn authenticator helper"
```

---

### Task 19: Add passkey database fixture methods

The `DatabaseIsolation` class needs methods to seed and clear passkeys for test users, following the same pattern as the existing `seedTotpForUser` / `clearTotpForUser` methods.

**Files:**

- Modify: `tests/e2e/fixtures/db-fixture.ts`

**Step 1: Add `seedPasskeyForUser` method**

Add to the `DatabaseIsolation` class after `clearTotpForUser`:

```typescript
async seedPasskeyForUser(
  username: string,
  credentialId: string,
  publicKey: string,
  options?: {
    friendlyName?: string;
    counter?: number;
    deviceType?: string;
    backedUp?: boolean;
  },
): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  await this.prisma.webAuthnCredential.create({
    data: {
      user_id: user.id,
      credentialId,
      publicKey,
      counter: BigInt(options?.counter ?? 0),
      transports: 'internal',
      deviceType: options?.deviceType ?? 'multiDevice',
      backedUp: options?.backedUp ?? true,
      friendlyName: options?.friendlyName ?? 'Test Passkey',
    },
  });

  log('test', `Seeded passkey for user "${username}"`);
}

async clearPasskeysForUser(username: string): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  await this.prisma.webAuthnCredential.deleteMany({
    where: { user_id: user.id },
  });

  log('test', `Cleared passkeys for user "${username}"`);
}

async removePasswordForUser(username: string): Promise<void> {
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  await this.prisma.key.updateMany({
    where: { user_id: user.id },
    data: { hashed_password: null },
  });

  log('test', `Removed password for user "${username}"`);
}

async getUserPasskeyCount(username: string): Promise<number> {
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User "${username}" not found`);
  }

  return this.prisma.webAuthnCredential.count({
    where: { user_id: user.id },
  });
}
```

Note: The `seedPasskeyForUser` method inserts a credential row directly in the database. This is useful for testing passkey login flows where the virtual authenticator already "knows" a credential. However, for end-to-end registration tests, the credential is created via the actual WebAuthn flow and the database gets populated by the server action — no seeding needed.

**Important:** The `WebAuthnCredential` table is NOT excluded from database snapshots (unlike User/Session/Key). This means passkeys seeded during mutation tests are automatically cleaned up by snapshot restores. No special cleanup is needed.

**Step 2: Format and commit**

```bash
pnpm prettier --write tests/e2e/fixtures/db-fixture.ts
git add tests/e2e/fixtures/db-fixture.ts
git commit -m "feat(e2e): add passkey database fixture methods"
```

---

## Milestone 11: E2E Tests — Existing Test Updates

These tasks modify existing test files that are affected by the passkey changes.

### Task 20: Update sign-in page tests (`specs/auth/login.spec.ts`)

The sign-in page now has a passkey button and "Trouble signing in?" link. The visual snapshot will change, and we need to verify the new elements are present.

**Files:**

- Modify: `tests/e2e/specs/auth/login.spec.ts`

**Step 1: Update visual snapshot test**

The existing `'visual: sign in page'` test captures the sign-in page at all viewports. The snapshot will now include the passkey button and divider. No code change needed in the test itself — just expect the visual snapshots to update.

Run the test once to regenerate baselines: `pnpm test:e2e --update-snapshots --grep "visual: sign in page"`

**Step 2: Add read-only test for passkey button**

Add a test that verifies the passkey sign-in button is visible:

```typescript
test('passkey sign-in button visible', async ({ page }) => {
  await page.goto('/signin');
  await expect(
    page.getByRole('button', { name: /sign in with a passkey/i }),
  ).toBeVisible();
});
```

**Step 3: Add read-only test for "Trouble signing in?" link**

```typescript
test('trouble signing in link visible', async ({ page }) => {
  await page.goto('/signin');
  await expect(
    page.getByRole('button', { name: /trouble signing in/i }),
  ).toBeVisible();
});
```

**Step 4: No changes to the existing auth state saving test**

The `'authenticate as admin and save state'` test uses username + password login, which is unchanged. The test should continue to work as-is. The passkey button is additive and doesn't affect the password flow.

**Step 5: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/auth/login.spec.ts
git add tests/e2e/specs/auth/login.spec.ts
git commit -m "test(e2e): update sign-in tests for passkey button"
```

---

### Task 21: Update onboarding tests (`specs/setup/onboarding.spec.ts`)

Step 1 of the setup wizard now has an auth method choice. The existing test creates an account with a password. We keep that test (choosing the password path) and add a new test for the passkey path.

**Files:**

- Modify: `tests/e2e/specs/setup/onboarding.spec.ts`

**Step 1: Update the visual snapshot for step 1**

The `'visual: step 1 - create account'` test will now show the auth method choice UI. Regenerate the snapshot baseline.

**Step 2: Update the existing onboarding wizard test**

The existing `'completes the onboarding wizard'` test fills username + password + confirmPassword and clicks "Create account". If the auth method choice defaults to password (or if the password fields are shown initially), this test may work as-is. If the user must explicitly choose "Set a password" first, add that click:

```typescript
// Step 1: Create Account
await expect(
  page.getByRole('heading', { name: 'Create an Admin Account', level: 2 }),
).toBeVisible();
await fillField(page, 'username', 'testadmin');

// Choose password auth method (if not default)
await page.getByRole('button', { name: /set a password/i }).click();

await fillField(page, 'password', 'TestAdmin123!');
await fillField(page, 'confirmPassword', 'TestAdmin123!');
await page.getByRole('button', { name: 'Create account' }).click();
```

Verify the rest of the wizard (steps 2-5) still works unchanged.

**Step 3: Add passkey onboarding test**

Add a new serial test that exercises the passkey path. This test creates a virtual authenticator, chooses "Use a passkey", registers the passkey, views recovery codes, then continues the wizard:

```typescript
test('completes onboarding with passkey', async ({ page }) => {
  const authenticator = await createVirtualAuthenticator(page.context());
  try {
    await page.goto('/setup');

    // Step 1: Create Account with passkey
    await expect(
      page.getByRole('heading', { name: 'Create an Admin Account', level: 2 }),
    ).toBeVisible();
    await fillField(page, 'username', 'testadmin');

    // Choose passkey auth method
    await page.getByRole('button', { name: /use a passkey/i }).click();

    // Click the create/register button — this triggers WebAuthn registration
    // The virtual authenticator handles the prompt automatically
    await page.getByRole('button', { name: /create account/i }).click();

    // Recovery codes should be displayed
    await expect(page.getByTestId('recovery-codes-list')).toBeVisible({
      timeout: 15_000,
    });

    // Acknowledge recovery codes
    await page
      .getByRole('button', { name: /saved my recovery codes|continue/i })
      .click();

    // Step 2: Connect UploadThing — verify we advanced
    await expect(
      page.getByRole('heading', { name: 'Connect UploadThing', level: 2 }),
    ).toBeVisible();

    // Continue through remaining steps (same as password path)...
  } finally {
    await authenticator.remove();
  }
});
```

**Important considerations:**

- This test runs in the `setup` project which uses an unconfigured app with a separate database. Auth tables (User/Session/Key) are NOT in the snapshot, so the user created here persists. The test must clean up or be idempotent.
- Since onboarding tests run serially and the setup environment starts fresh, this should work. But if both password and passkey onboarding tests run, the second will fail because a user already exists. Solution: either run them as separate test files with separate snapshot restores, or use `database.deleteUser('testadmin')` before each.
- The virtual authenticator must be created BEFORE any page navigation that triggers WebAuthn feature detection.

**Step 4: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/setup/onboarding.spec.ts
git add tests/e2e/specs/setup/onboarding.spec.ts
git commit -m "test(e2e): update onboarding tests for passkey auth method choice"
```

---

### Task 22: Update two-factor tests (`specs/dashboard/two-factor.spec.ts`)

The "Reset 2FA" button is being replaced by "Reset Auth". The existing test `"admin resets another user's 2FA"` and its visual snapshot test need updating.

**Files:**

- Modify: `tests/e2e/specs/dashboard/two-factor.spec.ts`

**Step 1: Update the admin reset test**

Change the test to use the new "Reset Auth" button and dialog:

```typescript
test("admin resets another user's authentication", async ({
  page,
  database,
}) => {
  const cleanup = await database.isolate(page);
  try {
    // Seed TOTP for testuser
    await database.seedTotpForUser('testuser', TOTP_SECRET, RECOVERY_CODES);

    await page.goto('/dashboard/settings');

    const userRow = page.getByTestId('user-row-testuser');
    await expect(userRow).toBeVisible();

    // Click "Reset Auth" button (replaces "Reset 2FA")
    const resetButton = page.getByTestId('reset-auth-testuser');
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Confirmation dialog
    const dialog = await waitForDialog(page);
    await expect(
      dialog.getByRole('heading', { name: /reset authentication/i }),
    ).toBeVisible();

    // Confirm the reset
    await dialog.getByRole('button', { name: /reset/i }).click();

    // Temporary password dialog should appear
    // (The server generates a temporary password and shows it to the admin)
    await expect(
      dialog.getByRole('heading', { name: /temporary password/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Close the dialog
    await dialog.getByRole('button', { name: /done|close/i }).click();
    await dialog.waitFor({ state: 'hidden' });

    // Reset auth button should no longer be visible
    await expect(resetButton).not.toBeVisible();
  } finally {
    await cleanup();
  }
});
```

**Step 2: Update the `data-testid` reference**

The test currently uses `data-testid="reset-2fa-testuser"`. After the implementation changes (Task 13), this becomes `data-testid="reset-auth-testuser"`. Update accordingly.

**Step 3: Update the visual snapshot test**

Rename `'visual: admin reset 2FA confirmation dialog'` to reflect the new dialog. Update the test to click `reset-auth-testuser` instead of `reset-2fa-testuser`. Regenerate the snapshot baseline.

**Step 4: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/dashboard/two-factor.spec.ts
git add tests/e2e/specs/dashboard/two-factor.spec.ts
git commit -m "test(e2e): update 2FA tests for Reset Auth button change"
```

---

### Task 23: Update settings tests (`specs/dashboard/settings.spec.ts`)

The settings page now shows a "Passkeys" column in the user table and a PasskeySettings component in the Current User section. The settings visual snapshot will change.

**Files:**

- Modify: `tests/e2e/specs/dashboard/settings.spec.ts`

**Step 1: Add read-only test for passkey settings field**

In the `'Read-only'` describe block, add:

```typescript
test('passkey settings field visible', async ({ page }) => {
  await expect(page.getByTestId('passkey-field')).toBeVisible();
});
```

**Step 2: Update the visual snapshot**

The `'visual snapshot'` test will now include the PasskeySettings component. Regenerate the baseline.

**Step 3: Update change password button test**

If the password management UI changes (e.g., button text differs when passkeys are present), update the `'change password button visible'` test accordingly. Since no passkeys are registered for the test user by default, the button should still say "Change Password".

**Step 4: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/dashboard/settings.spec.ts
git add tests/e2e/specs/dashboard/settings.spec.ts
git commit -m "test(e2e): update settings tests for passkey UI changes"
```

---

## Milestone 12: E2E Tests — New Passkey Test Suite

### Task 24: Create passkey e2e test suite (`specs/dashboard/passkeys.spec.ts`)

This is the main passkey test suite covering registration, login, management, and recovery.

**Files:**

- Create: `tests/e2e/specs/dashboard/passkeys.spec.ts`

**Step 1: Create the test file with structure**

```typescript
import { expect, expectURL, test } from '../../fixtures/test.js';
import { fillField } from '../../helpers/form.js';
import { waitForDialog } from '../../helpers/dialog.js';
import {
  createVirtualAuthenticator,
  getCredentialCount,
} from '../../helpers/webauthn.js';

test.describe('Passkey Authentication', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    // Mock GitHub API (same as settings/two-factor specs)
    await page.route(
      'https://api.github.com/repos/complexdatacollective/fresco/releases/latest',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            html_url:
              'https://github.com/complexdatacollective/fresco/releases/tag/v3.0.0',
            tag_name: 'v3.0.0',
            body: 'Mocked release notes.',
          }),
        }),
    );
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    // --- Registration ---

    test('register a passkey from settings', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          await page.goto('/dashboard/settings');

          // Click "Add passkey" in the passkey settings field
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();

          // The virtual authenticator handles the WebAuthn prompt
          // Wait for the passkey to appear in the list
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Verify the passkey was stored
          const count = await database.getUserPasskeyCount('testadmin');
          expect(count).toBe(1);
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    // --- Login ---

    test('sign in with passkey (discoverable flow)', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          // First register a passkey while logged in
          await page.goto('/dashboard/settings');
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Now clear auth and try signing in with passkey
          await page.context().clearCookies();
          await page.goto('/signin');

          await expect(
            page.getByRole('heading', { name: /sign in/i }),
          ).toBeVisible();

          // Click "Sign in with a passkey"
          await page
            .getByRole('button', { name: /sign in with a passkey/i })
            .click();

          // The virtual authenticator handles the WebAuthn prompt
          // Should redirect to dashboard
          await expectURL(page, /\/dashboard/, { timeout: 15_000 });

          // Restore auth state for subsequent tests
          await page
            .context()
            .storageState({ path: './tests/e2e/.auth/admin.json' });
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    test('passkey login bypasses TOTP', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          // Seed TOTP for testadmin
          await database.seedTotpForUser('testadmin', 'JBSWY3DPEHPK3PXP', [
            'aaaabbbbccccddddeeee',
          ]);

          // Register a passkey while logged in
          await page.goto('/dashboard/settings');
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Clear auth and sign in with passkey
          await page.context().clearCookies();
          await page.goto('/signin');

          await page
            .getByRole('button', { name: /sign in with a passkey/i })
            .click();

          // Should go directly to dashboard — NO TOTP prompt
          await expectURL(page, /\/dashboard/, { timeout: 15_000 });

          // Restore auth state
          await page
            .context()
            .storageState({ path: './tests/e2e/.auth/admin.json' });
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    // --- Removal ---

    test('remove a passkey from settings', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          // Register a passkey first
          await page.goto('/dashboard/settings');
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Remove the passkey
          await passkeyField.getByRole('button', { name: /remove/i }).click();

          // Confirmation dialog
          const dialog = await waitForDialog(page);
          await dialog.getByRole('button', { name: /remove|confirm/i }).click();
          await dialog.waitFor({ state: 'hidden' });

          // Passkey item should be gone
          await expect(
            passkeyField.getByTestId('passkey-item'),
          ).not.toBeVisible();

          const count = await database.getUserPasskeyCount('testadmin');
          expect(count).toBe(0);
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    // --- Recovery Code Login (standalone) ---

    test('login with recovery code (passkey-only user)', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        // Seed a passkey and recovery codes for testadmin, remove password
        await database.seedPasskeyForUser(
          'testadmin',
          'test-credential-id',
          'test-public-key-base64url',
          { friendlyName: 'Test Passkey' },
        );
        await database.removePasswordForUser('testadmin');

        // Seed recovery codes
        const recoveryCodes = ['aaaabbbbccccddddeeee'];
        await database.seedTotpForUser('testadmin', 'UNUSED', recoveryCodes);
        // Note: seedTotpForUser creates recovery codes. For passkey-only users
        // we may need a dedicated seedRecoveryCodes method, or we can reuse
        // the TOTP seeder since recovery codes are stored the same way.
        // Adjust if the recovery code seeding needs to work without TOTP.

        await page.context().clearCookies();
        await page.goto('/signin');

        // Click "Trouble signing in?"
        await page.getByRole('button', { name: /trouble signing in/i }).click();

        // Fill username and recovery code
        await fillField(page, 'username', 'testadmin');
        await fillField(page, 'recoveryCode', recoveryCodes[0]!);

        // Submit
        await page.getByRole('button', { name: /sign in|verify/i }).click();

        // Should redirect to dashboard
        await expectURL(page, /\/dashboard/, { timeout: 15_000 });

        // Restore auth state
        await page
          .context()
          .storageState({ path: './tests/e2e/.auth/admin.json' });
      } finally {
        await cleanup();
      }
    });

    // --- Admin Reset Auth ---

    test("admin resets another user's passkeys", async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // Seed a passkey for testuser
        await database.seedPasskeyForUser(
          'testuser',
          'testuser-credential-id',
          'testuser-public-key',
          { friendlyName: 'Test User Passkey' },
        );

        await page.goto('/dashboard/settings');

        const userRow = page.getByTestId('user-row-testuser');
        await expect(userRow).toBeVisible();

        // Click "Reset Auth"
        const resetButton = page.getByTestId('reset-auth-testuser');
        await expect(resetButton).toBeVisible();
        await resetButton.click();

        // Confirm
        const dialog = await waitForDialog(page);
        await dialog.getByRole('button', { name: /reset/i }).click();

        // Temporary password should be shown
        await expect(
          dialog.getByRole('heading', { name: /temporary password/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Close
        await dialog.getByRole('button', { name: /done|close/i }).click();
        await dialog.waitFor({ state: 'hidden' });

        // Verify passkeys were removed
        const count = await database.getUserPasskeyCount('testuser');
        expect(count).toBe(0);
      } finally {
        await cleanup();
      }
    });

    // --- Visual Snapshots ---

    test('visual: passkey settings — no passkeys', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
        const passkeyField = page.getByTestId('passkey-field');
        await expect(passkeyField).toBeVisible();
        await captureElement(passkeyField, 'passkey-settings-empty');
      } finally {
        await cleanup();
      }
    });

    test('visual: passkey settings — with passkeys', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedPasskeyForUser(
          'testadmin',
          'vis-credential-1',
          'vis-public-key-1',
          { friendlyName: 'MacBook Pro', deviceType: 'multiDevice' },
        );
        await database.seedPasskeyForUser(
          'testadmin',
          'vis-credential-2',
          'vis-public-key-2',
          { friendlyName: 'YubiKey', deviceType: 'singleDevice' },
        );

        await page.goto('/dashboard/settings');
        const passkeyField = page.getByTestId('passkey-field');
        await expect(passkeyField).toBeVisible();

        await captureElement(passkeyField, 'passkey-settings-with-passkeys', {
          // Mask dates since they vary
          mask: [passkeyField.locator('[data-testid*="passkey-date"]')],
        });
      } finally {
        await cleanup();
      }
    });

    test('visual: sign-in page with passkey button', async ({
      page,
      database,
      capturePage,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.context().clearCookies();
        await page.goto('/signin');
        await expect(
          page.getByRole('button', { name: /sign in with a passkey/i }),
        ).toBeVisible();

        await capturePage('signin-page-with-passkey');

        // Restore auth
        await page.goto('/dashboard');
        await page
          .context()
          .storageState({ path: './tests/e2e/.auth/admin.json' });
      } finally {
        await cleanup();
      }
    });
  });
});
```

**Step 2: Test ID requirements**

The tests above depend on these `data-testid` attributes being present in the implementation:

| testId                  | Component         | Element                                                 |
| ----------------------- | ----------------- | ------------------------------------------------------- |
| `passkey-field`         | `PasskeySettings` | Root `SettingsField`                                    |
| `passkey-item`          | `PasskeySettings` | Each passkey row in the list                            |
| `passkey-date-*`        | `PasskeySettings` | Date elements (for masking in visual snapshots)         |
| `reset-auth-{username}` | `UserManagement`  | Per-user reset button (replaces `reset-2fa-{username}`) |

Ensure these testIds are added during the implementation tasks (Tasks 12, 13).

**Step 3: Run the tests**

Run: `pnpm test:e2e --project dashboard --grep "Passkey"`
Expected: All tests pass

**Step 4: Format and commit**

```bash
pnpm prettier --write tests/e2e/specs/dashboard/passkeys.spec.ts
git add tests/e2e/specs/dashboard/passkeys.spec.ts
git commit -m "test(e2e): add passkey authentication e2e test suite"
```

---

### Task 25: Add `data-testid` attributes required by e2e tests

During the implementation tasks (Tasks 12-14), ensure the following `data-testid` attributes are added to the components. This task serves as a checklist — the actual code changes happen in the implementation tasks.

**Checklist:**

- [ ] `PasskeySettings` component (`app/dashboard/settings/_components/PasskeySettings.tsx`):
  - `data-testid="passkey-field"` on the root `SettingsField`
  - `data-testid="passkey-item"` on each passkey row
  - `data-testid="passkey-date-created"` and `data-testid="passkey-date-used"` on date elements (for visual snapshot masking)

- [ ] `UserManagement` user table actions column:
  - `data-testid="reset-auth-{username}"` on the "Reset Auth" button (replaces existing `data-testid="reset-2fa-{username}"`)

- [ ] `SignInForm` (`app/(blobs)/(setup)/_components/SignInForm.tsx`):
  - The passkey button should use `getByRole('button', { name: /sign in with a passkey/i })` — no testId needed, role is sufficient
  - The "Trouble signing in?" link/button — same, role is sufficient
  - Recovery code form fields: `data-field-name="username"` and `data-field-name="recoveryCode"` (for `fillField` helper)

No separate commit for this task — the testIds are added as part of the implementation tasks. This task exists to document the contract between the implementation and e2e tests.

---

## Milestone 13: Final Verification

### Task 26: Full typecheck, lint, and test run

**Step 1: Typecheck the entire project**

Run: `pnpm typecheck`
Expected: No errors

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run all unit tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Run knip to check for unused exports**

Run: `pnpm knip`
Expected: No new unused exports from the passkey implementation

**Step 5: Build the project**

Run: `pnpm build`
Expected: Successful build

**Step 6: Run e2e tests**

Run: `pnpm test:e2e`
Expected: All tests pass (setup, auth, and dashboard projects)

If visual snapshots have changed (expected — sign-in page, settings page, onboarding step 1), regenerate baselines:
Run: `pnpm test:e2e --update-snapshots`

**Step 7: Fix any issues found in steps 1-6, then commit**

```bash
git add -A
git commit -m "chore: fix any remaining issues from passkey implementation"
```

---

## Task Dependency Summary

```
Task 1 (deps) → Task 2 (schema) → Task 3 (query)
                                  ↓
Task 4 (webauthn lib) → Task 5 (schemas) → Task 6 (reg actions) → Task 7 (auth actions) → Task 8 (mgmt actions) → Task 9 (admin reset)
                                                                                            ↓
Task 10 (recovery login) ────────────────────────────────────────────────────────────────────┤
                                                                                            ↓
Task 11 (sign-in UI) ──────────────────────────────────────────────────────────────────────→ Task 16 (onboarding)
                                                                                            ↓
Task 12 (PasskeySettings) → Task 13 (integrate settings) → Task 14 (mode switching) → Task 15 (sandbox)
                                                                                            ↓
Task 17 (stories) ──────────────────────────────────────────────────────────────────────────┤
                                                                                            ↓
Task 18 (webauthn helper) → Task 19 (db fixtures) ─────────────────────────────────────────┤
                                                    ↓                                       ↓
Task 20 (update login tests) ───────────────────────┤                                      ↓
Task 21 (update onboarding tests) ──────────────────┤                                      ↓
Task 22 (update 2FA tests) ─────────────────────────┤                                      ↓
Task 23 (update settings tests) ────────────────────┤                                      ↓
                                                    ↓                                       ↓
Task 24 (new passkey e2e suite) ──→ Task 25 (testId checklist) ──→ Task 26 (final verify)
```

Task 25 (testId checklist) is not a code task — it's a verification that testIds from Tasks 12-14 match what Tasks 20-24 expect. Review during implementation.

## Notes for the Implementer

1. **@simplewebauthn types**: The exact type signatures for `generateRegistrationOptions`, `verifyRegistrationResponse`, etc. may differ between versions. Always consult the installed version's TypeScript types. Use `pnpm typecheck` frequently.

2. **`checkRateLimit` null username**: The existing `checkRateLimit(username, ipAddress)` in `lib/rateLimit.ts` may not support `null` username. Check its implementation — if it requires a string, you'll need to adjust it to support IP-only rate limiting for the discoverable passkey flow.

3. **`process.env` restriction**: The codebase forbids direct `process.env` usage. In `actions/webauthn.ts`, use `env` from `~/env` for the `secure` cookie flag instead of `process.env.NODE_ENV`.

4. **Path aliases**: Always use `~/` imports. Never use relative paths.

5. **Formatting**: Run `pnpm prettier --write <file>` after every file change. The project uses single quotes, 80-char width, and Tailwind class sorting.

6. **No type assertions**: Avoid `as` casts. If SimpleWebAuthn types don't align with your Zod schemas, fix the types rather than casting. There are a few `as` casts in the plan code above for brevity — replace them with proper type handling.

7. **Recovery codes for passkey-only users**: Recovery codes use the same system as TOTP recovery codes (same `RecoveryCode` table, same `hashRecoveryCode` function). A user can have recovery codes from either TOTP setup or passkey setup.

8. **Cache tags**: The `CacheTags` array in `lib/cache/index.ts` may not need new tags — `getUsers` and `activityFeed` should cover it. If you add passkey-specific cached queries, add their tags to the array.

9. **Safari user gesture chain (critical)**: Every client-side button that calls `startRegistration()` or `startAuthentication()` must follow this exact pattern: `onClick async handler → server action (native fetch) → startRegistration/startAuthentication → server action`. No `setTimeout`, no unrelated `await`s, no dialog interactions between the server action and the WebAuthn call. See the "Browser Quirks" section at the top of this plan for full details. If you need user input (like a friendly name), collect it **before** the button click that starts the async chain.

10. **No conditional mediation in v1**: Do not implement `navigator.credentials.get({ mediation: 'conditional' })` (autofill passkeys in the username field) in the initial implementation. On older Safari, a conditional `.get()` consumes the one-per-navigation WebAuthn allowance, which would break the explicit "Sign in with a passkey" button. Conditional mediation can be added as a follow-up after the core passkey flow is stable.

11. **`NotAllowedError` handling**: When a user cancels the browser's WebAuthn dialog (Touch ID, Windows Hello, etc.), `@simplewebauthn/browser` throws a `NotAllowedError`. This is not a real error — catch it and silently return without showing an error message. Other errors (like `SecurityError` for origin mismatch) should be surfaced to the user.

12. **E2E virtual authenticator lifecycle**: The virtual authenticator must be created via CDP BEFORE navigating to pages that check `window.PublicKeyCredential`. Create it early in the test, and always clean it up in a `finally` block. If the authenticator isn't present, the page will behave as if WebAuthn is unsupported.

13. **E2E database isolation for passkeys**: `WebAuthnCredential` rows ARE included in database snapshots (unlike User/Session/Key which are excluded). This means passkeys seeded during mutation tests are automatically cleaned up by snapshot restores. No special cleanup is needed.

14. **E2E test project scoping**: Passkey login and management tests go in `specs/dashboard/` (dashboard project, has auth state). Passkey onboarding tests go in `specs/setup/` (setup project, no auth state). The virtual authenticator helper works in both projects.

15. **E2E recovery code seeding**: The existing `seedTotpForUser` method seeds both a TOTP credential and recovery codes. For passkey-only users who need recovery codes but no TOTP, you may need a separate `seedRecoveryCodesForUser` method on `DatabaseIsolation`, or reuse `seedTotpForUser` and accept that a TOTP credential is also created (the passkey login flow bypasses it anyway).
