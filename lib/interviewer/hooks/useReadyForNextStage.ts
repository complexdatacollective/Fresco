import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actionCreators as uiActions } from '../ducks/modules/ui';
import type { RootState } from '../store';

const useReadyForNextStage = () => {
  const dispatch = useDispatch();

  const updateReady = useCallback(
    (isReady: boolean) => {
      dispatch(uiActions.update({ FORM_IS_READY: isReady }));
    },
    [dispatch],
  );

  const isReady = useSelector(
    (state: RootState) => !!state.ui.FORM_IS_READY ?? false,
  );

  useEffect(() => {
    updateReady(false);

    return () => updateReady(false);
  }, [updateReady]);

  return { isReady, updateReady };
};

export default useReadyForNextStage;
