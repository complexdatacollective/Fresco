import { type Prompt, type Stage } from '@codaco/protocol-validation';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../behaviours/withPrompt';
import CategoricalList from '../components/CategoricalList';
import MultiNodeBucket from '../components/MultiNodeBucket';
import Prompts from '../components/Prompts';
import { type StageProps } from '../components/Stage';
import { getUncategorisedNodes } from '../selectors/interface';
import { type ProcessedSortRule } from '../utils/createSorter';

type CategoricalBinStageProps = StageProps & {
  stage: Extract<
    Stage,
    {
      type: 'CategoricalBin';
    }
  >;
};

/**
 * CategoricalBin Interface
 */
const CategoricalBin = (props: CategoricalBinStageProps) => {
  const [expandedBinIndex, setExpandBinIndex] = useState<number | null>(null);
  const { stage } = props;
  const { prompt } = usePrompts<
    Prompt & {
      bucketSortOrder: ProcessedSortRule[];
    }
  >();

  const handleExpandBin = useCallback((index: number | null) => {
    setExpandBinIndex(index);
  }, []);

  const uncategorizedNodes = useSelector(getUncategorisedNodes);

  return (
    <div className="categorical-bin-interface">
      <div className="categorical-bin-interface__prompt">
        <Prompts />
      </div>
      <div
        className="categorical-bin-interface__bucket"
        onClick={() => handleExpandBin(null)}
      >
        <MultiNodeBucket
          nodes={uncategorizedNodes}
          listId={`${stage.id}_${prompt?.id}_CAT_BUCKET`}
          sortOrder={prompt?.bucketSortOrder}
        />
      </div>
      <CategoricalList
        key={prompt?.id}
        expandedBinIndex={expandedBinIndex}
        onExpandBin={handleExpandBin}
      />
    </div>
  );
};

export default withNoSSRWrapper(CategoricalBin);
