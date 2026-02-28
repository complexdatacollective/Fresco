import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formIsReady, setFormIsReady } from '../ducks/modules/ui';

const useReadyForNextStage = () => {
  const isReady = useSelector(formIsReady);
  const dispatch = useDispatch();

  const updateReady = useCallback(
    (newValue: boolean) => {
      dispatch(setFormIsReady(newValue));
    },
    [dispatch],
  );

  useEffect(() => {
    return () => updateReady(false);
  }, [updateReady]);

  return { isReady, updateReady };
};

export default useReadyForNextStage;
