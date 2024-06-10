import { useCallback, useEffect } from 'react';
import { DraggingItem } from '~/lib/dnd/store';
import Panel from '~/lib/interviewer/components/Panel';
import { Spinner } from '~/lib/ui/components';
import type { Panel as PanelType } from '~/schemas/network-canvas';
import { createDraggableNode } from '../components/Node';
import NodeList from '../components/NodeList';
import usePanelData from './usePanelData';

type NodePanelProps = {
  panel: PanelType;
  highlight: string;
  onDrop: (item: unknown, dataSource: string) => void;
  updateParentNodeCount: (count: number, id: string) => void;
  disableAddNew?: boolean;
};

const DraggableRosterNode = createDraggableNode('ROSTER_NODE');
const DraggableExistingNode = createDraggableNode('EXISTING_NODE');

function NodePanel(props: NodePanelProps) {
  const { panel, highlight, onDrop, disableAddNew, updateParentNodeCount } =
    props;

  const { dataSource, title, filter, id } = panel;

  const { nodes, isLoading } = usePanelData({ dataSource });

  const willAccept = useCallback(
    (item: DraggingItem) => {
      if (dataSource === 'existing') {
        return item.type === 'EXISTING_NODE';
      }

      return false;
    },
    [dataSource],
  );

  useEffect(() => {
    if (nodes) {
      updateParentNodeCount(nodes.length, id);
    } else {
      updateParentNodeCount(0, id);
    }
  }, [nodes, id, updateParentNodeCount]);

  const handleDrop = (item) => {
    console.log('dropped', item);
    return onDrop(item, dataSource);
  };

  return (
    <Panel title={title} highlight={highlight}>
      {isLoading || !nodes ? (
        <Spinner />
      ) : (
        <NodeList
          key={nodes.length}
          items={nodes}
          ItemComponent={
            dataSource === 'existing'
              ? DraggableExistingNode
              : DraggableRosterNode
          }
          willAccept={willAccept}
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
