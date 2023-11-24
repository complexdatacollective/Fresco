const SET_DESCRIPTION = 'SETTINGS/SET_DESCRIPTION';
const SET_INTERFACE_SCALE = 'SETTINGS/SET_INTERFACE_SCALE';
const TOGGLE_SETTING = 'SETTINGS/TOGGLE_SETTING';
const SET_SETTING = 'SETTINGS/SET_SETTING';


// Static defaults should be distinguishable from user choices (e.g., undefined instead of false).
const initialState = {
  useDynamicScaling: true,
  // useFullScreenForms defaults to false, leave using full screen forms up to user
  useFullScreenForms: false,
  interfaceScale: 100,
  startFullScreen: false,

  // Experimental TTS feature for reading prompts
  enableExperimentalTTS: false,

  // Experimental interaction sounds
  enableExperimentalSounds: false,
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_DESCRIPTION:
      return {
        ...state,
        description: action.description,
      };
    case SET_INTERFACE_SCALE:
      return {
        ...state,
        interfaceScale: action.scale,
      };
    case TOGGLE_SETTING:
      return {
        ...state,
        [action.item]: !state[action.item],
      };
    case SET_SETTING:
      return {
        ...state,
        [action.setting]: action.value,
      };
    default:
      return state;
  }
}

const setDescription = (description) => ({
  type: SET_DESCRIPTION,
  description,
});

const setInterfaceScale = (scale) => ({
  type: SET_INTERFACE_SCALE,
  scale,
});

const toggleSetting = (item) => ({
  type: TOGGLE_SETTING,
  item,
});

const setSetting = (setting, value) => ({
  type: SET_SETTING,
  setting,
  value,
});

const actionCreators = {
  setDescription,
  setInterfaceScale,
  toggleSetting,
  setSetting,
};

const actionTypes = {
  SET_DESCRIPTION,
  SET_INTERFACE_SCALE,
  TOGGLE_SETTING,
  SET_SETTING,
};

export {
  actionCreators,
  actionTypes,
};
