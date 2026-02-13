'use client';

import { bindActionCreators } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import useTimeout from '~/lib/legacy-ui/hooks/useTimeout';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../behaviours/withPrompt';
import Background from '../components/Canvas/Background';
import Canvas from '../components/Canvas/Canvas';
import EdgeLayout from '../components/Canvas/EdgeLayout';
import NodeBucket from '../components/Canvas/NodeBucket';
import NodeLayout from '../components/Canvas/NodeLayout';
import SimulationPanel from '../components/Canvas/SimulationPanel';
import CollapsablePrompts from '../components/CollapsablePrompts';
import { type StageProps } from '../components/Stage';
import { LayoutProvider } from '../contexts/LayoutContext';
import { getAssetUrlFromId } from '../ducks/modules/protocol';
import { actionCreators as resetActions } from '../ducks/modules/reset';
import usePropSelector from '../hooks/usePropSelector';
import { useAppDispatch } from '../store';
import {
  getEdges,
  getNextUnplacedNode,
  getNodes,
  getPlacedNodes,
} from '../selectors/canvas';

const Sociogram = (stageProps: StageProps) => {
  const { stage, registerBeforeNext } = stageProps;
  const { prompt, prompts, promptIndex } = usePrompts();
  const dispatch = useAppDispatch();

  const { resetEdgesOfType, resetPropertyForAllNodes } = useMemo(
    () =>
      bindActionCreators(
        {
          resetEdgesOfType: resetActions.resetEdgesOfType,
          resetPropertyForAllNodes: resetActions.resetPropertyForAllNodes,
        },
        dispatch,
      ),
    [dispatch],
  );

  const handleResetInterface = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prompts.forEach((p: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (p.edges) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        resetEdgesOfType(p.edges.creates);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const layoutVariable = get(p, 'layout.layoutVariable', null);
      if (!layoutVariable) {
        return;
      }

      if (typeof layoutVariable === 'string') {
        resetPropertyForAllNodes(layoutVariable);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.keys(layoutVariable).forEach((type) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          resetPropertyForAllNodes(layoutVariable[type]);
        });
      }
    });
  }, [prompts, resetEdgesOfType, resetPropertyForAllNodes]);

  const interfaceRef = useRef(null);
  const dragSafeRef = useRef(null);
  const twoMode = useMemo(() => Array.isArray(get(stage, 'subject')), [stage]);

  const getAssetUrl = useSelector(getAssetUrlFromId);

  // Behaviour Configuration
  const allowHighlighting = get(prompt, 'highlight.allowHighlighting', false);
  const createEdge = get(prompt, 'edges.create', null);
  const allowPositioning = get(prompt, 'layout.allowPositioning', true);

  const allowAutomaticLayout = get(
    stage,
    'behaviours.automaticLayout.enabled',
    false,
  );
  const destinationRestriction = get(
    prompt,
    'edges.restrict.destination',
    null,
  );
  const originRestriction = get(prompt, 'edges.restrict.origin', null);

  // Display Properties
  const layoutVariable = get(prompt, 'layout.layoutVariable');
  const highlightAttribute = get(prompt, 'highlight.variable');

  // Background Configuration
  const bgImageId = get(stage, 'background.image', '');
  const backgroundImage = bgImageId ? (getAssetUrl(bgImageId) ?? null) : null;
  const concentricCircles = get(stage, 'background.concentricCircles');
  const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

  // Build props object for legacy selectors that require (state, props)
  const selectorProps = useMemo(
    () => ({ ...stageProps, prompt, prompts, promptIndex }),
    [stageProps, prompt, prompts, promptIndex],
  );

  const allNodes = usePropSelector(getNodes, selectorProps);
  const placedNodes = usePropSelector(getPlacedNodes, selectorProps);
  const nextUnplacedNode = usePropSelector(getNextUnplacedNode, selectorProps);

  const nodes = allowAutomaticLayout ? allNodes : placedNodes;
  const edges = usePropSelector(getEdges, selectorProps);

  /**
   * Hack to force the node layout to re-render after the interface has finished
   * animating in. This is necessary because withBounds calculates the
   * boundingClientRect of the interface, which has an incorrect y value when
   * the stage is animating in. Should be removed after we refactor!
   */
  const [ready, setReady] = useState(false);
  useTimeout(() => {
    setReady(true);
  }, 750);

  /**
   * When using automatic layout, the layout is only stored when it completely
   * 'settles'. If the user clicks next before this, there is no layout
   * variable. To prevent this, we block progression until the layout is complete.
   */
  const [layoutReady, setLayoutReady] = useState(
    allowAutomaticLayout ? false : true,
  );

  const onLayoutComplete = useCallback(() => {
    setLayoutReady(true);
  }, []);

  registerBeforeNext(() => layoutReady);

  return (
    <div className="interface" ref={interfaceRef}>
      <div className="sociogram-interface__drag-safe" ref={dragSafeRef} />
      <CollapsablePrompts
        prompts={get(stage, 'prompts', [])}
        currentPromptIndex={promptIndex}
        handleResetInterface={handleResetInterface}
        dragConstraints={dragSafeRef}
      />
      <div
        className="sociogram-interface__concentric-circles"
        id="sociogram-canvas"
      >
        <LayoutProvider
          layout={layoutVariable}
          twoMode={twoMode}
          nodes={nodes}
          edges={edges}
          allowAutomaticLayout={allowAutomaticLayout}
          onLayoutComplete={onLayoutComplete}
        >
          <Canvas className="concentric-circles">
            <Background
              concentricCircles={concentricCircles}
              skewedTowardCenter={skewedTowardCenter}
              image={backgroundImage}
            />
            <EdgeLayout />
            <NodeLayout
              key={String(ready)}
              id="NODE_LAYOUT"
              highlightAttribute={highlightAttribute}
              layout={layoutVariable}
              twoMode={twoMode}
              destinationRestriction={destinationRestriction}
              originRestriction={originRestriction}
              allowHighlighting={allowHighlighting && !createEdge}
              allowPositioning={allowPositioning}
              createEdge={createEdge}
            />
            <NodeBucket
              id="NODE_BUCKET"
              allowPositioning={allowPositioning}
              node={nextUnplacedNode}
            />
            <SimulationPanel dragConstraints={dragSafeRef} />
          </Canvas>
        </LayoutProvider>
      </div>
    </div>
  );
};

Sociogram.displayName = 'Sociogram';

export default withNoSSRWrapper(Sociogram);
