import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formIsReady, setFormIsReady } from '../ducks/modules/ui';

const useReadyForNextStage = () => {
  const dispatch = useDispatch();

  const updateReady = useCallback(
    (isReady: boolean) => {
      dispatch(setFormIsReady(isReady));
    },
    [dispatch],
  );

  const isReady = useSelector(formIsReady);

  useEffect(() => {
    updateReady(false);

    return () => updateReady(false);
  }, [updateReady]);

  return { isReady, updateReady };
};

export default useReadyForNextStage;
