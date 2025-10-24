/* eslint-disable no-param-reassign */
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { find, get, isEmpty } from 'es-toolkit/compat';
import PropTypes from 'prop-types';
import React from 'react';
import LayoutContext from '../../contexts/LayoutContext';
import LayoutNode from './LayoutNode';
import { getTwoModeLayoutVariable } from './utils';

export default class NodeLayout extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.updateRAF = undefined;
    this.layoutEls = [];
    this.isDragging = false;
  }

  componentDidMount() {
    this.createLayoutEls();
    this.updateRAF = requestAnimationFrame(() => this.update());

    if (!this.ref.current) {
      return;
    }

    const { screen } = this.context;
    screen.current.initialize(this.ref.current);

    /**
     * This is a hack to work around the screen manager initialising while the
     * stage is still animating in, which causes the screen manager to measure
     * the screen incorrectly. This is a temporary fix until we refactor!
     */
    setTimeout(() => {
      screen.current.measureScreen();
    }, 500);
  }

  componentDidUpdate() {
    const {
      network: { nodes },
    } = this.context;

    if (this.layoutEls.length !== nodes.length) {
      this.createLayoutEls();
    }
  }

  componentWillUnmount() {
    const { screen } = this.context;
    screen.current.destroy();
    cancelAnimationFrame(this.updateRAF);
  }

  createLayoutEls = () => {
    const {
      network: { nodes },
    } = this.context;

    this.layoutEls = nodes.map((_, index) => {
      if (this.layoutEls[index]) {
        return this.layoutEls[index];
      }

      const nodeEl = document.createElement('div');
      nodeEl.style.position = 'absolute';
      nodeEl.style.transform = 'translate(-50%, -50%)';
      nodeEl.style.display = 'none';
      this.ref.current.append(nodeEl);

      return nodeEl;
    });
  };

  update = () => {
    const { getPosition, screen } = this.context;

    this.layoutEls.forEach((el, index) => {
      const relativePosition = getPosition.current(index);
      if (!relativePosition || !el) {
        return;
      }

      const screenPosition =
        screen.current.calculateScreenCoords(relativePosition);
      el.style.left = `${screenPosition.x}px`;
      el.style.top = `${screenPosition.y}px`;
      el.style.display = 'block';
    });

    this.updateRAF = requestAnimationFrame(() => this.update());
  };

  isLinking = (node) => {
    const { connectFrom } = this.props;
    return get(node, entityPrimaryKeyProperty) === connectFrom;
  };

  isHighlighted = (node) => {
    const { highlightAttribute } = this.props;
    return (
      !isEmpty(highlightAttribute) &&
      get(node, [entityAttributesProperty, highlightAttribute], false) === true
    );
  };

  isDisabled = (node) => {
    const { connectFrom, originRestriction, destinationRestriction } =
      this.props;

    const {
      network: { nodes },
    } = this.context;

    // Node is disabled if type is same as originRestriction, unless there is a connectFrom
    // If there is a connectFrom, we need to check other things.
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
  };

  handleDragStart = (uuid, index, delta) => {
    this.isDragging = true;

    const {
      network: { layout, nodes },
      twoMode,
      allowAutomaticLayout,
      simulation,
      screen,
    } = this.context;

    const { updateNode } = this.props;

    const { x, y } = delta;

    const relativeDelta = screen.current.calculateRelativeCoords(delta);

    if (allowAutomaticLayout) {
      const { simulationEnabled, moveNode } = simulation;
      if (simulationEnabled) {
        moveNode(relativeDelta, index);
        return;
      }
    }

    const nodeType = get(nodes, [index, 'type']);
    const layoutVariable = getTwoModeLayoutVariable(twoMode, nodeType, layout);

    updateNode({
      nodeId: uuid,
      newAttributeData: {
        [layoutVariable]: screen.current.calculateRelativeCoords({ x, y }),
      },
    });
  };

  handleDragMove = (uuid, index, delta) => {
    const {
      network: { layout, nodes },
      twoMode,
      allowAutomaticLayout,
      simulation,
      screen,
    } = this.context;

    const { updateNode } = this.props;

    const { x, y } = delta;

    const relativeDelta = screen.current.calculateRelativeCoords(delta);

    if (allowAutomaticLayout) {
      const { simulationEnabled, moveNode } = simulation;
      if (simulationEnabled) {
        moveNode(relativeDelta, index);
        return;
      }
    }

    const nodeType = get(nodes, [index, 'type']);
    const layoutVariable = getTwoModeLayoutVariable(twoMode, nodeType, layout);

    updateNode({
      nodeId: uuid,
      newAttributeData: {
        [layoutVariable]: screen.current.calculateRelativeCoords({ x, y }),
      },
    });
  };

  handleDragEnd = (uuid, index, { x, y }) => {
    const {
      network: { layout, nodes },
      twoMode,
      allowAutomaticLayout,
      simulation,
      screen,
    } = this.context;

    const { updateNode } = this.props;

    if (allowAutomaticLayout) {
      const { simulationEnabled, releaseNode } = simulation;

      if (simulationEnabled) {
        releaseNode(index);
        return;
      }
    }

    const nodeType = get(nodes, [index, 'type']);
    const layoutVariable = getTwoModeLayoutVariable(twoMode, nodeType, layout);

    updateNode({
      nodeId: uuid,
      newAttributeData: {
        [layoutVariable]: screen.current.calculateRelativeCoords({ x, y }),
      },
    });
  };

  // When node is dragged this is called last,
  // we can use that to reset isDragging state
  handleSelected = (...args) => {
    if (this.isDisabled(...args)) {
      return;
    }
    const { onSelected } = this.props;

    if (this.isDragging) {
      this.isDragging = false;
      return;
    }
    onSelected(...args);
  };

  render() {
    const {
      network: { nodes },
    } = this.context;

    const { allowPositioning, allowSelect } = this.props;

    return (
      <>
        <div className="node-layout" ref={this.ref} />
        {nodes.map((node, index) => {
          const el = this.layoutEls[index];
          if (!el) {
            return null;
          }
          return (
            <LayoutNode
              node={node}
              portal={el}
              index={index}
              key={`${node[entityPrimaryKeyProperty]}_${index}`}
              onDragStart={this.handleDragStart}
              onDragMove={this.handleDragMove}
              onDragEnd={this.handleDragEnd}
              allowPositioning={allowPositioning}
              allowSelect={allowSelect}
              onSelected={this.handleSelected}
              selected={this.isHighlighted(node)}
              linking={this.isLinking(node)}
              inactive={this.isDisabled(node)}
            />
          );
        })}
      </>
    );
  }
}

NodeLayout.propTypes = {
  onSelected: PropTypes.func.isRequired,
  allowPositioning: PropTypes.bool,
  allowSelect: PropTypes.bool,
};

NodeLayout.defaultProps = {
  allowPositioning: true,
  allowSelect: true,
};

NodeLayout.contextType = LayoutContext;
