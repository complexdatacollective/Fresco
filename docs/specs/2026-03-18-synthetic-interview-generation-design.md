# Synthetic Interview Generation

Generate realistic test interviews from a protocol's codebook and stage structure using faker.

## Overview

A new "Synthetic Interview Data" settings section allows users to select a protocol, specify a count, and generate synthetic interviews with plausible network data. An API route streams progress via SSE. A delete button removes all synthetic data using a dedicated `isSynthetic` database column.

## Database Changes

Add `isSynthetic` column to both `Participant` and `Interview` models in `lib/db/schema.prisma`:

```prisma
model Participant {
  // ... existing fields
  isSynthetic Boolean @default(false)
}

model Interview {
  // ... existing fields
  isSynthetic Boolean @default(false)
}
```

A Prisma migration adds both columns with `DEFAULT false` so existing data is unaffected.

## Relationship to Existing `SyntheticInterview` Builder

The existing `lib/interviewer/utils/SyntheticInterview/` utility builds protocols programmatically for testing — it creates synthetic protocol definitions with stages, codebooks, and sample networks. Our feature does the inverse: given an existing real protocol, generate realistic interview data for it.

However, we should reuse the `ValueGenerator` class from that utility. It already handles faker-to-variable-type mapping with seeding support. The new generator will import and use `ValueGenerator` rather than duplicating that logic.

## Stage-Aware Network Generator

The core generator walks each protocol stage in order and simulates what a real participant would produce. It imports `ValueGenerator` from the existing `SyntheticInterview` utility for variable value generation.

### Stage behavior

| Stage Type | Behavior |
|---|---|
| NameGenerator, NameGeneratorQuickAdd | Creates 3-8 nodes of the stage's subject type. Fills attributes from codebook using `ValueGenerator`. If the stage has a `form`, fills those fields too. |
| NameGeneratorRoster | Creates 3-8 nodes (same as NameGenerator — simulates selecting from a roster). |
| Sociogram | Creates edges between existing nodes if prompt specifies `edges.create`. Generates layout coordinates for each node using the prompt's `layoutVariable`. ~30-50% of possible pairs get edges. |
| DyadCensus, OneToManyDyadCensus | Iterates node pairs, creates edges for ~40-60% of pairs using the prompt's `createEdge` type. |
| TieStrengthCensus | Same pair iteration as DyadCensus but also sets the prompt's `edgeVariable` on each edge using `ValueGenerator`. ~40-60% pair coverage. |
| OrdinalBin | Assigns the prompt's `variable` on existing nodes by picking a random option from the codebook variable's `options`. |
| CategoricalBin | Assigns the prompt's `variable` on existing nodes by picking a random subset of the codebook variable's `options`. |
| EgoForm | Fills ego attributes using `ValueGenerator` based on codebook ego variable definitions. |
| AlterForm | Fills form fields on existing nodes using `ValueGenerator`. |
| AlterEdgeForm | Fills form fields on existing edges using `ValueGenerator`. |
| FamilyTreeCensus | Creates 4-10 nodes with `relationshipTypeVariable`, `nodeSexVariable`, `relationshipToEgoVariable`, and `nodeIsEgoVariable` filled. Creates family edges using the stage's `edgeType`. One node is marked as ego (`nodeIsEgoVariable = true`). |
| Geospatial | Sets the prompt's location variable on existing nodes using `ValueGenerator.generateForVariable` with type `location`. |
| Information, Anonymisation, Narrative | Skipped (no network data produced). |

### `stageMetadata` handling

For completed interviews to look realistic, the generator populates `stageMetadata` for stages that use it:
- **DyadCensus / OneToManyDyadCensus / TieStrengthCensus**: Records negative responses (pairs where no edge was created) so the interview appears fully resolved rather than abandoned.

## Input Validation

A Zod schema in `schemas/synthetic-interviews.ts`:

```typescript
import { z } from 'zod';

export const generateSyntheticInterviewsSchema = z.object({
  protocolId: z.string().min(1),
  count: z.number().int().min(1).max(1000),
});
```

## API Route

**Endpoint:** `POST /api/generate-test-interviews`

**Auth:** `requireApiAuth()`

**Available in all environments** — no dev mode gating.

**Request body:** Validated against `generateSyntheticInterviewsSchema`.

**Response:** Server-Sent Events stream:

```
data: {"type":"progress","current":1,"total":50}
data: {"type":"progress","current":2,"total":50}
...
data: {"type":"complete","created":50}
```

On error:
```
data: {"type":"error","message":"Protocol not found"}
```

**Flow per interview:**
1. Create a synthetic participant (`test-{cuid}` identifier, `isSynthetic: true`)
2. Run the stage-aware generator against the protocol to produce an `NcNetwork`
3. Insert the interview via Prisma with `isSynthetic: true`, `network`, `currentStep` set to the last stage index, `finishTime` set to a recent faker datetime, `startTime` a few minutes before
4. Emit progress event
5. After all interviews: invalidate cache tags with `safeRevalidateTag` (route handler context)

**Cache tags to invalidate:** `getInterviews`, `getParticipants`, `interviewCount`, `participantCount`, `summaryStatistics`, `activityFeed`

**Activity feed:** Each generation batch creates a single `addEvent()` entry: "Generated N synthetic interviews for protocol X".

**Timeout considerations:** Interviews are generated and inserted sequentially (one at a time) for per-interview progress and low memory. At 1000 interviews this could take 30-60 seconds. This is acceptable for self-hosted deployments (long-running server). For Vercel deployments, the serverless function timeout (default 60s, configurable up to 300s on Pro) is the practical upper bound. The max count of 1000 provides a reasonable ceiling.

**Concurrent request handling:** The UI disables the generate button during generation (client-side guard). No server-side mutex — if a user circumvents the UI and sends concurrent requests, they'll just get more synthetic data, which is harmless.

## Server Action: Delete Synthetic Data

Located in `actions/synthetic-interviews.ts`. Deletes all records where `isSynthetic = true` — interviews first (foreign key constraint), then participants. Uses `requireApiAuth()`.

**Cache tags to invalidate:** `getInterviews`, `getParticipants`, `interviewCount`, `participantCount`, `summaryStatistics`, `activityFeed` (via `safeUpdateTag`, since this is a server action).

**Activity feed:** Creates an `addEvent()` entry: "Deleted N synthetic interviews and M test participants".

## Query: Count Synthetic Data

A plain async function (not cached) in `queries/synthetic-interviews.ts` that counts interviews and participants where `isSynthetic = true`. Called by the settings section to display the count.

## Faker as a Dependency

`@faker-js/faker` is currently a devDependency. Since the generator runs server-side in the API route (including production builds), faker must be moved to `dependencies` in `package.json`.

## UI: Settings Section

A new "Synthetic Interview Data" section on the settings page, implemented as its own `SettingsCard` with a sidebar nav entry. Available to all authenticated users in all environments.

**Component:** `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx` (client component)

**Contains two SettingsFields:**

1. **Generate Test Interviews** — Protocol dropdown (from `getProtocols()` query), count number input (default 10, min 1, max 1000), generate button. Progress bar appears during generation showing "N / total". Button disabled while generating.

2. **Delete Test Interviews** — Shows count of existing synthetic interviews. Destructive "Delete All" button removes all synthetic participants and interviews.

**State management:** Local React state only (`useState`). SSE consumed via `fetch` with `ReadableStream`.

## File Structure

### New files

| File | Purpose |
|---|---|
| `app/api/generate-test-interviews/route.ts` | SSE endpoint |
| `lib/synthetic-interviews/generateNetwork.ts` | Stage-aware network generator (imports `ValueGenerator`) |
| `actions/synthetic-interviews.ts` | Delete action |
| `queries/synthetic-interviews.ts` | Count query (plain async, not cached) |
| `schemas/synthetic-interviews.ts` | Zod validation schema |
| `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx` | UI component |

### Modified files

| File | Change |
|---|---|
| `lib/db/schema.prisma` | Add `isSynthetic` to Participant and Interview |
| `app/dashboard/settings/page.tsx` | Add section + nav entry |
| `package.json` | Move `@faker-js/faker` from devDependencies to dependencies |
