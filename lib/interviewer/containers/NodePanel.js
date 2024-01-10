import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import customFilter from '~/lib/network-query/filter';
import {
  getNetworkNodesForOtherPrompts,
  getNetworkNodesForPrompt,
} from '../selectors/interface';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { get } from '../utils/lodash-replacements';
import withExternalData from './withExternalData';

class NodePanel extends PureComponent {
  componentDidMount() {
    this.sendNodesUpdate();
  }

  componentDidUpdate(prevProps) {
    const { nodes } = this.props;
    if (prevProps.nodes.length !== nodes.length) {
      this.sendNodesUpdate();
    }
  }

  // Because the index is used to determine whether node originated in this list
  // we need to supply an index for the unfiltered list for externalData.
  fullNodeIndex = () => {
    const { dataSource, externalData, nodes } = this.props;
    const externalNodes = get(externalData, 'nodes', []);
    const allNodes = dataSource === 'existing' ? nodes : externalNodes;

    return new Set(allNodes.map((node) => node[entityPrimaryKeyProperty]));
  };

  // This can use the displayed nodes for a count as it is used to see whether the panel
  // is 'empty'
  nodeDisplayCount = () => {
    const { nodes } = this.props;
    return nodes.length;
  };

  sendNodesUpdate = () => {
    const { onUpdate } = this.props;
    onUpdate(this.nodeDisplayCount(), this.fullNodeIndex());
  };

  handleDrop = (item) => {
    const { onDrop, dataSource } = this.props;

    return onDrop(item, dataSource);
  };

  render = () => {
    const { title, highlight, id, listId, minimize, nodes, ...nodeListProps } =
      this.props;

    return (
      <Panel title={title} highlight={highlight} minimize={minimize}>
        <NodeList
          {...nodeListProps}
          items={nodes}
          listId={listId}
          id={id}
          itemType="NEW_NODE"
          onDrop={this.handleDrop}
        />
      </Panel>
    );
  };
}

const getNodeId = (node) => node[entityPrimaryKeyProperty];

const getNodes = (state, props) => {
  const nodesForPrompt = getNetworkNodesForPrompt(state, props);
  const nodesForOtherPrompts = getNetworkNodesForOtherPrompts(state, props);
  const nodeIds = {
    prompt: nodesForPrompt.map(getNodeId),
    other: nodesForOtherPrompts.map(getNodeId),
  };

  const notInSet = (set) => (node) => !set.has(node[entityPrimaryKeyProperty]);

  if (props.dataSource === 'existing') {
    const nodes = nodesForOtherPrompts.filter(
      notInSet(new Set(nodeIds.prompt)),
    );

    return nodes;
  }

  if (!props.externalData) {
    return [];
  }

  const nodes = get(props.externalData, 'nodes', []).filter(
    notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])),
  );
  return nodes;
};

const mapStateToProps = (state, props) => {
  const nodes = getNodes(state, props);

  const nodeFilter = props.filter;
  if (nodeFilter && typeof nodeFilter !== 'function') {
    const filterFunction = customFilter(nodeFilter);
    return filterFunction({
      nodes,
      edges: getNetworkEdges(state, props),
      ego: getNetworkEgo(state, props),
    });
  }

  return {
    nodes,
  };
};

export { NodePanel };

export default compose(
  withExternalData('externalDataSource', 'externalData'),
  connect(mapStateToProps),
)(NodePanel);
