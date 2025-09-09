import {
  type Panel as PanelType,
  type StageSubject,
} from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type DropCallback } from '~/lib/dnd/types';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import useExternalData from '../hooks/useExternalData';
import { getPanelNodes } from '../selectors/name-generator';
import { getStageSubject } from '../selectors/session';
import { type HighlightColor } from './NodePanels';

type NodePanelProps = {
  panelConfig: PanelType;
  disableDragging: boolean;
  accepts: string[];
  highlightColor: HighlightColor;
  minimize: boolean;
  onDrop: DropCallback;
  onUpdate: (nodeCount: number, nodeIndex: Set<string>) => void;
  id: string;
};

function NodePanel(props: NodePanelProps) {
  const {
    highlightColor,
    id,
    onUpdate,
    panelConfig,
    onDrop,
    minimize,
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

  return (
    <Panel
      title={panelConfig.title}
      highlight={highlightColor}
      minimize={minimize}
    >
      <NodeList
        items={nodes}
        id={id}
        itemType="NEW_NODE" // TODO - this should changed based on panel's data source
        onDrop={onDrop}
        accepts={accepts}
        nodeSize="sm"
        className="gap-4 p-4"
      />
    </Panel>
  );
}

export default NodePanel;
