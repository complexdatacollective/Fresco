import { type Stage } from '@codaco/protocol-validation';
import color from 'color';
import { useMemo } from 'react';
import { getCSSVariableAsString } from '~/lib/legacy-ui/utils/CSSVariables';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { useOrdinalBins, type OrdinalBinPrompt } from '../useOrdinalBins';
import OrdinalBinItem from './OrdinalBinItem';

type OrdinalBinsProps = {
  stage: Extract<Stage, { type: 'OrdinalBin' }>;
  prompt: OrdinalBinPrompt | null;
};

const OrdinalBins = (props: OrdinalBinsProps) => {
  const { stage, prompt } = props;
  const { bins, activePromptVariable } = useOrdinalBins();

  const promptColor = useMemo(() => {
    return prompt?.color
      ? color(getCSSVariableAsString(`--nc-${prompt.color}`))
      : color(getCSSVariableAsString('--nc-ord-color-seq-1'));
  }, [prompt?.color]);

  const backgroundColor = useMemo(
    () => color(getCSSVariableAsString('--nc-background')),
    [],
  );

  if (!activePromptVariable || !prompt) {
    return null;
  }

  return (
    <>
      {bins.map((bin, index) => (
        <OrdinalBinItem
          key={index}
          bin={bin}
          index={index}
          activePromptVariable={activePromptVariable}
          stageId={stage.id}
          promptId={prompt.id}
          sortOrder={prompt.binSortOrder}
          promptColor={promptColor}
          backgroundColor={backgroundColor}
          totalBins={bins.length}
        />
      ))}
    </>
  );
};

export default withNoSSRWrapper(OrdinalBins);
