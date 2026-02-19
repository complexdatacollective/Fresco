import React, { useState } from 'react';
import { IconButton, Separator } from 'storybook/internal/components';
import {
  addons,
  types,
  useChannel,
  useStorybookApi,
} from 'storybook/manager-api';
import {
  ADDON_ID,
  EVENTS,
  type PromptState,
} from './interview-navigation-events';

const TOOL_ID = `${ADDON_ID}/tool`;

function InterviewNavigationTool() {
  const api = useStorybookApi();
  const story = api.getCurrentStoryData();
  const [promptState, setPromptState] = useState<PromptState>({
    promptIndex: 0,
    promptCount: 1,
  });

  const emit = useChannel(
    {
      [EVENTS.PROMPT_STATE]: (data: PromptState) => setPromptState(data),
    },
    [],
  );

  if (!story?.title?.startsWith('Interview/Interfaces')) return null;

  const { promptIndex, promptCount } = promptState;
  const hasMultiplePrompts = promptCount > 1;
  const isFirst = promptIndex === 0;
  const isLast = promptIndex === promptCount - 1;

  return (
    <>
      <Separator />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 12,
        }}
      >
        {hasMultiplePrompts && (
          <>
            <IconButton
              disabled={isFirst}
              onClick={() => emit(EVENTS.NAV_BACKWARD)}
              tooltip="Previous prompt (←)"
              ariaLabel="Previous prompt"
            >
              ◀
            </IconButton>
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                padding: '0 4px',
                whiteSpace: 'nowrap',
              }}
            >
              Prompt {promptIndex + 1}/{promptCount}
            </span>
            <IconButton
              disabled={isLast}
              onClick={() => emit(EVENTS.NAV_FORWARD)}
              tooltip="Next prompt (→)"
              ariaLabel="Next prompt"
            >
              ▶
            </IconButton>
            <Separator />
          </>
        )}
        <IconButton
          onClick={() => emit(EVENTS.LEAVE_STAGE)}
          tooltip="Simulate leaving the stage (triggers beforeNext validation)"
          ariaLabel="Leave stage"
        >
          <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>⏏ Leave</span>
        </IconButton>
      </div>
    </>
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Interview Navigation',
    render: InterviewNavigationTool,
  });
});
