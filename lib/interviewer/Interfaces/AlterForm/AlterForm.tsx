'use client';

import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import Node from '../../components/Node';
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

  const renderHeader = useCallback(
    (item: NcNode) => (
      <Node
        {...item}
        className="phone-landscape:mt-4 tablet-landscape:mt-6 mt-2 shrink-0 rounded-full"
      />
    ),
    [],
  );

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
      stage={stage}
      getNavigationHelpers={props.getNavigationHelpers}
      onNavigateBack={() => setShowIntro(true)}
      renderHeader={renderHeader}
    />
  );
};

export default AlterForm;
