# Synthetic Interview Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Synthetic Interview Data" settings section that generates realistic test interviews from a protocol's codebook and stage structure using faker, with SSE progress streaming and bulk deletion.

**Architecture:** An API route streams progress via SSE as it generates interviews one-by-one. The core generator walks protocol stages in order, using the existing `ValueGenerator` class to produce plausible attribute values. A server action handles deletion. A `isSynthetic` boolean column on both `Participant` and `Interview` models enables safe identification and cleanup.

**Tech Stack:** Next.js App Router, Prisma, PostgreSQL, `@faker-js/faker` (via existing `ValueGenerator`), Zod, SSE via `ReadableStream`, React `useState` for client state.

**Spec:** `docs/specs/2026-03-18-synthetic-interview-generation-design.md`

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `schemas/synthetic-interviews.ts` | Zod schema for generation request validation |
| `lib/synthetic-interviews/generateNetwork.ts` | Stage-aware network generator — walks protocol stages, produces `NcNetwork` |
| `queries/synthetic-interviews.ts` | Plain async count query for synthetic interviews/participants |
| `actions/synthetic-interviews.ts` | Server action: delete all synthetic data |
| `app/api/generate-test-interviews/route.ts` | SSE endpoint: generates interviews with progress streaming |
| `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx` | Client component: protocol picker, count input, generate button, progress bar, delete button |
| `app/dashboard/settings/_components/SyntheticInterviewDataServer.tsx` | Server component: fetches protocols + counts, passes to client component |

### Modified files

| File | Change |
|---|---|
| `lib/db/schema.prisma` | Add `isSynthetic Boolean @default(false)` to `Participant` and `Interview` |
| `app/dashboard/settings/page.tsx` | Add "Synthetic Interview Data" nav entry and section component |
| `app/dashboard/_components/ActivityFeed/types.ts` | Add `'Synthetic Data Generated'` and `'Synthetic Data Deleted'` to `activityTypes` |
| `app/dashboard/_components/ActivityFeed/utils.ts` | Add badge colors for new activity types |
| `package.json` | Move `@faker-js/faker` from devDependencies to dependencies |

---

## Task 1: Database Schema — Add `isSynthetic` Column

**Files:**
- Modify: `lib/db/schema.prisma:126-131` (Participant model)
- Modify: `lib/db/schema.prisma:108-124` (Interview model)
- Modify: `package.json` (move faker to dependencies)

- [ ] **Step 1: Add `isSynthetic` to Participant model**

In `lib/db/schema.prisma`, add to the `Participant` model after the `label` field:

```prisma
model Participant {
  id          String      @id @unique @default(cuid())
  identifier  String      @unique
  label       String?
  isSynthetic Boolean     @default(false)
  interviews  Interview[]
}
```

- [ ] **Step 2: Add `isSynthetic` to Interview model**

In `lib/db/schema.prisma`, add to the `Interview` model after `stageMetadata`:

```prisma
model Interview {
  id            String      @id @default(cuid())
  startTime     DateTime    @default(now())
  finishTime    DateTime?
  exportTime    DateTime?
  lastUpdated   DateTime    @updatedAt
  network       Json
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  participantId String
  protocol      Protocol    @relation(fields: [protocolId], references: [id], onDelete: Cascade)
  protocolId    String      @map("protocolId")
  currentStep   Int         @default(0)
  stageMetadata Json?
  isSynthetic   Boolean     @default(false)

  @@index(fields: [protocolId])
  @@index([participantId])
}
```

- [ ] **Step 3: Generate and run the Prisma migration**

```bash
pnpm prisma migrate dev --name add_is_synthetic
```

Expected: Migration creates two `ALTER TABLE` statements adding `isSynthetic` columns with `DEFAULT false`.

- [ ] **Step 4: Move `@faker-js/faker` from devDependencies to dependencies**

In `package.json`, remove the `@faker-js/faker` entry from `devDependencies` and add it to `dependencies` with the same version (`^10.3.0`). Then run:

```bash
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.prisma lib/db/generated/ package.json pnpm-lock.yaml
git commit -m "Add isSynthetic column to Participant and Interview models"
```

---

## Task 2: Zod Schema & Count Query

**Files:**
- Create: `schemas/synthetic-interviews.ts`
- Create: `queries/synthetic-interviews.ts`

- [ ] **Step 1: Create Zod validation schema**

Create `schemas/synthetic-interviews.ts`:

```typescript
import { z } from 'zod';

export const generateSyntheticInterviewsSchema = z.object({
  protocolId: z.string().min(1),
  count: z.number().int().min(1).max(1000),
});
```

- [ ] **Step 2: Create count query**

Create `queries/synthetic-interviews.ts`:

```typescript
import { prisma } from '~/lib/db';

export async function getSyntheticInterviewCount() {
  const [interviewCount, participantCount] = await Promise.all([
    prisma.interview.count({ where: { isSynthetic: true } }),
    prisma.participant.count({ where: { isSynthetic: true } }),
  ]);

  return { interviewCount, participantCount };
}
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add schemas/synthetic-interviews.ts queries/synthetic-interviews.ts
git commit -m "Add Zod schema and count query for synthetic interviews"
```

---

## Task 3: Activity Types & Delete Server Action

**Files:**
- Modify: `app/dashboard/_components/ActivityFeed/types.ts:4-38` (add new activity types)
- Modify: `app/dashboard/_components/ActivityFeed/utils.ts:3-18` (add badge colors)
- Create: `actions/synthetic-interviews.ts`

- [ ] **Step 1: Register new activity types**

In `app/dashboard/_components/ActivityFeed/types.ts`, add two new entries to the `activityTypes` array (before the closing `] as const`):

```typescript
  'Synthetic Data Generated',
  'Synthetic Data Deleted',
```

In `app/dashboard/_components/ActivityFeed/utils.ts`, add cases to `getBadgeColorsForActivityType`:

```typescript
    case 'Synthetic Data Generated':
      return 'bg-sea-green hover:bg-sea-green';
    case 'Synthetic Data Deleted':
      return 'bg-neon-carrot hover:bg-neon-carrot-dark';
```

- [ ] **Step 2: Create delete action**

Create `actions/synthetic-interviews.ts`:

```typescript
'use server';

import { addEvent } from '~/actions/activityFeed';
import { safeUpdateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { requireApiAuth } from '~/utils/auth';

export async function deleteSyntheticData() {
  await requireApiAuth();

  try {
    const interviewCount = await prisma.interview.count({
      where: { isSynthetic: true },
    });
    const participantCount = await prisma.participant.count({
      where: { isSynthetic: true },
    });

    // Delete interviews first (foreign key constraint)
    await prisma.interview.deleteMany({
      where: { isSynthetic: true },
    });

    await prisma.participant.deleteMany({
      where: { isSynthetic: true },
    });

    safeUpdateTag([
      'getInterviews',
      'getParticipants',
      'interviewCount',
      'participantCount',
      'summaryStatistics',
      'activityFeed',
    ]);

    void addEvent(
      'Synthetic Data Deleted',
      `Deleted ${String(interviewCount)} synthetic interviews and ${String(participantCount)} test participants`,
    );

    return { error: null, deleted: { interviewCount, participantCount } };
  } catch (_error) {
    return { error: 'Failed to delete synthetic data', deleted: null };
  }
}
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm typecheck
```

Expected: No type errors. The `'Synthetic Data Deleted'` activity type was registered in Step 1.

- [ ] **Step 4: Commit**

```bash
git add actions/synthetic-interviews.ts app/dashboard/_components/ActivityFeed/types.ts app/dashboard/_components/ActivityFeed/utils.ts
git commit -m "Add activity types and server action for synthetic data deletion"
```

---

## Task 4: Stage-Aware Network Generator

This is the core logic. It takes a protocol (with codebook and stages) and produces a realistic `NcNetwork`.

**Files:**
- Create: `lib/synthetic-interviews/generateNetwork.ts`

**Reference files:**
- `lib/interviewer/utils/SyntheticInterview/ValueGenerator.ts` — reuse for variable value generation
- `lib/interviewer/utils/SyntheticInterview/types.ts` — `VariableEntry`, `StageType` types
- `@codaco/shared-consts` — `NcNetwork`, `NcNode`, `NcEdge`, `NcEgo`, `entityPrimaryKeyProperty`, `entityAttributesProperty`

- [ ] **Step 1: Create the generator module**

Create `lib/synthetic-interviews/generateNetwork.ts`. The module exports a single function:

```typescript
import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { v4 as uuid } from 'uuid';
import { ValueGenerator } from '~/lib/interviewer/utils/SyntheticInterview/ValueGenerator';
import { type VariableEntry } from '~/lib/interviewer/utils/SyntheticInterview/types';
```

The main function signature:

```typescript
type Codebook = {
  node?: Record<string, {
    displayVariable?: string;
    color?: string;
    variables?: Record<string, {
      name: string;
      type: string;
      options?: { label: string; value: string | number }[];
      validation?: Record<string, unknown>;
      component?: string;
    }>;
  }>;
  edge?: Record<string, {
    color?: string;
    variables?: Record<string, {
      name: string;
      type: string;
      options?: { label: string; value: string | number }[];
      validation?: Record<string, unknown>;
      component?: string;
    }>;
  }>;
  ego?: {
    variables?: Record<string, {
      name: string;
      type: string;
      options?: { label: string; value: string | number }[];
      validation?: Record<string, unknown>;
      component?: string;
    }>;
  };
};

type GenerateNetworkResult = {
  network: NcNetwork;
  stageMetadata: Record<string, unknown> | null;
};

export function generateNetwork(
  codebook: Codebook,
  stages: Stage[],
  seed?: number,
): GenerateNetworkResult {
  const valueGen = new ValueGenerator(seed ?? Math.floor(Math.random() * 100000));
  const nodes: NcNode[] = [];
  const edges: NcEdge[] = [];
  const egoAttributes: Record<string, unknown> = {};
  const stageMetadata: Record<string, unknown> = {};

  // ... stage walking logic (see steps below)
}
```

- [ ] **Step 2: Extend `ValueGenerator` with seeded random helpers**

Add two public methods to `lib/interviewer/utils/SyntheticInterview/ValueGenerator.ts`:

```typescript
  randomInt(min: number, max: number): number {
    return this.faker.number.int({ min, max });
  }

  randomFloat(min: number, max: number): number {
    return this.faker.number.float({ min, max });
  }
```

These expose the seeded faker PRNG for use outside of variable generation (node counts, edge probabilities, etc.).

- [ ] **Step 3: Implement helper — codebook variable to VariableEntry**

Inside the module, add a helper to convert codebook variable definitions to the `VariableEntry` shape that `ValueGenerator` expects:

```typescript
function toVariableEntry(
  id: string,
  variable: { name: string; type: string; options?: { label: string; value: string | number }[]; validation?: Record<string, unknown>; component?: string },
): VariableEntry {
  return {
    id,
    name: variable.name,
    type: variable.type as VariableEntry['type'],
    component: variable.component as VariableEntry['component'],
    options: variable.options,
    validation: variable.validation,
  };
}
```

- [ ] **Step 4: Implement helper — generate attributes for an entity type**

```typescript
function generateAttributes(
  variables: Record<string, { name: string; type: string; options?: { label: string; value: string | number }[]; validation?: Record<string, unknown>; component?: string }> | undefined,
  valueGen: ValueGenerator,
  index: number,
): Record<string, unknown> {
  if (!variables) return {};
  const attrs: Record<string, unknown> = {};
  for (const [varId, variable] of Object.entries(variables)) {
    const entry = toVariableEntry(varId, variable);
    attrs[varId] = valueGen.generateForVariable(entry, index);
  }
  return attrs;
}
```

- [ ] **Step 5: Implement helper — create nodes for a stage**

Note: All random number generation must go through the seeded `ValueGenerator` instance (via its internal `faker`) to ensure reproducible output when a seed is provided. Do NOT use `Math.random()` anywhere in this module. Access the faker instance on `ValueGenerator` by adding a public getter or by passing the faker instance through. If `ValueGenerator` doesn't expose its faker directly, add a method like `randomInt(min, max)` and `randomFloat(min, max)` to it, or extend it in a subclass.

```typescript
function createNodesForStage(
  codebook: Codebook,
  stage: Stage,
  promptId: string,
  valueGen: ValueGenerator,
  existingNodeCount: number,
): NcNode[] {
  const subject = (stage as Record<string, unknown>).subject as { entity: string; type: string } | undefined;
  if (!subject || subject.entity !== 'node') return [];

  const nodeType = subject.type;
  const nodeTypeDef = codebook.node?.[nodeType];
  if (!nodeTypeDef) return [];

  const count = valueGen.randomInt(3, 8); // Use seeded random, NOT Math.random()
  const newNodes: NcNode[] = [];

  for (let i = 0; i < count; i++) {
    const nodeIndex = existingNodeCount + i;
    const attrs = generateAttributes(nodeTypeDef.variables, valueGen, nodeIndex);

    newNodes.push({
      [entityPrimaryKeyProperty]: uuid(),
      type: nodeType,
      [entityAttributesProperty]: attrs,
      stageId: (stage as Record<string, unknown>).id as string,
      promptIDs: [promptId],
    } as NcNode);
  }

  return newNodes;
}
```

- [ ] **Step 6: Implement helper — create edges between node pairs**

```typescript
function createEdgesForPairs(
  nodes: NcNode[],
  edgeType: string,
  probability: number,
  valueGen: ValueGenerator,
  edgeVariables?: Record<string, { name: string; type: string; options?: { label: string; value: string | number }[]; validation?: Record<string, unknown>; component?: string }>,
): { edges: NcEdge[]; negativeIndices: [number, number][] } {
  const newEdges: NcEdge[] = [];
  const negativeIndices: [number, number][] = [];
  let edgeIndex = 0;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (valueGen.randomFloat(0, 1) < probability) {
        const attrs = edgeVariables
          ? generateAttributes(edgeVariables, valueGen, edgeIndex)
          : {};
        newEdges.push({
          [entityPrimaryKeyProperty]: uuid(),
          type: edgeType,
          from: nodes[i]![entityPrimaryKeyProperty],
          to: nodes[j]![entityPrimaryKeyProperty],
          [entityAttributesProperty]: attrs,
        } as NcEdge);
        edgeIndex++;
      } else {
        negativeIndices.push([i, j]);
      }
    }
  }

  return { edges: newEdges, negativeIndices };
}
```

- [ ] **Step 7: Implement the main stage-walking loop**

The `generateNetwork` function iterates over stages and dispatches to the appropriate handler based on stage type. Use the `StageType` values from the types file. The stage type is accessed via `(stage as Record<string, unknown>).type` since the `Stage` type from `@codaco/protocol-validation` is a complex union.

Key stage handling logic:

- **NameGenerator / NameGeneratorQuickAdd / NameGeneratorRoster**: For each prompt, call `createNodesForStage`. If stage has a `form`, also fill those fields on each created node.
- **Sociogram**: For each prompt that has `edges.create`, call `createEdgesForPairs` with ~0.3-0.5 probability on nodes matching the stage subject. Set layout variable on each node.
- **DyadCensus / OneToManyDyadCensus**: For each prompt, get the `createEdge` type from the prompt. Call `createEdgesForPairs` with ~0.4-0.6 probability. Store negative responses in `stageMetadata`.
- **TieStrengthCensus**: Same as DyadCensus but also set the prompt's `edgeVariable` on each created edge.
- **OrdinalBin**: For each prompt, get the `variable` and assign a random option value to each existing node of the stage's subject type.
- **CategoricalBin**: Same as OrdinalBin but assign a random subset of options (1-2 items).
- **EgoForm**: Call `generateAttributes` on the ego codebook variables and merge into `egoAttributes`.
- **AlterForm**: For each node of the stage's subject type, fill form field variables.
- **AlterEdgeForm**: For each edge of the stage's subject type, fill form field variables.
- **FamilyTreeCensus**: Create 4-10 nodes with the family-specific variables filled. Create edges using the stage's `edgeType`. Mark one node as ego.
- **Geospatial**: For each prompt, set the location variable on nodes of the stage's subject type.
- **Information / Anonymisation / Narrative**: Skip.

Return the assembled network:

```typescript
return {
  network: {
    ego: {
      [entityPrimaryKeyProperty]: uuid(),
      [entityAttributesProperty]: egoAttributes,
    } as NcNetwork['ego'],
    nodes,
    edges,
  },
  stageMetadata: Object.keys(stageMetadata).length > 0 ? stageMetadata : null,
};
```

- [ ] **Step 8: Verify types compile**

```bash
pnpm typecheck
```

Expected: No type errors.

**Note on type assertions:** The `Stage` type from `@codaco/protocol-validation` is a complex discriminated union that makes property access verbose. Some `as` assertions are unavoidable when accessing stage properties like `subject`, `id`, `prompts`, etc. from the generic `Stage` type. These assertions are acceptable because the protocol has been validated on import. However, prefer type narrowing where practical (e.g., checking `'subject' in stage` before accessing). The `Codebook` type defined in this module avoids assertions for codebook access since we define our own type matching the JSON shape.

- [ ] **Step 9: Commit**

```bash
git add lib/synthetic-interviews/generateNetwork.ts lib/interviewer/utils/SyntheticInterview/ValueGenerator.ts
git commit -m "Add stage-aware network generator for synthetic interviews"
```

---

## Task 5: SSE API Route

**Files:**
- Create: `app/api/generate-test-interviews/route.ts`

**Reference files:**
- `app/api/interviews/[interviewId]/finish/route.ts` — pattern for route handlers
- `actions/activityFeed.ts` — `addEvent` function

- [ ] **Step 1: Create the route handler**

Create `app/api/generate-test-interviews/route.ts`:

```typescript
import { createId } from '@paralleldrive/cuid2';
import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { generateNetwork } from '~/lib/synthetic-interviews/generateNetwork';
import { generateSyntheticInterviewsSchema } from '~/schemas/synthetic-interviews';
import { requireApiAuth } from '~/utils/auth';
```

The handler:

```typescript
export async function POST(request: Request) {
  try {
    await requireApiAuth();
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body: unknown = await request.json();
  const parsed = generateSyntheticInterviewsSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
    });
  }

  const { protocolId, count } = parsed.data;

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
  });

  if (!protocol) {
    return new Response(JSON.stringify({ error: 'Protocol not found' }), {
      status: 404,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for (let i = 0; i < count; i++) {
          const { network, stageMetadata } = generateNetwork(
            protocol.codebook as Parameters<typeof generateNetwork>[0],
            protocol.stages as Parameters<typeof generateNetwork>[1],
          );

          const participantIdentifier = `test-${createId()}`;

          // Timestamps don't need seeded reproducibility — each interview
          // should have a unique, plausible time regardless of seed.
          const startTime = new Date(
            Date.now() - Math.floor(Math.random() * 3600000),
          );
          const finishTime = new Date(
            startTime.getTime() + Math.floor(Math.random() * 1800000) + 300000,
          );

          const stages = protocol.stages as { id: string }[];

          await prisma.interview.create({
            data: {
              network: network as object,
              currentStep: stages.length,
              startTime,
              finishTime,
              isSynthetic: true,
              stageMetadata: stageMetadata as object | undefined,
              participant: {
                create: {
                  identifier: participantIdentifier,
                  label: participantIdentifier,
                  isSynthetic: true,
                },
              },
              protocol: {
                connect: { id: protocolId },
              },
            },
          });

          send({ type: 'progress', current: i + 1, total: count });
        }

        safeRevalidateTag([
          'getInterviews',
          'getParticipants',
          'interviewCount',
          'participantCount',
          'summaryStatistics',
          'activityFeed',
        ]);

        void addEvent(
          'Synthetic Data Generated',
          `Generated ${String(count)} synthetic interviews for protocol "${protocol.name}"`,
        );

        send({ type: 'complete', created: count });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm typecheck
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/generate-test-interviews/route.ts
git commit -m "Add SSE API route for generating synthetic interviews"
```

---

## Task 6: Settings UI Component

**Files:**
- Create: `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx`
- Modify: `app/dashboard/settings/page.tsx`

**Reference files:**
- `app/dashboard/_components/RecruitmentTestSection.tsx` — pattern for client component with selects
- `app/dashboard/_components/RecruitmentTestSectionServer.tsx` — pattern for server-to-client data passing
- `components/settings/SettingsCard.tsx` — card wrapper
- `components/settings/SettingsField.tsx` — field wrapper

- [ ] **Step 1: Create the client component**

Create `app/dashboard/settings/_components/SyntheticInterviewDataSection.tsx`:

```typescript
'use client';

import { use, useState } from 'react';
import { SuperJSON } from 'superjson';
import { Button } from '~/components/ui/Button';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import SelectField from '~/lib/form/components/fields/Select/Styled';
import { deleteSyntheticData } from '~/actions/synthetic-interviews';
import { type GetProtocolsQuery, type GetProtocolsReturnType } from '~/queries/protocols';
```

The component accepts server promises as props (following the `RecruitmentTestSection` pattern):

```typescript
type SyntheticInterviewDataSectionProps = {
  protocolsPromise: GetProtocolsReturnType;
  initialCounts: { interviewCount: number; participantCount: number };
};

export default function SyntheticInterviewDataSection({
  protocolsPromise,
  initialCounts,
}: SyntheticInterviewDataSectionProps) {
  const rawProtocols = use(protocolsPromise);
  const protocols = SuperJSON.parse<GetProtocolsQuery>(rawProtocols);

  const [selectedProtocolId, setSelectedProtocolId] = useState<string>();
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [syntheticCounts, setSyntheticCounts] = useState(initialCounts);
  const [isDeleting, setIsDeleting] = useState(false);
```

Generate handler — uses `fetch` with `ReadableStream` to consume SSE:

```typescript
  const handleGenerate = async () => {
    if (!selectedProtocolId || isGenerating) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: count });

    try {
      const response = await fetch('/api/generate-test-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolId: selectedProtocolId, count }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start generation');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch?.[1]) continue;
          const data = JSON.parse(dataMatch[1]) as {
            type: string;
            current?: number;
            total?: number;
            created?: number;
            message?: string;
          };

          if (data.type === 'progress' && data.current !== undefined && data.total !== undefined) {
            setProgress({ current: data.current, total: data.total });
          } else if (data.type === 'complete' && data.created !== undefined) {
            const created = data.created;
            setSyntheticCounts((prev) => ({
              interviewCount: prev.interviewCount + created,
              participantCount: prev.participantCount + created,
            }));
          }
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };
```

Delete handler:

```typescript
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSyntheticData();
      if (!result.error && result.deleted) {
        setSyntheticCounts({ interviewCount: 0, participantCount: 0 });
      }
    } finally {
      setIsDeleting(false);
    }
  };
```

Render:

```typescript
  return (
    <SettingsCard
      id="synthetic-interview-data"
      title="Synthetic Interview Data"
      divideChildren
    >
      <SettingsField
        label="Generate Test Interviews"
        description="Create synthetic interviews with realistic data based on a protocol's codebook and stage structure."
        testId="generate-synthetic-interviews"
      >
        <div className="tablet-landscape:flex-row flex flex-col gap-4">
          <div className="flex-1">
            <SelectField
              name="Protocol"
              options={protocols.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(value) => setSelectedProtocolId(value)}
              value={selectedProtocolId}
              placeholder="Select a protocol..."
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
              className="border-input bg-background h-full w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <Button
            disabled={!selectedProtocolId || isGenerating}
            onClick={() => void handleGenerate()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
        {isGenerating && (
          <div className="mt-3 flex items-center gap-3">
            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-muted-foreground text-sm">
              {progress.current} / {progress.total}
            </span>
          </div>
        )}
      </SettingsField>

      <SettingsField
        label="Delete Test Interviews"
        description={
          syntheticCounts.interviewCount > 0
            ? `Remove all synthetic interviews and their test participants. ${String(syntheticCounts.interviewCount)} test interviews found.`
            : 'No synthetic interviews found.'
        }
        testId="delete-synthetic-interviews"
        control={
          <Button
            variant="destructive"
            disabled={syntheticCounts.interviewCount === 0 || isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        }
      />
    </SettingsCard>
  );
}
```

- [ ] **Step 2: Add the section to the settings page**

Modify `app/dashboard/settings/page.tsx`:

**Add import** (after existing imports):

```typescript
import { getSyntheticInterviewCount } from '~/queries/synthetic-interviews';
import { getProtocols } from '~/queries/protocols';
import SyntheticInterviewDataSection from './_components/SyntheticInterviewDataSection';
```

Note: `getProtocols` may already be imported elsewhere — check first.

**Add nav entry** — in `getSettingsSections()`, add before the developer-tools conditional push:

```typescript
sections.push({
  id: 'synthetic-interview-data',
  title: 'Synthetic Interview Data',
});
```

Place this after `{ id: 'preview-mode', title: 'Preview Mode' }` and before the `if (env.NODE_ENV ...)` block.

**Add section component** — in the `SettingsContent` async function, add between `<PreviewModeSection />` and the developer tools conditional block:

```typescript
<Suspense fallback={<SettingsCardSkeleton rows={2} />}>
  <SyntheticInterviewDataServer />
</Suspense>
```

Create a small server wrapper inside the same file (or as a separate file following the `RecruitmentTestSectionServer` pattern). Since the settings page already uses inline async components, an inline approach works:

Create `app/dashboard/settings/_components/SyntheticInterviewDataServer.tsx`:

```typescript
import { Suspense } from 'react';
import { getProtocols } from '~/queries/protocols';
import { getSyntheticInterviewCount } from '~/queries/synthetic-interviews';
import SyntheticInterviewDataSection from './SyntheticInterviewDataSection';

export default async function SyntheticInterviewDataServer() {
  const protocolsPromise = getProtocols();
  const initialCounts = await getSyntheticInterviewCount();

  return (
    <Suspense fallback="Loading...">
      <SyntheticInterviewDataSection
        protocolsPromise={protocolsPromise}
        initialCounts={initialCounts}
      />
    </Suspense>
  );
}
```

Then import and use this in the settings page.

- [ ] **Step 3: Add skeleton to the SettingsContentSkeleton function**

Add a `<SettingsCardSkeleton rows={2} />` line in the skeleton function, positioned in the same relative order as the real section (after preview mode skeleton, before developer tools skeleton).

- [ ] **Step 4: Verify types compile**

```bash
pnpm typecheck
```

- [ ] **Step 5: Run lint and format**

```bash
pnpm lint --fix && pnpm prettier --write "app/dashboard/settings/**/*.tsx" "app/dashboard/settings/**/*.ts"
```

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/settings/ queries/synthetic-interviews.ts
git commit -m "Add Synthetic Interview Data settings section with generate and delete UI"
```

---

## Task 7: Integration Testing & Polish

- [ ] **Step 1: Start the dev server and verify the UI renders**

Have the user start the dev server (`pnpm dev`). Navigate to `/dashboard/settings`. Verify:
- "Synthetic Interview Data" section appears in the sidebar nav
- The section card renders with the protocol dropdown, count input, generate button, and delete button
- The delete button is disabled when there are no synthetic interviews

- [ ] **Step 2: Test generation flow**

Upload a protocol if one isn't already present. Select it, set count to 5, click Generate. Verify:
- Progress bar appears and advances
- After completion, the dashboard shows the new interviews
- The delete button now shows a count

- [ ] **Step 3: Test delete flow**

Click "Delete All". Verify:
- Synthetic interviews are removed
- Count resets to 0
- Real interviews (if any) are unaffected

- [ ] **Step 4: Run the full quality check suite**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Fix any issues.

- [ ] **Step 5: Format all changed files**

```bash
pnpm prettier --write "lib/synthetic-interviews/**/*.ts" "app/api/generate-test-interviews/**/*.ts" "actions/synthetic-interviews.ts" "schemas/synthetic-interviews.ts" "queries/synthetic-interviews.ts" "app/dashboard/settings/**/*.tsx"
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "Polish and verify synthetic interview generation feature"
```
