import {
  type Panel as PanelType,
  type StageSubject,
} from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import useExternalData from '../hooks/useExternalData';
import { getPanelNodes } from '../selectors/name-generator';
import { getStageSubject } from '../selectors/session';
import { type HighlightColor } from './NodePanels';

type NodePanelProps = {
  panelConfig: PanelType;
  disableDragging: boolean;
  accepts: () => boolean;
  highlightColor: HighlightColor;
  minimize: boolean;
  onDrop: (item: { meta: NcNode }, dataSource: string) => void;
  onUpdate: (nodeCount: number, nodeIndex: Set<string>) => void;
  id: string;
  listId: string;
};

function NodePanel(props: NodePanelProps) {
  const {
    highlightColor,
    id,
    onUpdate,
    panelConfig,
    onDrop,
    minimize,
    listId,
    accepts,
  } = props;

  const stageSubject = useSelector(getStageSubject) as Extract<
    StageSubject,
    { entity: 'node' }
  >;
  const { externalData } = useExternalData(
    panelConfig.dataSource,
    stageSubject,
  );

  const nodes = useSelector(getPanelNodes(panelConfig, externalData));

  // Because the index is used to determine whether node originated in this list
  // we need to supply an index for the unfiltered list for externalData.
  const fullNodeIndex = useMemo(() => {
    const externalNodes = get(externalData, 'nodes', []);
    const allNodes =
      panelConfig.dataSource === 'existing' ? nodes : externalNodes;

    return new Set(allNodes.map((node) => node[entityPrimaryKeyProperty]));
  }, [externalData, nodes, panelConfig.dataSource]);

  useEffect(() => {
    onUpdate(nodes.length, fullNodeIndex);
  }, [nodes.length, onUpdate, fullNodeIndex]);

  const handleDrop = (item: { meta: NcNode; target: NcNode }) => {
    return onDrop(item, panelConfig.dataSource);
  };

  return (
    <Panel
      title={panelConfig.title}
      highlight={highlightColor}
      minimize={minimize}
    >
      <NodeList
        items={nodes}
        listId={listId}
        id={id}
        itemType="NEW_NODE"
        onDrop={handleDrop}
        accepts={accepts}
      />
    </Panel>
  );
}

export default NodePanel;
