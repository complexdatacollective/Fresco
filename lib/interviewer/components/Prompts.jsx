import UIPrompts from '~/lib/ui/components/Prompts/Prompts';
import { usePrompts } from '../behaviours/withPrompt';

const Prompts = () => {
  const { prompt, prompts } = usePrompts();

  return <UIPrompts currentPromptId={prompt.id} prompts={prompts} />;
};

export default Prompts;
