# AAGUID-Based Passkey Naming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace user-supplied passkey names with automatic names resolved from the AAGUID (Authenticator Attestation GUID) reported during WebAuthn registration.

**Architecture:** Vendor a static JSON lookup table mapping AAGUIDs to human-readable authenticator names (e.g., "iCloud Keychain", "Google Password Manager"). Store the AAGUID in the database and auto-populate `friendlyName` with the resolved name at registration time. Remove the name input from the UI.

**Tech Stack:** `@simplewebauthn/server` (already installed), community AAGUID registry from `passkeydeveloper/passkey-authenticator-aaguids`

---

### Task 1: Vendor the AAGUID lookup table and create helper

**Files:**
- Create: `lib/webauthn/aaguid-names.json`
- Create: `lib/webauthn/getAuthenticatorName.ts`

**Step 1: Download and vendor the AAGUID registry**

Fetch the JSON from `https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/aaguid.json`. Extract only the `name` field from each entry (discard `icon_dark`/`icon_light`) to keep the file small. Save as a flat `Record<string, string>` mapping AAGUID to name:

```json
{
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "iCloud Keychain",
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  ...
}
```

Save to `lib/webauthn/aaguid-names.json`.

**Step 2: Create the lookup helper**

Create `lib/webauthn/getAuthenticatorName.ts`:

```typescript
import aaguidNames from '~/lib/webauthn/aaguid-names.json';

const registry = aaguidNames as Record<string, string>;

export function getAuthenticatorName(
  aaguid: string,
  deviceType: string,
): string {
  const name = registry[aaguid];
  if (name) return name;
  return deviceType === 'multiDevice' ? 'Synced passkey' : 'Security key';
}
```

**Step 3: Commit**

```
feat: add AAGUID-to-name lookup for passkey authenticators
```

---

### Task 2: Add `aaguid` column to database schema and migration

**Files:**
- Modify: `lib/db/schema.prisma:43-59` (WebAuthnCredential model)
- Modify: `lib/db/migrations/20260302203729_add_webauthn_credential/migration.sql`

**Step 1: Add `aaguid` to Prisma schema**

In `lib/db/schema.prisma`, add `aaguid String?` to the `WebAuthnCredential` model, after `backedUp`:

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
  aaguid       String?
  friendlyName String?
  createdAt    DateTime  @default(now())
  lastUsedAt   DateTime?

  user User @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}
```

**Step 2: Add `aaguid` to existing migration SQL**

In `lib/db/migrations/20260302203729_add_webauthn_credential/migration.sql`, add `"aaguid" TEXT,` after the `"backedUp"` line:

```sql
CREATE TABLE "WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "aaguid" TEXT,
    "friendlyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);
```

**Step 3: Regenerate Prisma client**

Run: `pnpm prisma generate`

**Step 4: Commit**

```
feat: add aaguid column to WebAuthnCredential schema
```

---

### Task 3: Update server actions to use AAGUID-based naming

**Files:**
- Modify: `actions/webauthn.ts`

**Step 1: Update `generateRegistrationOptions`**

Remove the `friendlyName` parameter and the `friendlyName` field from the return value:

```typescript
export async function generateRegistrationOptions() {
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
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credentialId,
      transports: splitTransports(c.transports),
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await setChallengeCookie(options.challenge);

  return {
    error: null,
    data: { options },
  };
}
```

**Step 2: Update `verifyRegistration`**

Remove `friendlyName` from the input type. Extract `aaguid` from `registrationInfo`. Import and use `getAuthenticatorName` to resolve the name:

Add import at top of file:

```typescript
import { getAuthenticatorName } from '~/lib/webauthn/getAuthenticatorName';
```

Update the function:

```typescript
export async function verifyRegistration(data: {
  credential: RegistrationResponseJSON;
}) {
  // ... (challenge verification unchanged through line 122)

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;

  const friendlyName = getAuthenticatorName(aaguid, credentialDeviceType);

  const newCredential = await prisma.webAuthnCredential.create({
    data: {
      user_id: session.user.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: BigInt(credential.counter),
      transports: credential.transports?.join(',') ?? null,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      aaguid,
      friendlyName,
    },
  });

  void addEvent(
    'Passkey Registered',
    `User ${session.user.username} registered a passkey (${friendlyName})`,
  );
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

**Step 3: Commit**

```
feat: resolve passkey names from AAGUID during registration
```

---

### Task 4: Remove name input from PasskeySettings component

**Files:**
- Modify: `app/dashboard/settings/_components/PasskeySettings.tsx`

**Step 1: Remove the name input and related state**

Remove the `friendlyName` state (`const [friendlyName, setFriendlyName] = useState('');`).

In `handleAddPasskey`:
- Remove `const name = friendlyName.trim() || undefined;` line
- Change `generateRegistrationOptions(name)` to `generateRegistrationOptions()`
- Change `verifyRegistration({ credential, friendlyName: name })` to `verifyRegistration({ credential })`
- Remove `setFriendlyName('');` from the success path

In the `control` prop of `SettingsField`, replace the div containing the input and button with just the button:

```tsx
control={
  <Button
    size="sm"
    onClick={() => void handleAddPasskey()}
    disabled={sandboxMode || loading}
  >
    <Plus className="size-4" />
    {loading ? 'Registering...' : 'Add passkey'}
  </Button>
}
```

**Step 2: Format**

Run: `pnpm prettier --write app/dashboard/settings/_components/PasskeySettings.tsx`

**Step 3: Commit**

```
feat: remove manual passkey name input from settings
```

---

### Task 5: Update SignUpForm to remove friendlyName

**Files:**
- Modify: `app/(blobs)/(setup)/_components/SignUpForm.tsx`

**Step 1: Update the passkey registration calls**

On line 92, change:
```typescript
await generateRegistrationOptions('Default passkey');
```
to:
```typescript
await generateRegistrationOptions();
```

On lines 108-111, change:
```typescript
const verifyResult = await verifyRegistration({
  credential,
  friendlyName: 'Default passkey',
});
```
to:
```typescript
const verifyResult = await verifyRegistration({
  credential,
});
```

**Step 2: Format**

Run: `pnpm prettier --write "app/(blobs)/(setup)/_components/SignUpForm.tsx"`

**Step 3: Commit**

```
refactor: remove friendlyName from signup passkey registration
```

---

### Task 6: Update Storybook stories

**Files:**
- Modify: `app/dashboard/settings/_components/PasskeySettings.stories.tsx`

**Step 1: No changes needed to story data**

The stories already use `friendlyName` in their fixture data, and the component still reads `friendlyName` from the passkey objects for display. The story fixtures simulate data that would come from the database (where `friendlyName` is now auto-populated), so the existing values like "iCloud Keychain" and "YubiKey 5C" are perfectly appropriate.

Verify stories still render: run `pnpm storybook` and check the PasskeySettings stories render correctly without the name input.

**Step 2: Commit (skip if no changes)**

---

### Task 7: Update e2e test fixtures and specs

**Files:**
- Modify: `tests/e2e/fixtures/db-fixture.ts:161-194`
- Modify: `tests/e2e/specs/dashboard/passkeys.spec.ts:143`

**Step 1: Update the seed helper**

In `tests/e2e/fixtures/db-fixture.ts`, update `seedPasskeyForUser` to accept `aaguid` instead of `friendlyName`:

```typescript
async seedPasskeyForUser(
  username: string,
  credentialId: string,
  publicKey: string,
  options?: {
    aaguid?: string;
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
      aaguid: options?.aaguid ?? null,
      friendlyName: options?.friendlyName ?? 'Test Passkey',
    },
  });

  log('test', `Seeded passkey for user "${username}"`);
}
```

**Step 2: Update the passkey spec**

In `tests/e2e/specs/dashboard/passkeys.spec.ts` line 143, change:
```typescript
{ friendlyName: 'Test User Passkey' },
```
to:
```typescript
{ friendlyName: 'Test User Passkey', aaguid: '00000000-0000-0000-0000-000000000000' },
```

**Step 3: Commit**

```
test: update e2e fixtures for aaguid-based passkey naming
```

---

### Task 8: Verify everything works

**Step 1: Run type checking**

Run: `pnpm typecheck`
Expected: No errors

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run unit tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Format all modified files**

Run: `pnpm prettier --write actions/webauthn.ts lib/webauthn/getAuthenticatorName.ts lib/db/schema.prisma "app/dashboard/settings/_components/PasskeySettings.tsx" "app/(blobs)/(setup)/_components/SignUpForm.tsx" tests/e2e/fixtures/db-fixture.ts tests/e2e/specs/dashboard/passkeys.spec.ts`
