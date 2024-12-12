/*
 * Global UI state
 */

const initialState = {} as Record<string, unknown>;

const UPDATE = 'UI/UPDATE' as const;
const TOGGLE = 'UI/TOGGLE' as const;

type UpdateAction = {
  type: typeof UPDATE;
  state: Record<string, unknown>;
};

type ToggleAction = {
  type: typeof TOGGLE;
  item: string;
};

type Action = UpdateAction | ToggleAction;

export default function reducer(state = initialState, action: Action) {
  switch (action.type) {
    case UPDATE:
      return {
        ...state,
        ...action.state,
      };
    case TOGGLE:
      return {
        ...state,
        [action.item]: !state[action.item],
      };
    default:
      return state;
  }
}

const update = (state: Record<string, unknown>) => ({
  type: UPDATE,
  state,
});

const toggle = (item: string) => ({
  type: TOGGLE,
  item,
});

const actionCreators = {
  update,
  toggle,
};

export { actionCreators };
