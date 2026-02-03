import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { offlineDb } from '~/lib/offline/db';

type InterviewData = {
  network: {
    nodes: NcNode[];
    edges: NcEdge[];
    ego: {
      _uid: string;
      attributes: Record<string, unknown>;
    };
  };
  currentStep: number;
  stageMetadata?: Record<string, unknown>;
  lastUpdated: string;
};

export type ConflictDiff = {
  nodesAdded: number;
  nodesRemoved: number;
  nodesModified: number;
  edgesAdded: number;
  edgesRemoved: number;
  edgesModified: number;
  egoChanged: boolean;
  stepChanged: boolean;
};

export class ConflictResolver {
  computeDiff(localData: unknown, serverData: unknown): ConflictDiff {
    const local = localData as InterviewData;
    const server = serverData as InterviewData;
    const localNodeMap = new Map(
      local.network.nodes.map((node) => [node._uid, node]),
    );
    const serverNodeMap = new Map(
      server.network.nodes.map((node) => [node._uid, node]),
    );

    const localEdgeMap = new Map(
      local.network.edges.map((edge) => [edge._uid, edge]),
    );
    const serverEdgeMap = new Map(
      server.network.edges.map((edge) => [edge._uid, edge]),
    );

    let nodesAdded = 0;
    let nodesRemoved = 0;
    let nodesModified = 0;

    for (const [uid, localNode] of localNodeMap) {
      const serverNode = serverNodeMap.get(uid);
      if (!serverNode) {
        nodesAdded++;
      } else if (
        JSON.stringify(localNode.attributes) !==
        JSON.stringify(serverNode.attributes)
      ) {
        nodesModified++;
      }
    }

    for (const [uid] of serverNodeMap) {
      if (!localNodeMap.has(uid)) {
        nodesRemoved++;
      }
    }

    let edgesAdded = 0;
    let edgesRemoved = 0;
    let edgesModified = 0;

    for (const [uid, localEdge] of localEdgeMap) {
      const serverEdge = serverEdgeMap.get(uid);
      if (!serverEdge) {
        edgesAdded++;
      } else if (
        JSON.stringify(localEdge.attributes) !==
        JSON.stringify(serverEdge.attributes)
      ) {
        edgesModified++;
      }
    }

    for (const [uid] of serverEdgeMap) {
      if (!localEdgeMap.has(uid)) {
        edgesRemoved++;
      }
    }

    const egoChanged =
      JSON.stringify(local.network.ego.attributes) !==
      JSON.stringify(server.network.ego.attributes);

    const stepChanged = local.currentStep !== server.currentStep;

    return {
      nodesAdded,
      nodesRemoved,
      nodesModified,
      edgesAdded,
      edgesRemoved,
      edgesModified,
      egoChanged,
      stepChanged,
    };
  }

  async resolveKeepLocal(interviewId: string): Promise<void> {
    const conflict = await offlineDb.conflicts
      .where('interviewId')
      .equals(interviewId)
      .first();

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const localData = JSON.parse(conflict.localData) as InterviewData;

    const response = await fetch(`/api/interviews/${interviewId}/force-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localData),
    });

    if (!response.ok) {
      throw new Error('Failed to force sync local data');
    }

    await offlineDb.interviews.update(interviewId, {
      syncStatus: 'synced',
    });

    if (conflict.id) {
      await offlineDb.conflicts.update(conflict.id, {
        resolvedAt: Date.now(),
      });
    }
  }

  async resolveKeepServer(interviewId: string): Promise<void> {
    const conflict = await offlineDb.conflicts
      .where('interviewId')
      .equals(interviewId)
      .first();

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const serverData = JSON.parse(conflict.serverData) as InterviewData;

    await offlineDb.interviews.update(interviewId, {
      data: JSON.stringify(serverData),
      syncStatus: 'synced',
      lastUpdated: Date.now(),
    });

    if (conflict.id) {
      await offlineDb.conflicts.update(conflict.id, {
        resolvedAt: Date.now(),
      });
    }
  }

  async resolveKeepBoth(interviewId: string): Promise<void> {
    const conflict = await offlineDb.conflicts
      .where('interviewId')
      .equals(interviewId)
      .first();

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    const localData = JSON.parse(conflict.localData) as InterviewData;

    const response = await fetch('/api/interviews/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId,
        data: localData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create duplicate interview');
    }

    const serverData = JSON.parse(conflict.serverData) as InterviewData;

    await offlineDb.interviews.update(interviewId, {
      data: JSON.stringify(serverData),
      syncStatus: 'synced',
      lastUpdated: Date.now(),
    });

    if (conflict.id) {
      await offlineDb.conflicts.update(conflict.id, {
        resolvedAt: Date.now(),
      });
    }
  }
}

export const conflictResolver = new ConflictResolver();
