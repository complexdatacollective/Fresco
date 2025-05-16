import { isNil } from 'es-toolkit';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook that provides state that returns to a rest value after a delay.
 * Optionally has an initial value which can be different from the rest value.
 *
 * @template T The type of the state value
 * @param {T} restValue The value to return to after delay
 * @param {number} delay Delay in milliseconds before returning to rest value
 * @param {T} [initialState] Optional initial state value
 * @returns {[T, (value: T) => void]} Tuple of current state and setState function
 */
function useFlipflop<T>(
  restValue: T,
  delay: number,
  initialState?: T,
): [T, (value: T) => void] {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const [state, _setState] = useState<T>(
    !isNil(initialState) ? initialState : restValue,
  );

  const setState = useCallback(
    (value: T) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      _setState(value);

      timer.current = setTimeout(() => {
        _setState(restValue);
      }, delay);
    },
    [delay, restValue],
  );

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    if (!isNil(initialState) && initialState !== restValue) {
      timer.current = setTimeout(() => {
        _setState(restValue);
      }, delay);
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [delay, restValue, initialState]);

  return [state, setState];
}

export default useFlipflop;
