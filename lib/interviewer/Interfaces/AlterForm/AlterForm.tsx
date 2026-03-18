'use client';

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateNode } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkNodesForType } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import IntroPanel from '../SlidesForm/IntroPanel';
import SlideFormNode from '../SlidesForm/SlideFormNode';
import SlidesForm from '../SlidesForm/SlidesForm';

const AlterForm = (props: StageProps<'AlterForm'>) => {
  const { stage } = props;
  const items = useSelector(getNetworkNodesForType);
  const dispatch = useAppDispatch();
  const [showIntro, setShowIntro] = useState(true);

  const handleUpdateItem = useCallback(
    (...args: unknown[]) => {
      void dispatch(updateNode(args[0] as Parameters<typeof updateNode>[0]));
    },
    [dispatch],
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
      slideForm={SlideFormNode}
      updateItem={handleUpdateItem}
      items={items}
      stage={stage}
      getNavigationHelpers={props.getNavigationHelpers}
      onNavigateBack={() => setShowIntro(true)}
    />
  );
};

export default AlterForm;
