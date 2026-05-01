'use client';

import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { find } from 'es-toolkit/compat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Node from '~/lib/interviewer/components/ConnectedNode';
import { updateEdge } from '~/lib/interviewer/ducks/modules/session';
import {
  getNetworkEdgesForType,
  getNetworkNodes,
  makeGetEdgeColor,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import { cx } from '@codaco/fresco-ui/utils/cva';
import { edgeColorMap } from '../../utils/edgeColorMap';
import IntroPanel from '../SlidesForm/IntroPanel';
import SlidesForm from '../SlidesForm/SlidesForm';

function EdgeHeader({ item }: { item: NcEdge }) {
  const getEdgeColor = useMemo(() => makeGetEdgeColor(), []);
  const edgeColor = useSelector(getEdgeColor);
  const nodes = useSelector(getNetworkNodes);

  const fromNode = find(nodes, [entityPrimaryKeyProperty, item.from]);
  const toNode = find(nodes, [entityPrimaryKeyProperty, item.to]);

  return (
    <div className="flex shrink-0 items-center">
      {fromNode && (
        <Node
          nodeId={fromNode[entityPrimaryKeyProperty]}
          type={fromNode.type}
          className="rounded-full"
        />
      )}
      <div
        className={cx(
          edgeColorMap[edgeColor],
          'mx-[-1.5rem] h-2 w-32 bg-(--edge-color)',
        )}
      />
      {toNode && (
        <Node
          nodeId={toNode[entityPrimaryKeyProperty]}
          type={toNode.type}
          className="rounded-full"
        />
      )}
    </div>
  );
}

const AlterEdgeForm = (props: StageProps<'AlterEdgeForm'>) => {
  const { stage } = props;
  const items = useSelector(getNetworkEdgesForType);
  const dispatch = useAppDispatch();
  const [showIntro, setShowIntro] = useState(true);

  const handleUpdateItem = useCallback(
    (id: string, newAttributeData: NcEdge[EntityAttributesProperty]) => {
      void dispatch(
        updateEdge({
          edgeId: id,
          newAttributeData,
        }),
      );
    },
    [dispatch],
  );

  const renderHeader = useCallback((item: NcNode | NcEdge) => {
    if (!('from' in item)) return null;
    return <EdgeHeader item={item} />;
  }, []);

  const { moveForward } = props.getNavigationHelpers();

  // If the intro panel is dismissed and there are no items, skip to the next stage.
  useEffect(() => {
    if (showIntro === false && items.length === 0) {
      moveForward();
    }
  }, [showIntro, items.length, moveForward]);

  if (showIntro) {
    return (
      <div className="interface">
        <IntroPanel
          title={stage.introductionPanel.title}
          text={stage.introductionPanel.text}
          onDismiss={() => setShowIntro(false)}
        />
      </div>
    );
  }

  return (
    <SlidesForm
      updateItem={handleUpdateItem}
      items={items}
      subject={stage.subject}
      form={stage.form}
      onNavigateBack={() => setShowIntro(true)}
      renderHeader={renderHeader}
    />
  );
};

export default AlterEdgeForm;
