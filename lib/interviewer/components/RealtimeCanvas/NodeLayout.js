import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { find, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import LayoutContext from '../../contexts/LayoutContext';
import { get } from '../../utils/lodash-replacements';
import LayoutNode from './LayoutNode';
import { getTwoModeLayoutVariable } from './utils';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { compose } from '@reduxjs/toolkit';
import withBounds from '../../behaviours/withBounds';
import { DropTarget } from '../../behaviours/DragAndDrop';
import { useDispatch } from 'react-redux';

const NodeLayout = forwardRef(function NodeLayout(props, forwardedRef) {

  /**
   * This handles merging the ref passed to the component with the ref
   * to the actual DOM node.
   */
  const innerRef = useRef(null);
  useImperativeHandle(forwardedRef, () => innerRef.current);

  const { highlightAttribute } = props;

  const dispatch = useDispatch();
  const toggleHighlight = (uid, attributes) => dispatch(sessionActions.toggleNodeAttributes(uid, attributes));
  const toggleEdge = (modelData, attributeData) => dispatch(sessionActions.toggleEdge(modelData, attributeData));
  const updateNode = (uid, modelData, attributeData) => dispatch(sessionActions.updateNode(uid, modelData, attributeData));

  const {
    network: { nodes },
    screen,
  } = useContext(LayoutContext);

  const layoutEls = useRef([]);

  useEffect(() => {
    if (!innerRef.current) {
      return;
    }

    const currentScreen = screen.current;
    currentScreen.initialize(innerRef.current);

    return () => {
      currentScreen.destroy();
    }
  })

  useEffect(() => {
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
    }
  }, [nodes]);

  return (
    <div className="node-layout" ref={innerRef}>
      {nodes.map((node, index) => {
        const portalTarget = layoutEls.current[index];

        if (!portalTarget) {
          return null;
        }

        return (
          <LayoutNode
            node={node}
            portal={portalTarget}
            index={index}
            key={`${node[entityPrimaryKeyProperty]}_${index}`}
          />
        )
      })}
    </div>
  )
});

export default compose(
  DropTarget,
)(NodeLayout);