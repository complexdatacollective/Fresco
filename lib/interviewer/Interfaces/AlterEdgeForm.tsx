'use client';

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type StageProps } from '~/lib/interviewer/components/Stage';
import { updateEdge } from '~/lib/interviewer/ducks/modules/session';
import { getNetworkEdgesForType } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import SlideFormEdge from './SlidesForm/SlideFormEdge';
import SlidesForm from './SlidesForm/SlidesForm';

const AlterEdgeForm = (props: StageProps) => {
  const items = useSelector(getNetworkEdgesForType);
  const dispatch = useAppDispatch();

  const handleUpdateItem = useCallback(
    (...args: unknown[]) => {
      void dispatch(updateEdge(args[0] as Parameters<typeof updateEdge>[0]));
    },
    [dispatch],
  );

  return (
    <SlidesForm
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      slideForm={SlideFormEdge as any}
      parentClass="alter-edge-form"
      updateItem={handleUpdateItem}
      items={items}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      stage={props.stage as any}
      registerBeforeNext={props.registerBeforeNext}
      getNavigationHelpers={props.getNavigationHelpers}
    />
  );
};

export default AlterEdgeForm;
