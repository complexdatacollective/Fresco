import type { entityPrimaryKeyProperty, NcEdge } from '@codaco/shared-consts';
import { useDispatch, useSelector } from 'react-redux';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import { edgeExists } from '~/lib/interviewer/ducks/modules/network';
import { getStageMetadata } from '~/lib/interviewer/selectors/session';
import { actionCreators as sessionActions } from '../../../ducks/modules/session';
import type {
  StageMetadata,
  StageMetadataEntry,
} from '~/lib/interviewer/store';
import { type AnyAction } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';

export const matchEntry =
  (promptIndex: number, pair: Pair) =>
  ([p, a, b]: StageMetadataEntry) =>
    (p === promptIndex && a === pair[0] && b === pair[1]) ||
    (p === promptIndex && b === pair[0] && a === pair[1]);

const getStageMetadataResponse = (
  state: StageMetadata | undefined,
  promptIndex: number,
  pair: Pair,
) => {
  // If the state is not an array or the pair is not a pair, return false
  if (!Array.isArray(state) || pair.length !== 2) {
    return null;
  }

  const answer = state.find(matchEntry(promptIndex, pair));
  return answer ? answer[3] : null;
};

type Pair = [string, string];

// Hack to work around edge type not being correct.
type NcEdgeWithId = NcEdge & { [entityPrimaryKeyProperty]: string };

export default function useEdgeState(
  pair: Pair,
  edges: NcEdgeWithId[],
  deps: string,
) {
  const dispatch = useDispatch();
  const stageMetadata = useSelector(getStageMetadata);
  const [isTouched, setIsTouched] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const { prompt, promptIndex } = usePrompts();
  const edgeType = prompt.createEdge!;
  // const edgeVariable = prompt.edgeVariable!;

  const existingEdgeId = edgeExists(edges, pair[0], pair[1], edgeType);

  // TODO: update this to handle edge variables for TieStrengthCensus
  const hasEdge = () => {
    const edgeExistsInMetadata = getStageMetadataResponse(
      stageMetadata,
      promptIndex,
      pair,
    );

    // If the edge exists in the network, return true
    if (existingEdgeId) {
      return true;
    }

    if (edgeExistsInMetadata === null) {
      return null;
    }

    return false;
  };

  // If value is boolean we are creating or deleting the edge.
  // If value is string, we are creating an edge with a variable value,
  // or updating the edge variable value.
  const setEdge = (value: boolean | string) => {
    setIsChanged(hasEdge() !== value);
    setIsTouched(true);
    // We must dispatch the action to create or delete the edge
    // We must also dispatch the action to update the stage metadata
    let newStageMetadata: StageMetadata | undefined;

    if (value === true) {
      dispatch(
        sessionActions.addEdge({
          from: pair[0],
          to: pair[1],
          type: edgeType,
        }) as unknown as AnyAction,
      );

      newStageMetadata = [
        ...(stageMetadata?.filter(
          (item) => !matchEntry(promptIndex, pair)(item),
        ) ?? []),
      ];
    }

    if (value === false) {
      if (existingEdgeId) {
        dispatch(
          sessionActions.removeEdge(existingEdgeId) as unknown as AnyAction,
        );
      }

      newStageMetadata = [
        ...(stageMetadata?.filter(
          (item) => !matchEntry(promptIndex, pair)(item),
        ) ?? []),
        [promptIndex, ...pair, value],
      ];
    }

    dispatch(
      sessionActions.updateStageMetadata(
        newStageMetadata,
      ) as unknown as AnyAction,
    );
  };

  useEffect(() => {
    setIsTouched(false);
    setIsChanged(false);
  }, [deps]);

  return {
    hasEdge: hasEdge(), // If an edge exists. null if not yet determined.
    setEdge, // Set the edge to true or false. Triggers redux actions to create or delete edges.
    isTouched,
    isChanged,
  };
}
