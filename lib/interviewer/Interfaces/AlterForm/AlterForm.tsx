'use client';

import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Node from '~/lib/interviewer/components/ConnectedNode';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import IntroPanel from '../SlidesForm/IntroPanel';
import SlidesForm from '../SlidesForm/SlidesForm';

const AlterForm = (props: StageProps<'AlterForm'>) => {
  const { stage } = props;
  const items = useSelector(getNetworkNodesForType);
  const dispatch = useAppDispatch();
  const [showIntro, setShowIntro] = useState(true);

  const handleUpdateItem = useCallback(
    (id: string, newAttributeData: NcNode[EntityAttributesProperty]) => {
      void dispatch(
        updateNode({
          nodeId: id,
          newAttributeData,
        }),
      );
    },
    [dispatch],
  );

  const renderHeader = useCallback((item: NcNode | NcEdge) => {
    if ('from' in item) return null;
    return (
      <Node
        nodeId={item[entityPrimaryKeyProperty]}
        type={item.type}
        className="shrink-0 rounded-full"
      />
    );
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

export default AlterForm;
