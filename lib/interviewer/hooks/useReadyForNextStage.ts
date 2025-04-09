import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formIsReady, setFormIsReady } from '../ducks/modules/ui';

const useReadyForNextStage = () => {
  const isReady = useSelector(formIsReady);
  const dispatch = useDispatch();
  const isReadyRef = useRef(isReady);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const updateReady = useCallback(
    (newValue: boolean) => {
      if (isReadyRef.current === newValue) {
        return;
      }

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
