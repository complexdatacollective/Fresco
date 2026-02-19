export const ADDON_ID = 'interview-navigation';

export const EVENTS = {
  PROMPT_STATE: `${ADDON_ID}/promptState`,
  NAV_FORWARD: `${ADDON_ID}/navForward`,
  NAV_BACKWARD: `${ADDON_ID}/navBackward`,
  LEAVE_STAGE: `${ADDON_ID}/leaveStage`,
};

export type PromptState = {
  promptIndex: number;
  promptCount: number;
};
