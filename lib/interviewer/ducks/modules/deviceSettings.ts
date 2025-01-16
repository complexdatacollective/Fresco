import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type DeviceSettings = {
  useDynamicScaling: boolean;
  useFullScreenForms?: boolean;
  interfaceScale: number;
  startFullScreen: boolean;
  enableExperimentalTTS: boolean;
  enableExperimentalSounds: boolean;
};

const initialState: DeviceSettings = {
  useDynamicScaling: true,
  useFullScreenForms: false,
  interfaceScale: 100,
  startFullScreen: false,
  enableExperimentalTTS: false,
  enableExperimentalSounds: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setInterfaceScale: (state, action: PayloadAction<number>) => {
      state.interfaceScale = action.payload;
    },
    toggleSetting: (
      state: DeviceSettings,
      action: PayloadAction<keyof Omit<DeviceSettings, 'interfaceScale'>>,
    ) => {
      const key = action.payload;
      if (typeof state[key] === 'boolean') {
        const test = !state[key];
        state[key] = test;
      }
    },
  },
});

export const { setInterfaceScale, toggleSetting } = settingsSlice.actions;

export default settingsSlice.reducer;
