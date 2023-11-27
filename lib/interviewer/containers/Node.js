import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import UINode from '~/lib/ui/components/Node';
import {
  makeGetNodeLabel, makeGetNodeColor, makeGetNodeTypeDefinition,
} from '../selectors/network';

/**
  * Renders a Node.
  */
class Node extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      color,
      getLabel,
    } = this.props;

    const dynamicLabel = getLabel(this.props);
    return (
      <UINode
        color={color}
        {...this.props}
        label={dynamicLabel}
      />
    );
  }
}

function mapStateToProps(state, props) {
  const getNodeColor = makeGetNodeColor();
  const getNodeTypeDefinition = makeGetNodeTypeDefinition();
  const getNodeLabel = makeGetNodeLabel();

  return {
    color: getNodeColor(state, props),
    nodeTypeDefinition: getNodeTypeDefinition(state, props),
    getLabel: getNodeLabel(state, props),
  };
}

Node.propTypes = {
  type: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  getLabel: PropTypes.func.isRequired,
  nodeTypeDefinition: PropTypes.object,
};

export default connect(mapStateToProps)(Node);

// export default Node;

export { Node };
