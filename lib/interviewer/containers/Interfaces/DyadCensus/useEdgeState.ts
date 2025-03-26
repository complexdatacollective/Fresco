import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
} from '@codaco/shared-consts';
import { type AnyAction } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import {
  addEdge,
  deleteEdge,
  edgeExists,
  updateEdge,
  updateStageMetadata,
  type StageMetadataEntry,
} from '~/lib/interviewer/ducks/modules/session';
import { getStageMetadata } from '~/lib/interviewer/selectors/session';

const matchEntry =
  (promptIndex: number, pair: Pair) =>
  ([p, a, b]: StageMetadataEntry) =>
    (p === promptIndex && a === pair[0] && b === pair[1]) ||
    (p === promptIndex && b === pair[0] && a === pair[1]);

const getStageMetadataResponse = (
  state: StageMetadataEntry[] | undefined,
  promptIndex: number,
  pair: Pair,
) => {
  // If the state is not an array or the pair is not a pair, return null
  if (!Array.isArray(state) || pair.length !== 2) {
    return false;
  }

  const answer = state.find(matchEntry(promptIndex, pair));
  return answer ? answer[3] : false;
};

type Pair = [string, string];

// Hack to work around edge type not being correct.
type NcEdgeWithId = NcEdge & { [entityPrimaryKeyProperty]: string };

export default function useEdgeState(
  pair: Pair | null,
  edges: NcEdgeWithId[],
  deps: string,
) {
  const dispatch = useDispatch();
  const stageMetadata = useSelector(getStageMetadata);
  const [isTouched, setIsTouched] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const { prompt, promptIndex } = usePrompts();
  const edgeType = prompt.createEdge!;
  const edgeVariable = prompt.edgeVariable;

  const existingEdgeId =
    (pair && edgeExists(edges, pair[0], pair[1], edgeType)) ?? false;
  const getEdgeVariableValue = () => {
    if (!edgeVariable) {
      return undefined;
    }

    const edge = edges.find(
      (e) => e[entityPrimaryKeyProperty] === existingEdgeId,
    );
    return edge?.[entityAttributesProperty]?.[edgeVariable] ?? undefined;
  };

  // TODO: update this to handle edge variables for TieStrengthCensus
  const hasEdge = () => {
    if (!pair) {
      return false;
    }

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
  //
  // Fucking stupid design.
  const setEdge = (value: boolean | string | number) => {
    setIsChanged(hasEdge() !== value);
    setIsTouched(true);

    if (!pair) {
      return;
    }

    // Creating an edge
    if (value === true) {
      dispatch(
        addEdge({
          modelData: {
            from: pair[0],
            to: pair[1],
            type: edgeType,
          },
        }) as unknown as AnyAction,
      );

      const newStageMetadata = [
        ...(stageMetadata?.filter(
          (item) => !matchEntry(promptIndex, pair)(item),
        ) ?? []),
      ] as StageMetadataEntry[];

      dispatch(updateStageMetadata(newStageMetadata) as unknown as AnyAction);
    }

    if (value === false) {
      if (existingEdgeId) {
        dispatch(deleteEdge(existingEdgeId) as unknown as AnyAction);
      }

      // Construct new stage metadata from scratch
      const newStageMetadata = [
        ...(stageMetadata?.filter(
          (item) => !matchEntry(promptIndex, pair)(item),
        ) ?? []),
        [promptIndex, ...pair, value],
      ] as StageMetadataEntry[];

      const action = updateStageMetadata(
        newStageMetadata,
      ) as unknown as AnyAction;

      dispatch(action);
    }

    if (typeof value === 'string' || typeof value === 'number') {
      if (existingEdgeId) {
        const action = updateEdge({
          edgeId: existingEdgeId,
          newAttributeData: {
            [edgeVariable!]: value,
          },
        });

        dispatch(action);
      } else {
        const action = addEdge({
          modelData: {
            from: pair[0],
            to: pair[1],
            type: edgeType,
          },
          attributeData: {
            [edgeVariable!]: value,
          },
        }) as unknown as AnyAction;
        dispatch(action);
      }
    }
  };

  useEffect(() => {
    setIsTouched(false);
    setIsChanged(false);
  }, [deps]);

  return {
    hasEdge: hasEdge(), // If an edge exists. null if not yet determined.
    edgeVariableValue: getEdgeVariableValue(), // The value of the edge variable
    setEdge, // Set the edge to true or false. Triggers redux actions to create or delete edges.
    isTouched,
    isChanged,
  };
}
