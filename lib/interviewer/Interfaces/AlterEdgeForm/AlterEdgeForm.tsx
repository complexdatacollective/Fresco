'use client';

import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { updateEdge } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkEdgesForType } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import IntroPanel from '../SlidesForm/IntroPanel';
import SlideFormEdge from '../SlidesForm/SlideFormEdge';
import SlidesForm from '../SlidesForm/SlidesForm';

const AlterEdgeForm = (props: StageProps<'AlterEdgeForm'>) => {
  const { stage } = props;
  const items = useSelector(getNetworkEdgesForType);
  const dispatch = useAppDispatch();
  const [showIntro, setShowIntro] = useState(true);

  const handleUpdateItem = useCallback(
    (...args: unknown[]) => {
      void dispatch(updateEdge(args[0] as Parameters<typeof updateEdge>[0]));
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
      slideForm={SlideFormEdge}
      updateItem={handleUpdateItem}
      items={items}
      stage={stage}
      getNavigationHelpers={props.getNavigationHelpers}
      onNavigateBack={() => setShowIntro(true)}
    />
  );
};

export default AlterEdgeForm;
