'use client';

import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { DndStoreProvider } from '~/lib/dnd';
import ConcentricCircles from '~/lib/interviewer/components/ConcentricCircles';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { type StageProps } from '~/lib/interviewer/components/Stage';
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
import Canvas from './Canvas';
import CollapsablePrompts from './CollapsablePrompts';
import NodeDrawer from './NodeDrawer';
import SimulationPanel from './SimulationPanel';
import { useForceSimulation } from './useForceSimulation';
import { createSociogramStore, useSociogramStore } from './useSociogramStore';

type SociogramProps = StageProps & {
  stage: Extract<Stage, { type: 'Sociogram' }>;
};

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
  const storeRef = useRef(createSociogramStore());
  const store = storeRef.current;

  // Sync positions from Redux when nodes or layout variable change
  useEffect(() => {
    store.getState().syncFromNodes(canvasNodes, layoutVariable);
  }, [canvasNodes, layoutVariable, store]);

  // Force simulation (only active in AUTOMATIC mode)
  const simulation = useForceSimulation({
    enabled: layoutMode === 'AUTOMATIC',
    nodes: canvasNodes,
    edges,
    layoutVariable,
    store,
    dispatch,
  });

  const selectedNodeId = useSociogramStore(
    store,
    (state) => state.selectedNodeId,
  );

  // Handle node selection (for edge creation and highlighting)
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (createEdge) {
        // Edge creation mode
        if (selectedNodeId === null) {
          store.getState().selectNode(nodeId);
        } else if (selectedNodeId === nodeId) {
          store.getState().selectNode(null);
        } else {
          void dispatch(
            toggleEdge({
              from: selectedNodeId,
              to: nodeId,
              type: createEdge,
            }),
          );
          store.getState().selectNode(null);
        }
      } else if (allowHighlighting && highlightAttribute) {
        // Highlighting mode
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
      selectedNodeId,
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
    <DndStoreProvider>
      <div className="relative h-dvh overflow-hidden" ref={interfaceRef}>
        <Canvas
          background={background}
          nodes={canvasNodes}
          edges={edges}
          store={store}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          onNodeDragEnd={handleNodeDragEnd}
          onDrop={handleDrop}
          allowRepositioning={allowPositioning}
          simulation={simulationHandlers}
        />
        {layoutMode === 'MANUAL' && <NodeDrawer nodes={unplacedNodes} />}
        {layoutMode === 'AUTOMATIC' && (
          <SimulationPanel
            simulationEnabled={simulation.simulationEnabled}
            onToggle={simulation.toggleSimulation}
            dragConstraints={interfaceRef}
          />
        )}
        <CollapsablePrompts dragConstraints={interfaceRef} />
      </div>
    </DndStoreProvider>
  );
};

export default Sociogram;
