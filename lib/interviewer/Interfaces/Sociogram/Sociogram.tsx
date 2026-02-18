'use client';

import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Canvas from '~/lib/interviewer/canvas/Canvas';
import {
  createCanvasStore,
  useCanvasStore,
} from '~/lib/interviewer/canvas/useCanvasStore';
import ConcentricCircles from '~/lib/interviewer/components/ConcentricCircles';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { type StageProps } from '~/lib/interviewer/types';
import { getAssetUrlFromId } from '~/lib/interviewer/ducks/modules/protocol';
import {
  toggleEdge,
  toggleNodeAttributes,
  updateNode,
} from '~/lib/interviewer/ducks/modules/session';
import {
  getEdges,
  getNodes,
  getPlacedNodes,
  getUnplacedNodes,
} from '~/lib/interviewer/selectors/canvas';
import { useAppDispatch } from '~/lib/interviewer/store';
import CollapsablePrompts from './CollapsablePrompts';
import NodeDrawer from './NodeDrawer';
import SimulationPanel from './SimulationPanel';
import { useForceSimulation } from './useForceSimulation';

type SociogramProps = StageProps<'Sociogram'>;

const Sociogram = (stageProps: SociogramProps) => {
  const { stage } = stageProps;
  const { prompt } = usePrompts<(typeof stage.prompts)[number]>();
  const dispatch = useAppDispatch();

  const interfaceRef = useRef<HTMLDivElement>(null);

  const getAssetUrl = useSelector(getAssetUrlFromId);

  // Behaviour Configuration
  const allowHighlighting = get(prompt, 'highlight.allowHighlighting', false);
  const createEdge = get(prompt, 'edges.create', null);
  const allowPositioning = get(prompt, 'layout.allowPositioning', true);

  // Display Properties
  const layoutVariable = get(prompt, 'layout.layoutVariable');
  const highlightAttribute = get(prompt, 'highlight.variable');
  const layoutMode: 'AUTOMATIC' | 'MANUAL' = stage.behaviours?.automaticLayout
    ?.enabled
    ? 'AUTOMATIC'
    : 'MANUAL';

  // Background Configuration
  const bgImageId = get(stage, 'background.image', '');
  const backgroundImage = bgImageId ? (getAssetUrl(bgImageId) ?? null) : null;
  const concentricCircles = get(stage, 'background.concentricCircles');
  const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

  const allNodes = useSelector(getNodes);
  const placedNodes = useSelector(getPlacedNodes);
  const unplacedNodes = useSelector(getUnplacedNodes);

  const canvasNodes = layoutMode === 'AUTOMATIC' ? allNodes : placedNodes;
  const edges = useSelector(getEdges);

  // Zustand store for real-time positions
  const storeRef = useRef(createCanvasStore());
  const store = storeRef.current;

  // Sync positions from Redux when nodes or layout variable change.
  // In automatic mode, only initialize new nodes — the simulation owns positions.
  useEffect(() => {
    if (layoutMode === 'AUTOMATIC') {
      store.getState().syncNewFromNodes(canvasNodes, layoutVariable);
    } else {
      store.getState().syncFromNodes(canvasNodes, layoutVariable);
    }
  }, [canvasNodes, layoutVariable, store, layoutMode]);

  // Force simulation (only active in AUTOMATIC mode)
  const simulation = useForceSimulation({
    enabled: layoutMode === 'AUTOMATIC',
    nodes: canvasNodes,
    edges,
    layoutVariable,
    store,
    dispatch,
  });

  const selectedNodeId = useCanvasStore(store, (state) => state.selectedNodeId);

  // Handle node selection (for edge creation and highlighting).
  // Reads selectedNodeId directly from the store to avoid closure staleness —
  // this callback is invoked from a DOM-level pointerup handler (useCanvasDrag)
  // which may capture an outdated closure between clicks.
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (createEdge) {
        const currentSelectedNodeId = store.getState().selectedNodeId;
        if (currentSelectedNodeId === null) {
          store.getState().selectNode(nodeId);
        } else if (currentSelectedNodeId === nodeId) {
          store.getState().selectNode(null);
        } else {
          void dispatch(
            toggleEdge({
              from: currentSelectedNodeId,
              to: nodeId,
              type: createEdge,
            }),
          );
          store.getState().selectNode(null);
        }
      } else if (allowHighlighting && highlightAttribute) {
        const node = canvasNodes.find(
          (n) => n[entityPrimaryKeyProperty] === nodeId,
        );
        if (node) {
          const currentValue =
            node[entityAttributesProperty][highlightAttribute];
          dispatch(
            toggleNodeAttributes({
              nodeId,
              attributes: { [highlightAttribute]: !currentValue },
            }),
          );
        }
      }
    },
    [
      createEdge,
      store,
      dispatch,
      allowHighlighting,
      highlightAttribute,
      canvasNodes,
    ],
  );

  // Handle drag end: sync single position to Redux
  const handleNodeDragEnd = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      void dispatch(
        updateNode({
          nodeId,
          newAttributeData: {
            [layoutVariable]: { x: position.x, y: position.y },
          },
        }),
      );
    },
    [dispatch, layoutVariable],
  );

  // Handle drop from drawer to canvas
  const handleDrop = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      store.getState().setPosition(nodeId, position);
      void dispatch(
        updateNode({
          nodeId,
          newAttributeData: {
            [layoutVariable]: { x: position.x, y: position.y },
          },
        }),
      );
    },
    [store, dispatch, layoutVariable],
  );

  const background = backgroundImage ? (
    <img
      src={backgroundImage}
      className="size-full object-cover"
      alt="Background"
    />
  ) : (
    <ConcentricCircles n={concentricCircles} skewed={skewedTowardCenter} />
  );

  const simulationHandlers =
    layoutMode === 'AUTOMATIC'
      ? {
          moveNode: simulation.moveNode,
          releaseNode: simulation.releaseNode,
        }
      : null;

  return (
    <div
      className="interface relative h-dvh overflow-hidden"
      ref={interfaceRef}
    >
      <Canvas
        background={background}
        nodes={canvasNodes}
        edges={edges}
        store={store}
        selectedNodeId={selectedNodeId}
        highlightAttribute={highlightAttribute}
        onNodeSelect={handleNodeSelect}
        onNodeDragEnd={handleNodeDragEnd}
        onDrop={handleDrop}
        allowRepositioning={allowPositioning}
        simulation={simulationHandlers}
      />
      {layoutMode === 'MANUAL' ? (
        <NodeDrawer nodes={unplacedNodes} />
      ) : (
        <SimulationPanel
          simulationEnabled={simulation.simulationEnabled}
          onToggle={simulation.toggleSimulation}
          dragConstraints={interfaceRef}
        />
      )}
      <CollapsablePrompts dragConstraints={interfaceRef} />
    </div>
  );
};

export default Sociogram;
