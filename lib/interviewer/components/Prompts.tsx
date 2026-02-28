'use client';

import UIPrompts from '~/lib/interviewer/components/Prompts/Prompts';
import { usePrompts } from './Prompts/usePrompts';

const Prompts = ({ small }: { small?: boolean }) => {
  const { prompt, prompts } = usePrompts();

  return (
    <UIPrompts currentPromptId={prompt.id} prompts={prompts} small={small} />
  );
};

export default Prompts;
