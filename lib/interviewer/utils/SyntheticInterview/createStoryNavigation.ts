import {
  updatePrompt,
  updateStage,
} from '~/lib/interviewer/ducks/modules/session';
import {
  type BeforeNextFunction,
  type Direction,
  type RegisterBeforeNext,
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
  const handlers = new Map<string, BeforeNextFunction>();

  const registerBeforeNext: RegisterBeforeNext = (
    ...args: [BeforeNextFunction | null] | [string, BeforeNextFunction | null]
  ) => {
    if (args.length === 1) {
      const [fn] = args;
      if (fn === null) {
        handlers.clear();
      } else {
        handlers.set('default', fn);
      }
    } else {
      const [key, fn] = args;
      if (fn === null) {
        handlers.delete(key);
      } else {
        handlers.set(key, fn);
      }
    }
  };

  const canNavigate = async (direction: Direction) => {
    if (handlers.size === 0) return true;

    let hasForce = false;
    for (const fn of handlers.values()) {
      const result = await fn(direction);
      if (result === false) return false;
      if (result === 'FORCE') hasForce = true;
    }
    return hasForce ? 'FORCE' : true;
  };

  const getNavigationHelpers = () => ({
    moveForward: async () => {
      const result = await canNavigate('forwards');
      if (!result) return;

      const state = store.getState();
      const currentStep = state.session.currentStep;
      const promptIndex = state.session.promptIndex ?? 0;
      const stage = state.protocol.stages[currentStep];
      const promptCount = getStagePromptCount(stage);
      const totalStages = state.protocol.stages.length;

      if (result === 'FORCE') return;

      if (promptIndex < promptCount - 1) {
        store.dispatch(updatePrompt(promptIndex + 1));
      } else if (currentStep < totalStages - 1) {
        store.dispatch(updatePrompt(0));
        store.dispatch(updateStage(currentStep + 1));
      }
    },
    moveBackward: async () => {
      const result = await canNavigate('backwards');
      if (!result) return;

      const state = store.getState();
      const currentStep = state.session.currentStep;
      const promptIndex = state.session.promptIndex ?? 0;

      if (result === 'FORCE') return;

      if (promptIndex > 0) {
        store.dispatch(updatePrompt(promptIndex - 1));
      } else if (currentStep > 0) {
        const prevStage = state.protocol.stages[currentStep - 1];
        const prevPromptCount = getStagePromptCount(prevStage);
        store.dispatch(updatePrompt(prevPromptCount - 1));
        store.dispatch(updateStage(currentStep - 1));
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
