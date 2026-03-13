'use client';

import { useContext, useEffect, useRef } from 'react';
import { StageMetadataContext } from '~/lib/interviewer/contexts/StageMetadataContext';
import { type BeforeNextFunction } from '~/lib/interviewer/types';

export default function useBeforeNext(handler: BeforeNextFunction) {
  const registerBeforeNext = useContext(StageMetadataContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    registerBeforeNext((direction) => handlerRef.current(direction));
    return () => registerBeforeNext(null);
  }, [registerBeforeNext]);
}
