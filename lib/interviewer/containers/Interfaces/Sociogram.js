import { bindActionCreators } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import PropTypes from 'prop-types';
import { useMemo, useRef, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import useTimeout from '~/lib/ui/hooks/useTimeout';
import withPrompt from '../../behaviours/withPrompt';
import Canvas from '../../components/Canvas/Canvas';
import EdgeLayout from '../../components/Canvas/EdgeLayout';
import SimulationPanel from '../../components/Canvas/SimulationPanel';
import CollapsablePrompts from '../../components/CollapsablePrompts';
import { LayoutProvider } from '../../contexts/LayoutContext';
import { actionCreators as resetActions } from '../../ducks/modules/reset';
import {
  getEdges,
  getNextUnplacedNode,
  getNodes,
  getPlacedNodes,
} from '../../selectors/canvas';
import { getAssetUrlFromId } from '../../selectors/protocol';
import Background from '../Canvas/Background';
import NodeBucket from '../Canvas/NodeBucket';
import NodeLayout from '../Canvas/NodeLayout';

const withResetInterfaceHandler = withHandlers({
  handleResetInterface:
    ({ resetPropertyForAllNodes, resetEdgesOfType, prompts }) =>
    () => {
      prompts.forEach((prompt) => {
        if (prompt.edges) {
          resetEdgesOfType(prompt.edges.creates);
        }

        const layoutVariable = get(prompt, 'layout.layoutVariable', null);
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
    },
});

/**
 * Sociogram Interface
 * @extends Component
 */
const Sociogram = (props) => {
  const {
    prompt,
    stage,
    handleResetInterface,
    promptIndex,
    registerBeforeNext,
  } = props;

  const interfaceRef = useRef(null);
  const dragSafeRef = useRef(null);
  const twoMode = useMemo(() => Array.isArray(stage.subject), [stage.subject]);

  const getAssetUrl = useSelector(getAssetUrlFromId);

  // Behaviour Configuration
  const allowHighlighting = prompt?.highlight?.allowHighlighting ?? false;
  const createEdge = prompt?.edges?.create ?? null;
  const allowPositioning = prompt?.layout?.allowPositioning ?? true;

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
  const backgroundImage = getAssetUrl(stage.background.image) ?? null;
  const concentricCircles = get(stage, 'background.concentricCircles');
  const skewedTowardCenter = get(stage, 'background.skewedTowardCenter');

  const allNodes = useSelector((state) => getNodes(state, props));
  const placedNodes = useSelector((state) => getPlacedNodes(state, props));
  const nextUnplacedNode = useSelector((state) =>
    getNextUnplacedNode(state, props),
  );

  const nodes = allowAutomaticLayout ? allNodes : placedNodes;
  const edges = useSelector((state) => getEdges(state, props));

  /**
   * Hack to force the node layout to re-render after the interface has finished
   * animating in. This is necessary because withBounds calculates the
   * boundingClientRect of the interface, which has an incorrect y value when
   * the stage is animating in. Should be removed after we refactor!
   */
  const [ready, setReady] = useState(false);
  useTimeout(() => {
    setReady(true);
  }, 750); // This value is just a guess based on the animation duration!

  /**
   * When using automatic layout, the layout is only stored when it completely
   * 'settles'. If the user clicks next before this, there is no layout
   * variable. Aside from data issues, this creates a particularly problem
   * where the narrative interface is blank, because it requires a layout and
   * doesn't create one itself.
   *
   * To prevent this, we block progression until the layout is complete.
   */
  const [layoutReady, setLayoutReady] = useState(
    allowAutomaticLayout ? false : true,
  );

  registerBeforeNext(() => layoutReady);

  return (
    <div className="sociogram-interface" ref={interfaceRef}>
      <div className="sociogram-interface__drag-safe" ref={dragSafeRef} />
      <CollapsablePrompts
        prompts={stage.prompts}
        currentPromptIndex={promptIndex}
        handleResetInterface={handleResetInterface}
        dragConstraints={dragSafeRef}
      />
      <div className="sociogram-interface__concentric-circles">
        <LayoutProvider
          layout={layoutVariable}
          twoMode={twoMode}
          nodes={nodes}
          edges={edges}
          allowAutomaticLayout={allowAutomaticLayout}
          onLayoutComplete={() => setLayoutReady(true)}
        >
          <Canvas className="concentric-circles" id="concentric-circles">
            <Background
              concentricCircles={concentricCircles}
              skewedTowardCenter={skewedTowardCenter}
              image={backgroundImage}
            />
            <EdgeLayout />
            <NodeLayout
              key={ready}
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

Sociogram.propTypes = {
  stage: PropTypes.object.isRequired,
  prompt: PropTypes.object.isRequired,
  prompts: PropTypes.array.isRequired,
  handleResetInterface: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  resetEdgesOfType: bindActionCreators(resetActions.resetEdgesOfType, dispatch),
  resetPropertyForAllNodes: bindActionCreators(
    resetActions.resetPropertyForAllNodes,
    dispatch,
  ),
});

export default compose(
  withPrompt,
  connect(null, mapDispatchToProps),
  withResetInterfaceHandler,
)(Sociogram);
