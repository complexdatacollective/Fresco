import { updatePrompt } from '~/lib/interviewer/ducks/modules/session';
import {
  type BeforeNextFunction,
  type Direction,
} from '~/lib/interviewer/types';

/**
 * Minimal store interface for prompt navigation. Both `createMockStore` and
 * the NameGenerator's own `configureStore` satisfy this structurally.
 */
export type PromptNavigableStore = {
  getState: () => {
    session: { promptIndex?: number; currentStep: number };
    protocol: { stages: unknown[] };
  };
  dispatch: (action: { type: string; payload: number }) => void;
  subscribe: (listener: () => void) => () => void;
};

function getStagePromptCount(stage: unknown): number {
  if (
    typeof stage === 'object' &&
    stage !== null &&
    'prompts' in stage &&
    Array.isArray(stage.prompts)
  ) {
    return stage.prompts.length;
  }
  return 1;
}

/**
 * Creates working registerBeforeNext and getNavigationHelpers for Storybook
 * stories. The returned helpers read prompt state from the store and dispatch
 * updatePrompt to navigate between prompts within a stage.
 *
 * The beforeNext callback registered by the component is respected: if it
 * returns false navigation is blocked, if it returns 'FORCE' the prompt
 * boundary is skipped.
 */
export type StoryNavigation = ReturnType<typeof createStoryNavigation>;

export function createStoryNavigation(store: PromptNavigableStore) {
  let beforeNextFn: BeforeNextFunction | null = null;

  const registerBeforeNext = (fn: BeforeNextFunction | null) => {
    beforeNextFn = fn;
  };

  const canNavigate = async (direction: Direction) => {
    if (!beforeNextFn) return true;
    return beforeNextFn(direction);
  };

  const getNavigationHelpers = () => ({
    moveForward: async () => {
      const result = await canNavigate('forwards');
      if (!result) return;

      const state = store.getState();
      const promptIndex = state.session.promptIndex ?? 0;
      const stage = state.protocol.stages[state.session.currentStep];
      const promptCount = getStagePromptCount(stage);

      if (result !== 'FORCE' && promptIndex < promptCount - 1) {
        store.dispatch(updatePrompt(promptIndex + 1));
      }
    },
    moveBackward: async () => {
      const result = await canNavigate('backwards');
      if (!result) return;

      const state = store.getState();
      const promptIndex = state.session.promptIndex ?? 0;

      if (result !== 'FORCE' && promptIndex > 0) {
        store.dispatch(updatePrompt(promptIndex - 1));
      }
    },
  });

  /**
   * Triggers the component's `beforeNext` validation without actually navigating.
   * Simulates what happens when the user tries to leave the stage (e.g. on the
   * last prompt), which fires validation like minNodes/maxNodes checks.
   */
  const simulateLeaveStage = async () => {
    await canNavigate('forwards');
  };

  return { registerBeforeNext, getNavigationHelpers, simulateLeaveStage };
}
