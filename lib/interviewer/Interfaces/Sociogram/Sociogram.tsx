'use client';

import { type Stage } from '@codaco/protocol-validation';
import { bindActionCreators } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import ConcentricCircles from '~/lib/interviewer/components/ConcentricCircles';
import { usePrompts } from '../../components/Prompts/usePrompts';
import { type StageProps } from '../../components/Stage';
import { getAssetUrlFromId } from '../../ducks/modules/protocol';
import { actionCreators as resetActions } from '../../ducks/modules/reset';
import {
  getEdges,
  getNextUnplacedNode,
  getNodes,
  getPlacedNodes,
} from '../../selectors/canvas';
import { useAppDispatch } from '../../store';
import CollapsablePrompts from './CollapsablePrompts';
import SimulationPanel from './SimulationPanel';

type SociogramProps = StageProps & {
  stage: Extract<Stage, { type: 'Sociogram' }>;
};

const Sociogram = (stageProps: SociogramProps) => {
  const { stage } = stageProps;
  const { prompt, prompts } = usePrompts<(typeof stage.prompts)[number]>();
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
    prompts.forEach((p) => {
      if ('edges' in p && p.edges?.create) {
        resetEdgesOfType(p.edges.create);
      }

      const layoutVariable = get(p, 'layout.layoutVariable', null);
      if (!layoutVariable) {
        return;
      }

      if (typeof layoutVariable === 'string') {
        resetPropertyForAllNodes(layoutVariable);
      } else {
        Object.keys(layoutVariable).forEach((type) => {
          resetPropertyForAllNodes(layoutVariable[type]);
        });
      }
    });
  }, [prompts, resetEdgesOfType, resetPropertyForAllNodes]);

  const interfaceRef = useRef(null);

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
  const nextUnplacedNode = useSelector(getNextUnplacedNode);

  const nodes = layoutMode === 'AUTOMATIC' ? allNodes : placedNodes;
  const edges = useSelector(getEdges);

  return (
    <div className="interface h-dvh overflow-hidden" ref={interfaceRef}>
      {layoutMode === 'AUTOMATIC' && (
        <SimulationPanel dragConstraints={interfaceRef} />
      )}
      <CollapsablePrompts dragConstraints={interfaceRef} />
      {backgroundImage ? (
        <img src={backgroundImage} className="size-full" alt="Background" />
      ) : (
        <ConcentricCircles n={concentricCircles} skewed={skewedTowardCenter} />
      )}
    </div>
  );
};

export default Sociogram;
