import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompose';
import { DropTarget } from '../../behaviours/DragAndDrop/DropTarget';
import withBounds from '../../behaviours/withBounds';
import NodeLayout from '../../components/Canvas/NodeLayout';
import { actionCreators as sessionsActions } from '../../ducks/modules/session';
import { store } from '../../store';

const relativeCoords = (container, node) => ({
  x: (node.x - container.x) / container.width,
  y: (node.y - container.y) / container.height,
});

const withConnectFrom = withState('connectFrom', 'setConnectFrom', null);

const withConnectFromHandler = withHandlers({
  handleConnectFrom:
    ({ setConnectFrom }) =>
    (id) => {
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
  handleResetConnectFrom:
    ({ setConnectFrom }) =>
    () =>
      setConnectFrom(null),
});

const withDropHandlers = withHandlers({
  accepts:
    () =>
    ({ meta }) =>
      meta.itemType === 'POSITIONED_NODE',
  onDrop:
    ({ updateNode, layout, twoMode, width, height, x, y }) =>
    (item) => {
      const layoutVariable = twoMode ? layout[item.meta.type] : layout;

      updateNode(
        item.meta[entityPrimaryKeyProperty],
        {},
        {
          [layoutVariable]: relativeCoords(
            {
              width,
              height,
              x,
              y,
            },
            item,
          ),
        },
      );
    },
});

const withSelectHandlers = compose(
  withHandlers({
    connectNode:
      ({
        nodes,
        createEdge,
        connectFrom,
        handleConnectFrom,
        toggleEdge,
        originRestriction,
      }) =>
      (nodeId) => {
        // If edge creation is disabled, return
        if (!createEdge) {
          return;
        }

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
          if (originRestriction && nodeType === originRestriction) {
            return;
          }

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
    toggleHighlightAttribute:
      ({ allowHighlighting, highlightAttribute, toggleHighlight }) =>
      (node) => {
        if (!allowHighlighting) {
          return;
        }
        const newVal = !node[entityAttributesProperty][highlightAttribute];
        toggleHighlight(node[entityPrimaryKeyProperty], {
          [highlightAttribute]: newVal,
        });
      },
  }),
  withHandlers({
    onSelected:
      ({ allowHighlighting, connectNode, toggleHighlightAttribute }) =>
      (node) => {
        if (!allowHighlighting) {
          connectNode(node[entityPrimaryKeyProperty]);
        } else {
          toggleHighlightAttribute(node);
        }
      },
  }),
);

const mapDispatchToProps = {
  toggleHighlight: sessionsActions.toggleNodeAttributes,
  toggleEdge: sessionsActions.toggleEdge,
  updateNode: sessionsActions.updateNode,
};

// Create a wrapper component that uses the new DropTarget
const NodeLayoutWithDropTarget = (props) => {
  const { accepts, onDrop, ...restProps } = props;
  
  return (
    <DropTarget
      id="node-layout"
      accepts={accepts}
      onDrop={onDrop}
    >
      {(elementRef, _dropState) => (
        <NodeLayout
          {...restProps}
          ref={elementRef}
        />
      )}
    </DropTarget>
  );
};

export default compose(
  withConnectFrom,
  withConnectFromHandler,
  connect(null, mapDispatchToProps),
  withBounds,
  withDropHandlers,
  withSelectHandlers,
)(NodeLayoutWithDropTarget);
