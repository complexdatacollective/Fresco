import { useEffect } from 'react';
import Panel from '~/lib/interviewer/components/Panel';
import { Spinner } from '~/lib/ui/components';
import type { Panel as PanelType } from '~/schemas/network-canvas';
import { DraggableNode } from '../components/Node';
import NodeList from '../components/NodeList';
import usePanelData from './usePanelData';

type NodePanelProps = {
  panel: PanelType;
  highlight: string;
  itemType: string;
  externalData?: unknown[];
  onDrop: (item: unknown, dataSource: string) => void;
  updateParentNodeCount: (count: number) => void;
  disableAddNew?: boolean;
};

function NodePanel(props: NodePanelProps) {
  const {
    panel,
    highlight,
    itemType,
    onDrop,
    disableAddNew,
    updateParentNodeCount,
  } = props;

  const { dataSource, title, filter } = panel;

  const { nodes, isLoading } = usePanelData({ dataSource });

  console.log('nodes', nodes, isLoading);

  useEffect(() => {
    console.log('nodes', nodes);
    if (nodes) {
      updateParentNodeCount(nodes.length);
    } else {
      updateParentNodeCount(0);
    }
  }, [nodes]);

  const handleDrop = (item) => {
    console.log('dropped', item);
    // return onDrop(item, dataSource);
  };

  return (
    <Panel title={title} highlight={highlight}>
      {isLoading || !nodes ? (
        <Spinner />
      ) : (
        <NodeList
          items={nodes}
          itemType={itemType}
          ItemComponent={DraggableNode}
          accepts={['EXISTING_NODE']}
          onDrop={handleDrop}
          allowDrop={!disableAddNew}
        />
      )}
    </Panel>
  );
}

// const getNodeId = (node: NcNode) => node[entityPrimaryKeyProperty];
//
// const getNodesForPanel = (state, props: NodePanelProps) => {
//   const stage = getCurrentStage(state);
//   const nodesForPrompt = getNetworkNodesForPrompt(state, { stage, ...props });
//   const nodesForOtherPrompts = getNetworkNodesForOtherPrompts(state, {
//     stage,
//     ...props,
//   });
//   const nodeIds = {
//     prompt: nodesForPrompt.map(getNodeId),
//     other: nodesForOtherPrompts.map(getNodeId),
//   };

//   const notInSet = (set: Set<string>) => (node: NcNode) =>
//     !set.has(node[entityPrimaryKeyProperty]);

//   // Existing nodes just shows nodes not on this prompt
//   if (props.panel.dataSource === 'existing') {
//     const nodes = nodesForOtherPrompts.filter(
//       notInSet(new Set(nodeIds.prompt)),
//     );

//     return nodes;
//   }

//   // External data

//   const externalData = get(props.externalData!, 'nodes', []) as NcNode[];
//   const nodes = externalData.filter(
//     notInSet(new Set([...nodeIds.prompt, ...nodeIds.other])),
//   );

//   if (!props.panel.filter) {
//     return nodes;
//   }

//   const filterFunction = customFilter(props.panel.filter);
//   return filterFunction({
//     nodes,
//     edges: UNFILTERED_getNetworkEdges(state, { stage, ...props }),
//     ego: UNFILTERED_getNetworkEgo(state, { stage, ...props }),
//   });
// };

export default NodePanel;
