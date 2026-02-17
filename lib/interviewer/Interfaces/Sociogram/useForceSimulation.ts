import {
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { clamp } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type AppDispatch } from '~/lib/interviewer/store';
import { type SociogramStoreApi } from './useSociogramStore';

const SIM_RANGE = 250;

type SimNode = {
  nodeId: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
};

// Convert normalized 0-1 to simulation space (centered at 0, range +-SIM_RANGE)
const toSimCoords = (pos: { x: number; y: number }) => ({
  x: (pos.x - 0.5) * SIM_RANGE * 2,
  y: (pos.y - 0.5) * SIM_RANGE * 2,
});

// Convert simulation space to normalized 0-1
const toNormalized = (pos: { x: number; y: number }) => ({
  x: clamp(pos.x / (SIM_RANGE * 2) + 0.5, 0, 1),
  y: clamp(pos.y / (SIM_RANGE * 2) + 0.5, 0, 1),
});

type UseForceSimulationOptions = {
  enabled: boolean;
  nodes: NcNode[];
  edges: NcEdge[];
  layoutVariable: string;
  store: SociogramStoreApi;
  dispatch: AppDispatch;
};

export function useForceSimulation({
  enabled,
  nodes,
  edges,
  layoutVariable,
  store,
  dispatch,
}: UseForceSimulationOptions) {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(enabled);

  // Keep refs updated so the effect can read latest values without re-running
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // Stable keys that only change when nodes/edges are added or removed
  const nodeIdsKey = useMemo(
    () =>
      nodes
        .map((n) => n[entityPrimaryKeyProperty])
        .sort()
        .join(','),
    [nodes],
  );

  const edgesKey = useMemo(
    () =>
      edges
        .map((e) => `${e.from}-${e.to}`)
        .sort()
        .join(','),
    [edges],
  );

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL('./forceSimulation.worker', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const { type: msgType, nodes: simNodes } = event.data as {
        type: string;
        nodes: SimNode[];
      };

      if (msgType === 'tick') {
        setIsRunning(true);
        const entries: [string, { x: number; y: number }][] = simNodes
          .filter((n) => n.nodeId)
          .map((n) => [n.nodeId, toNormalized(n)]);
        store.getState().setBatchPositions(entries);
      } else if (msgType === 'end') {
        const entries: [string, { x: number; y: number }][] = simNodes
          .filter((n) => n.nodeId)
          .map((n) => [n.nodeId, toNormalized(n)]);
        store.getState().setBatchPositions(entries);
        setIsRunning(false);
        store.getState().syncToRedux(dispatch, layoutVariable);
      }
    };

    // Build sim nodes with positions from the store
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const { positions } = store.getState();
    const simNodes: SimNode[] = currentNodes.map((node) => {
      const nodeId = node[entityPrimaryKeyProperty];
      const pos = positions.get(nodeId) ?? { x: 0.5, y: 0.5 };
      const simPos = toSimCoords(pos);
      return { nodeId, x: simPos.x, y: simPos.y };
    });

    const simLinks = currentEdges
      .map((edge) => ({
        source: simNodes.findIndex((n) => n.nodeId === edge.from),
        target: simNodes.findIndex((n) => n.nodeId === edge.to),
      }))
      .filter((link) => link.source >= 0 && link.target >= 0);

    worker.postMessage({
      type: 'initialize',
      network: { nodes: simNodes, links: simLinks },
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // Re-initialize only when node structure changes, not attribute or edge changes
  }, [enabled, nodeIdsKey, layoutVariable, store, dispatch]);

  // Update links in the existing worker when edges are added/removed
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !enabled) return;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const nodeIds = currentNodes.map((n) => n[entityPrimaryKeyProperty]);
    const simLinks = currentEdges
      .map((edge) => ({
        source: nodeIds.indexOf(edge.from),
        target: nodeIds.indexOf(edge.to),
      }))
      .filter((link) => link.source >= 0 && link.target >= 0);

    worker.postMessage({ type: 'update_links', links: simLinks });
  }, [enabled, edgesKey]);

  // Start/stop when simulationEnabled changes
  useEffect(() => {
    if (!workerRef.current || !enabled) return;

    if (simulationEnabled) {
      workerRef.current.postMessage({ type: 'start' });
    } else {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, [simulationEnabled, enabled]);

  const start = useCallback(() => {
    workerRef.current?.postMessage({ type: 'start' });
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' });
  }, []);

  const reheat = useCallback(() => {
    workerRef.current?.postMessage({ type: 'reheat' });
  }, []);

  const moveNode = useCallback(
    (nodeId: string, normalizedPos: { x: number; y: number }) => {
      if (!workerRef.current) return;
      const simPos = toSimCoords(normalizedPos);
      workerRef.current.postMessage({
        type: 'update_node',
        nodeId,
        node: { fx: simPos.x, fy: simPos.y },
      });
    },
    [],
  );

  const releaseNode = useCallback((nodeId: string) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({
      type: 'update_node',
      nodeId,
      node: { fx: null, fy: null },
    });
  }, []);

  const toggleSimulation = useCallback(() => {
    setSimulationEnabled((prev) => !prev);
  }, []);

  return {
    isRunning,
    start,
    stop,
    reheat,
    moveNode,
    releaseNode,
    simulationEnabled,
    toggleSimulation,
  };
}
