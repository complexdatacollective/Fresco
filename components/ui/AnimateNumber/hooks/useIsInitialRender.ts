import { useRef, useEffect } from 'react';

export function useIsInitialRender(): boolean {
  const isInitialRender = useRef(true);
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
}
