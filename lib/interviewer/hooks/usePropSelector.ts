import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

type Selector<TState, TProps, TResult> = (
  state: TState,
  props: TProps,
) => TResult;
type SelectorFactory<TState, TProps, TResult> = () => Selector<
  TState,
  TProps,
  TResult
>;

/**
 * Converts legacy react-redux selectors that take a props argument
 * into ones that can be used with useSelector.
 */
function usePropSelector<TState, TProps, TResult>(
  selector: Selector<TState, TProps, TResult>,
  props: TProps,
  isFactory?: false,
  equalityFn?: (left: TResult, right: TResult) => boolean,
): TResult;
function usePropSelector<TState, TProps, TResult>(
  selector: SelectorFactory<TState, TProps, TResult>,
  props: TProps,
  isFactory: true,
  equalityFn?: (left: TResult, right: TResult) => boolean,
): TResult;
function usePropSelector<TState, TProps, TResult>(
  selector:
    | Selector<TState, TProps, TResult>
    | SelectorFactory<TState, TProps, TResult>,
  props: TProps,
  isFactory = false,
  equalityFn?: (left: TResult, right: TResult) => boolean,
): TResult {
  const memoizedSelector = useMemo(() => {
    if (isFactory) {
      return (selector as SelectorFactory<TState, TProps, TResult>)();
    }
    return selector as Selector<TState, TProps, TResult>;
  }, [isFactory, selector]);

  const selectorWithProps = useCallback(
    (state: TState) => memoizedSelector(state, props),
    [props, memoizedSelector],
  );

  return useSelector(selectorWithProps, equalityFn);
}

export default usePropSelector;
