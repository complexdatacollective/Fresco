/**
 * A utility to create a hook that returns a piece of state and its setter from a Zustand store.
 * Idea is to mirror React's useState API but have the state be stored in a Zustand store.
 * @example
 * const useFamilyTreeState = createUseState(useFamilyTreeStore);
 *
 * const [step, setStep] = useFamilyTreeState(state => state.step, state => state.setStep);
 *
 * @param useStore - The Zustand store hook.
 * @returns A hook that takes a selector for the value and a selector for the setter, returning a tuple of [value, setter].
 */
export const createUseState = <TStore>(
  useStore: <T>(selector: (state: TStore) => T) => T,
) => {
  return <TValue>(
    selector: (state: TStore) => TValue,
    setterSelector: (state: TStore) => (value: TValue) => void,
  ): [TValue, (value: TValue | ((prev: TValue) => TValue)) => void] => {
    const value = useStore(selector);
    const setter = useStore(setterSelector);

    const wrappedSetter = (newValue: TValue | ((prev: TValue) => TValue)) => {
      if (typeof newValue === 'function') {
        const updater = newValue as (prev: TValue) => TValue;
        setter(updater(value));
      } else {
        setter(newValue);
      }
    };

    return [value, wrappedSetter] as const;
  };
};
