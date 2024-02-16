import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { find, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import LayoutContext from '../../contexts/LayoutContext';
import { get } from '../../utils/lodash-replacements';
import LayoutNode from './LayoutNode';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { compose, withHandlers, withState } from 'recompose';
import { DropTarget } from '../../behaviours/DragAndDrop';
import withBounds from '../../behaviours/withBounds';
import { store } from '../../store';
import { getTwoModeLayoutVariable } from './utils';

const NodeLayout = forwardRef(function NodeLayout(props, forwardedRef) {
  const innerRef = useRef(null); // Ref to NodeLayout DOM node
  const layoutEls = useRef([]); // Ref for layout DOM nodes outside of react
  const animationFrameRef = useRef(); // Ref for storing animation frame

  /**
   * This handles merging the ref passed to the component with the ref
   * to the actual DOM node.
   */
  useImperativeHandle(forwardedRef, () => innerRef.current);

  const { highlightAttribute, connectFrom, allowPositioning, originRestriction, destinationRestriction, updateNode, onSelected } = props;

  // LayoutContext provides screen position and other layout information
  const {
    network: { nodes, layout },
    twoMode,
    allowAutomaticLayout,
    simulation,
    screen,
    getPosition,
  } = useContext(LayoutContext);



  const updateNodePositions = useCallback(() => {
    layoutEls.current.forEach((el, index) => {
      const relativePosition = getPosition.current(index);
      if (!relativePosition) {
        return;
      }

      const screenPosition = screen.current.calculateScreenCoords(relativePosition);

      el.style.left = `${screenPosition.x}px`;
      el.style.top = `${screenPosition.y}px`;
      el.style.display = 'block';
    });

    animationFrameRef.current = requestAnimationFrame(updateNodePositions);
  }, [screen, getPosition]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateNodePositions);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [updateNodePositions]);

  useEffect(() => {
    if (!innerRef.current) {
      return;
    }

    const currentScreen = screen.current;
    currentScreen.initialize(innerRef.current);

    return () => {
      currentScreen.destroy();
    }
  }, [screen]);

  useEffect(() => {
    if (
      layoutEls.current.length > 0 &&
      layoutEls.current.length === nodes.length
    ) {
      return;
    }

    layoutEls.current = nodes.map(() => {
      const nodeEl = document.createElement('div');
      nodeEl.style.position = 'absolute';
      nodeEl.style.transform = 'translate(-50%, -50%)';
      nodeEl.style.display = 'none';

      innerRef.current.append(nodeEl);

      return nodeEl;
    });

    return () => {
      layoutEls.current.forEach((el) => {
        el.remove();
      });

      layoutEls.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Can't include `nodes` here as it is mutated by the drag and drop system

  /**
   * A node is disabled if type is the same as originRestriction, UNLESS there is 
   * a connectFrom (in which case we need to check if the node is the origin)
   */
  const isDisabled = (node) => {
    if (!connectFrom && originRestriction && node.type === originRestriction) {
      return true;
    }

    // Not disabled if we aren't linking, or if the node is the origin
    if (!connectFrom || connectFrom === node[entityPrimaryKeyProperty]) {
      return false;
    }

    const originType = find(nodes, [
      entityPrimaryKeyProperty,
      connectFrom,
    ]).type;
    const thisType = get(node, 'type');

    if (destinationRestriction === 'same') {
      return thisType !== originType;
    }

    if (destinationRestriction === 'different') {
      return thisType === originType;
    }

    return false;
  }

  const handleSelectNode = (node) => {
    if (isDisabled(node)) {
      return;
    }

    onSelected(node);
  }

  const handleDrag = useCallback((uuid, index, delta, isDragEnd) => {
    if (!allowPositioning) {
      return;
    }

    const relativeDelta = screen.current.calculateRelativeCoords(delta);

    if (allowAutomaticLayout) {
      if (simulation.simulationEnabled) {
        if (isDragEnd) {
          simulation.releaseNode(index);
          return;
        }

        simulation.moveNode(relativeDelta, index);
        return;
      }
    }

    const nodeType = get(nodes, [index, 'type']);
    const layoutVariable = getTwoModeLayoutVariable(twoMode, nodeType, layout);

    updateNode(uuid, undefined, {
      [layoutVariable]: relativeDelta,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, simulation, allowAutomaticLayout, layout, twoMode, updateNode, allowPositioning]); // Can't include `nodes` here as it is mutated by the drag and drop system


  return (
    <div className="node-layout" ref={innerRef}>
      {nodes.map((node, index) => {
        const portalTarget = layoutEls.current[index];

        if (!portalTarget) {
          return null;
        }

        const isLinking = get(node, entityPrimaryKeyProperty) === connectFrom;
        const isHighlighted = !isEmpty(highlightAttribute) &&
          get(node, [entityAttributesProperty, highlightAttribute], false) === true;

        return (
          <LayoutNode
            node={node}
            portal={portalTarget}
            index={index}
            key={`${node[entityPrimaryKeyProperty]}_${index}`}
            linking={isLinking}
            selected={isHighlighted}
            onSelected={handleSelectNode}
            onDragStart={handleDrag}
            onDragMove={handleDrag}
            onDragEnd={handleDrag}
          />
        )
      })}
    </div>
  )
});

const relativeCoords = (container, node) => ({
  x: (node.x - container.x) / container.width,
  y: (node.y - container.y) / container.height,
});

const withConnectFrom = withState('connectFrom', 'setConnectFrom', null);

const withConnectFromHandler = withHandlers({
  handleConnectFrom: ({ setConnectFrom }) => (id) => {
    if (id === null) {
      store.dispatch({
        type: 'STOP_SOUND',
        sound: 'link',
      });
    } else {
      store.dispatch({
        type: 'PLAY_SOUND',
        sound: 'link',
      });
    }

    setConnectFrom(id);
  },
  handleResetConnectFrom: ({ setConnectFrom }) => () => setConnectFrom(null),
});

const withDropHandlers = withHandlers({
  accepts: () => ({ meta }) => meta.itemType === 'POSITIONED_NODE',
  onDrop: ({
    updateNode, layout, twoMode, width, height, x, y,
  }) => (item) => {
    const layoutVariable = twoMode ? layout[item.meta.type] : layout;
    updateNode(
      item.meta[entityPrimaryKeyProperty],
      {},
      {
        [layoutVariable]: relativeCoords({
          width, height, x, y,
        }, item),
      },
    );
  },
});

const withSelectHandlers = compose(
  withHandlers({
    connectNode: ({
      nodes,
      createEdge,
      connectFrom,
      handleConnectFrom,
      toggleEdge,
      originRestriction,
    }) => (nodeId) => {
      // If edge creation is disabled, return
      if (!createEdge) { return; }

      // If the target and source node are the same, deselect
      if (connectFrom === nodeId) {
        handleConnectFrom(null);
        return;
      }

      // If there isn't a target node yet, and the type isn't restricted,
      // set the selected node into the linking state
      if (!connectFrom) {
        const nodeType = get(nodes, [nodeId, 'type']);

        // If the node type is restricted, return
        if (originRestriction && nodeType === originRestriction) { return; }

        handleConnectFrom(nodeId);
        return;
      }

      // Either add or remove an edge
      if (connectFrom !== nodeId) {
        toggleEdge({
          from: connectFrom,
          to: nodeId,
          type: createEdge,
        });
      }

      // Reset the node linking state
      handleConnectFrom(null);
    },
    toggleHighlightAttribute: ({
      allowHighlighting, highlightAttribute, toggleHighlight,
    }) => (node) => {
      if (!allowHighlighting) { return; }
      const newVal = !node[entityAttributesProperty][highlightAttribute];
      toggleHighlight(
        node[entityPrimaryKeyProperty],
        { [highlightAttribute]: newVal },
      );
    },
  }),
  withHandlers({
    onSelected: ({
      allowHighlighting,
      connectNode,
      toggleHighlightAttribute,
    }) => (node) => {
      if (!allowHighlighting) {
        connectNode(node[entityPrimaryKeyProperty]);
      } else {
        toggleHighlightAttribute(node);
      }
    },
  }),
);

const mapDispatchToProps = {
  toggleHighlight: sessionActions.toggleNodeAttributes,
  toggleEdge: sessionActions.toggleEdge,
  updateNode: sessionActions.updateNode,
};

export default compose(
  withConnectFrom,
  withConnectFromHandler,
  connect(null, mapDispatchToProps),
  withBounds,
  withDropHandlers,
  withSelectHandlers,
  DropTarget,
)(NodeLayout);