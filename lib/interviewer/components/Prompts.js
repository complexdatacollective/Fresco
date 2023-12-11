import React from 'react';
import UIPrompts from '~/lib/ui/components/Prompts/Prompts';
import { useSelector } from 'react-redux';
import { usePrompts } from '../behaviours/withPrompt';

const Prompts = () => {
  const { currentPrompt, prompts } = usePrompts();
  const speakable = useSelector((state) => state.deviceSettings.enableExperimentalTTS);

  return <UIPrompts speakable={speakable} currentPromptId={currentPrompt.id} prompts={prompts} />;
};

export default Prompts;
