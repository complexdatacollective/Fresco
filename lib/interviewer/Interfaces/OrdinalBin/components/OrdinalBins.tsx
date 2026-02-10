import { type Stage } from '@codaco/protocol-validation';
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
          totalBins={bins.length}
        />
      ))}
    </>
  );
};

export default withNoSSRWrapper(OrdinalBins);
