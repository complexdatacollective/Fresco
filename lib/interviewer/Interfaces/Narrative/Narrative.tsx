'use client';

import { type Stage } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Canvas from '~/lib/interviewer/canvas/Canvas';
import { createCanvasStore } from '~/lib/interviewer/canvas/useCanvasStore';
import ConcentricCircles from '~/lib/interviewer/components/ConcentricCircles';
import { type StageProps } from '~/lib/interviewer/components/Stage';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import Annotations, {
  type AnnotationsHandle,
} from '~/lib/interviewer/Interfaces/Narrative/Annotations';
import ConvexHullLayer from '~/lib/interviewer/Interfaces/Narrative/ConvexHullLayer';
import PresetSwitcher from '~/lib/interviewer/Interfaces/Narrative/PresetSwitcher';
import {
  getCategoricalOptions,
  getNetworkEdges,
  getNetworkNodes,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch, type RootState } from '~/lib/interviewer/store';

type NarrativeStage = Extract<Stage, { type: 'Narrative' }>;

type NarrativeProps = StageProps & {
  stage: NarrativeStage;
};

const Narrative = ({ stage }: NarrativeProps) => {
  const dispatch = useAppDispatch();
  const nodes = useSelector(getNetworkNodes);
  const edges = useSelector(getNetworkEdges);
  const interfaceRef = useRef<HTMLDivElement>(null);

  const [presetIndex, setPresetIndex] = useState(0);
  const [showConvexHulls, setShowConvexHulls] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showHighlightedNodes, setShowHighlightedNodes] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [activeAnnotations, setActiveAnnotations] = useState(false);
  const [activeFocusNodes, setActiveFocusNodes] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const annotationLayer = useRef<AnnotationsHandle>(null);

  // Zustand store for real-time positions
  const storeRef = useRef(createCanvasStore());
  const store = storeRef.current;

  const handleChangeActiveAnnotations = useCallback((status: boolean) => {
    setActiveAnnotations(status);
  }, []);

  const handleToggleHulls = useCallback(() => {
    setShowConvexHulls((prev) => !prev);
  }, []);

  const handleToggleEdges = useCallback(() => {
    setShowEdges((prev) => !prev);
  }, []);

  const handleToggleHighlighting = useCallback(() => {
    setShowHighlightedNodes((prev) => !prev);
  }, []);

  const handleChangeHighlightIndex = useCallback((index: number) => {
    setHighlightIndex(index);
  }, []);

  const handleToggleFreeze = useCallback(() => {
    setIsFrozen((prev) => !prev);
  }, []);

  const handleResetInteractions = useCallback(() => {
    annotationLayer.current?.reset();
  }, []);

  const handleChangePreset = useCallback(
    (index: number) => {
      if (index !== presetIndex) {
        setShowConvexHulls(true);
        setShowEdges(true);
        setShowHighlightedNodes(true);
        setHighlightIndex(0);
        setPresetIndex(index);
        setActiveAnnotations(false);
        setActiveFocusNodes(false);
      }
    },
    [presetIndex],
  );

  // Stage properties
  const { presets } = stage;
  const currentPreset = presets[presetIndex];

  // Behaviour Configuration
  const allowRepositioning = get(stage, 'behaviours.allowRepositioning', false);
  const freeDraw = get(stage, 'behaviours.freeDraw', false);
  const shouldShowResetButton = activeAnnotations || activeFocusNodes;

  // Display Properties
  const layoutVariable = currentPreset?.layoutVariable ?? '';
  const highlight = currentPreset?.highlight ?? [];
  const convexHullVariable = showConvexHulls
    ? (currentPreset?.groupVariable ?? '')
    : '';

  // Background Configuration
  const concentricCircles = get(stage, 'background.concentricCircles');
  const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

  // Only include nodes that have the layout variable set
  const nodesWithLayout = useMemo(
    () =>
      layoutVariable
        ? nodes.filter((node) => node[entityAttributesProperty][layoutVariable])
        : [],
    [nodes, layoutVariable],
  );

  // Filter edges by display types
  const displayEdgeTypes = currentPreset?.edges?.display;
  const filteredEdges = useMemo(
    () =>
      showEdges && displayEdgeTypes
        ? edges.filter((edge) => displayEdgeTypes.includes(edge.type))
        : [],
    [edges, showEdges, displayEdgeTypes],
  );

  // Sync positions from nodes when layout variable or nodes change
  useEffect(() => {
    store.getState().syncFromNodes(nodesWithLayout, layoutVariable);
  }, [nodesWithLayout, layoutVariable, store]);

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

  // Get categorical options for convex hulls
  const categoricalOptions = useSelector((state: RootState) =>
    getCategoricalOptions(state, {
      variableId: convexHullVariable,
    }),
  ) as { value: number; label: string }[];

  // Highlight attribute
  const highlightAttribute = showHighlightedNodes
    ? (highlight[highlightIndex] ?? undefined)
    : undefined;

  const background = (
    <ConcentricCircles n={concentricCircles} skewed={skewedTowardCenter} />
  );

  const overlays = (
    <>
      {convexHullVariable && (
        <ConvexHullLayer
          store={store}
          nodes={nodesWithLayout}
          groupVariable={convexHullVariable}
          categoricalOptions={categoricalOptions}
        />
      )}
      {freeDraw && (
        <Annotations
          ref={annotationLayer}
          isFrozen={isFrozen}
          onChangeActiveAnnotations={handleChangeActiveAnnotations}
        />
      )}
    </>
  );

  return (
    <div
      className="interface relative h-dvh overflow-hidden"
      ref={interfaceRef}
    >
      <Canvas
        background={background}
        overlays={overlays}
        nodes={nodesWithLayout}
        edges={filteredEdges}
        store={store}
        selectedNodeId={null}
        highlightAttribute={highlightAttribute}
        onNodeDragEnd={handleNodeDragEnd}
        allowRepositioning={allowRepositioning}
        simulation={null}
      />
      <PresetSwitcher
        presets={presets}
        activePreset={presetIndex}
        highlightIndex={highlightIndex}
        showHighlighting={showHighlightedNodes}
        showEdges={showEdges}
        showHulls={showConvexHulls}
        isFrozen={isFrozen}
        shouldShowResetButton={shouldShowResetButton}
        shouldShowFreezeButton={freeDraw}
        onResetInteractions={handleResetInteractions}
        onChangePreset={handleChangePreset}
        onToggleFreeze={handleToggleFreeze}
        onToggleHulls={handleToggleHulls}
        onToggleEdges={handleToggleEdges}
        onChangeHighlightIndex={handleChangeHighlightIndex}
        onToggleHighlighting={handleToggleHighlighting}
        dragConstraints={interfaceRef}
      />
    </div>
  );
};

export default Narrative;
