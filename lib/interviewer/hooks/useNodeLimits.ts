import { createElement, useEffect, useRef } from 'react';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import useStageValidation from '~/lib/interviewer/hooks/useStageValidation';

type UseNodeLimitsOptions = {
  stageNodeCount: number;
  minNodes: number;
  maxNodes: number;
  isLastPrompt: boolean;
};

function useNodeLimits({
  stageNodeCount,
  minNodes,
  maxNodes,
  isLastPrompt,
}: UseNodeLimitsOptions) {
  const maxNodesReached = stageNodeCount >= maxNodes;
  const minNodesMet = !minNodes || !isLastPrompt || stageNodeCount >= minNodes;

  const { updateReady } = useReadyForNextStage();

  const minNodesMessage = createElement(
    'span',
    null,
    'You must create at least ',
    createElement('strong', null, minNodes),
    ` ${minNodes > 1 ? 'items' : 'item'} before you can continue.`,
  );

  const { showToast, closeToast } = useStageValidation({
    constraints: [
      {
        direction: 'forwards',
        isMet: minNodesMet,
        toast: {
          description: minNodesMessage,
          variant: 'destructive',
          anchor: 'forward',
          timeout: 4000,
        },
      },
    ],
  });

  const maxToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!maxNodesReached) {
      if (maxToastRef.current) {
        closeToast(maxToastRef.current);
        maxToastRef.current = null;
      }
      return;
    }

    // Defer toast creation so StrictMode's cleanup (clearTimeout) cancels
    // the pending timer rather than closing an already-rendered toast.
    const timeout = setTimeout(() => {
      maxToastRef.current = showToast({
        description:
          'You have completed this task. Click the next arrow to continue.',
        variant: 'success',
        anchor: 'forward',
        timeout: 0,
      });
    }, 0);

    return () => {
      clearTimeout(timeout);
      if (maxToastRef.current) {
        closeToast(maxToastRef.current);
        maxToastRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxNodesReached]);

  useEffect(() => {
    updateReady(minNodesMet || maxNodesReached);
  }, [minNodesMet, maxNodesReached, updateReady]);

  return { maxNodesReached, minNodesMet };
}

export default useNodeLimits;
