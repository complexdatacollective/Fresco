import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import Panel from '~/lib/interviewer/components/Panel';
import customFilter from '~/lib/network-query/filter';
import { NcNode, type Panel as PanelType } from '~/schemas/network-canvas';
import { DraggableNode } from '../components/Node';
import NodeList from '../components/NodeList';
import usePropSelector from '../hooks/usePropSelector';
import {
  getNetworkNodesForOtherPrompts,
  getNetworkNodesForPrompt,
} from '../selectors/interface';
import { getNetworkEdges, getNetworkEgo } from '../selectors/network';
import { getCurrentStage } from '../selectors/session';
import { get } from '../utils/lodash-replacements';
import withExternalData from './withExternalData';

type NodePanelProps = {
  panel: PanelType;
  highlight: string;
  itemType: string;
  externalData?: unknown[];
  onDrop: (item: any, dataSource: string) => void;
  disableAddNew?: boolean;
};

function NodePanel(props: NodePanelProps) {
  const { panel, highlight, itemType, onDrop, disableAddNew } = props;

  const { dataSource, title } = panel;

  const nodes = usePropSelector(getNodesForPanel, props);

  const handleDrop = (item) => {
    console.log('dropped', item);
    // return onDrop(item, dataSource);
  };

  return (
    <Panel title={title} highlight={highlight}>
      <NodeList
        items={nodes}
        itemType={itemType}
        ItemComponent={DraggableNode}
        accepts={['EXISTING_NODE']}
        onDrop={handleDrop}
        allowDrop={!disableAddNew}
      />
    </Panel>
  );
}

const getNodeId = (node: NcNode) => node[entityPrimaryKeyProperty];

const getNodesForPanel = (state, props: NodePanelProps) => {
  const stage = getCurrentStage(state);
  const nodesForPrompt = getNetworkNodesForPrompt(state, { stage, ...props });
  const nodesForOtherPrompts = getNetworkNodesForOtherPrompts(state, {
    stage,
    ...props,
  });
  const nodeIds = {
    prompt: nodesForPrompt.map(getNodeId),
    other: nodesForOtherPrompts.map(getNodeId),
  };

  const notInSet = (set: Set<string>) => (node: NcNode) =>
    !set.has(node[entityPrimaryKeyProperty]);

  // Existing nodes just shows nodes not on this prompt
  if (props.panel.dataSource === 'existing') {
    const nodes = nodesForOtherPrompts.filter(
      notInSet(new Set(nodeIds.prompt)),
    );

    return nodes;
  }

  // External data
  const externalData = get(props.externalData!, 'nodes') as NcNode[];
  const nodes = externalData.filter(
    notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])),
  );

  if (!props.panel.filter) {
    return nodes;
  }

  const filterFunction = customFilter(props.panel.filter);
  return filterFunction({
    nodes,
    edges: getNetworkEdges(state, { stage, ...props }),
    ego: getNetworkEgo(state, { stage, ...props }),
  });
};

export default withExternalData(
  'externalDataSource',
  'externalData',
)(NodePanel);
