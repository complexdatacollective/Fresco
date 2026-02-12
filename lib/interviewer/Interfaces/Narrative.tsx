/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import { entityAttributesProperty } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ConvexHulls from '~/lib/interviewer/components/Canvas/ConvexHulls';
import NodeLayout from '~/lib/interviewer/components/Canvas/NodeLayout';
import { type StageProps } from '~/lib/interviewer/components/Stage';
import Background from '../components/Canvas/Background';
import Canvas from '../components/Canvas/Canvas';
import NarrativeEdgeLayout from '../components/Canvas/NarrativeEdgeLayout';
import PresetSwitcher from '../components/Canvas/PresetSwitcher';
import Annotations from '~/lib/interviewer/components/Canvas/Annotations';
import { LayoutProvider } from '../contexts/LayoutContext';
import { edgesToCoords } from '../selectors/canvas';
import { getNetworkEdges, getNetworkNodes } from '../selectors/session';

const Narrative = ({ stage }: StageProps) => {
  const nodes = useSelector(getNetworkNodes);
  const edges = useSelector(getNetworkEdges);

  const [presetIndex, setPresetIndex] = useState(0);
  const [showConvexHulls, setShowConvexHulls] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showHighlightedNodes, setShowHighlightedNodes] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [activeAnnotations, setActiveAnnotations] = useState(false);
  const [activeFocusNodes, setActiveFocusNodes] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const annotationLayer = useRef<any>(null);

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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

  // Stage properties accessed via get() since stage is a union type
  const presets = get(stage, 'presets', []);
  const currentPreset = presets[presetIndex];

  // Behaviour Configuration
  const allowRepositioning = get(stage, 'behaviours.allowRepositioning', false);
  const freeDraw = get(stage, 'behaviours.freeDraw', false);
  const shouldShowResetButton = activeAnnotations || activeFocusNodes;

  // Display Properties
  const layoutVariable = get(currentPreset, 'layoutVariable');
  const displayEdges = showEdges ? get(currentPreset, 'edges.display', []) : [];
  const highlight = get(currentPreset, 'highlight', []);
  const convexHullVariable = showConvexHulls
    ? get(currentPreset, 'groupVariable', '')
    : '';

  // Background Configuration
  const backgroundImage = get(stage, 'background.image');
  const concentricCircles = get(stage, 'background.concentricCircles');
  const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

  // NodeLayout and ConvexHulls should only be passed nodes that have the layoutVariable set
  const nodesWithLayout = layoutVariable
    ? nodes.filter((node) => node[entityAttributesProperty][layoutVariable])
    : [];

  // EdgeLayout should only be passed edges in the presets edges.display list
  const filteredEdges = edges.filter((edge) =>
    displayEdges.includes(edge.type),
  );
  const edgesWithCoords = edgesToCoords(filteredEdges, {
    nodes: nodesWithLayout,
    layout: layoutVariable,
  });

  return (
    <div className="narrative-interface">
      <div className="narrative-interface__canvas" id="sociogram-canvas">
        <LayoutProvider
          layout={layoutVariable}
          nodes={nodesWithLayout}
          edges={edgesWithCoords}
          twoMode={false}
          allowAutomaticLayout={false}
        >
          <Canvas
            className="narrative-concentric-circles"
            key={`circles-${currentPreset?.id}`}
          >
            <Background
              concentricCircles={concentricCircles}
              skewedTowardCenter={skewedTowardCenter}
              image={backgroundImage}
            />
            <ConvexHulls
              nodes={nodesWithLayout}
              groupVariable={convexHullVariable}
              layoutVariable={layoutVariable}
            />
            <NarrativeEdgeLayout edges={edgesWithCoords} />
            {freeDraw && (
              <Annotations
                ref={annotationLayer}
                isFrozen={isFrozen}
                onChangeActiveAnnotations={handleChangeActiveAnnotations}
              />
            )}
            <NodeLayout
              id="NODE_LAYOUT"
              highlightAttribute={
                showHighlightedNodes ? highlight[highlightIndex] : null
              }
              layoutVariable={layoutVariable}
              allowPositioning={allowRepositioning}
            />
          </Canvas>
          <PresetSwitcher
            id="drop-obstacle"
            presets={presets}
            activePreset={presetIndex}
            highlightIndex={highlightIndex}
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
          />
        </LayoutProvider>
      </div>
    </div>
  );
};

export default Narrative;
