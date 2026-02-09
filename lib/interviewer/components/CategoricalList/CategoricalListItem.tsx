import { type SortOrder, type Stage } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useState } from 'react';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { updateNode as updateNodeAction } from '../../ducks/modules/session';
import { useAppDispatch } from '../../store';
import CategoricalItem from '../CategoricalItem';
import Overlay from '../Overlay';
import OtherVariableForm from './OtherVariableForm';

type Props = {
  id: string;
  size: number;
  isExpanded: boolean;
  accentColor: string;
  activePromptVariable: string;
  promptOtherVariable?: string | null;
  bin: {
    label: string;
    nodes: NcNode[];
    otherVariable?: string;
    otherVariablePrompt?: string;
    value: string;
  };
  index: number;
  sortOrder?: SortOrder[];
  onExpandBin: (index: number) => void;
  stage: Extract<Stage, { type: 'CategoricalBin' }>;
};

const CategoricalListItem = (props: Props) => {
  const {
    id,
    size = 0,
    isExpanded,
    accentColor,
    activePromptVariable,
    promptOtherVariable = null,
    bin,
    index,
    onExpandBin,
  } = props;

  const dispatch = useAppDispatch();
  const updateNode = (payload: {
    nodeId: NcNode[EntityPrimaryKey];
    newModelData?: Record<string, unknown>;
    newAttributeData: NcNode[EntityAttributesProperty];
  }) => dispatch(updateNodeAction(payload));

  const isOtherVariable = !!bin.otherVariable;
  const [showOther, setShowOther] = useState<NcNode | null>(null);

  const setNodeCategory = (node: NcNode, category: string) => {
    const variable = bin.otherVariable ?? activePromptVariable;

    const resetVariable = bin.otherVariable
      ? activePromptVariable
      : promptOtherVariable;

    // categorical requires an array, otherVariable is a string
    const value = bin.otherVariable ? category : [category];

    if (getEntityAttributes(node)[variable] === value) {
      return;
    }

    void updateNode({
      nodeId: node[entityPrimaryKeyProperty],
      newAttributeData: {
        [variable]: value,
        // reset is used to clear the variable when a node is moved to a different bin
        ...(!!resetVariable && { [resetVariable]: null }),
      },
    });
  };

  const handleDrop = (args: { meta: NcNode }) => {
    const { meta: node } = args;
    const binValue = bin.value;

    if (isOtherVariable) {
      void setShowOther(node);
      return;
    }

    setNodeCategory(node, binValue);
  };

  const handleClickItem = (node: NcNode) => {
    if (!isOtherVariable) {
      return;
    }
    void setShowOther(node);
  };

  const handleSubmitOtherVariableForm = ({
    otherVariable: value,
  }: {
    otherVariable: string;
  }) => {
    setNodeCategory(showOther!, value);
    setShowOther(null);
  };

  const handleExpandBin = () => {
    onExpandBin(index);
  };

  return (
    <div
      className="categorical-list__item"
      style={{ width: `${size}px`, height: `${size}px` }}
      key={index}
      onClick={handleExpandBin}
    >
      <CategoricalItem
        id={id}
        key={index}
        label={bin.label}
        accentColor={accentColor}
        onDrop={handleDrop}
        onClick={handleExpandBin}
        onClickItem={handleClickItem}
        isExpanded={isExpanded}
        nodes={bin.nodes}
      />
      {isOtherVariable && (
        <Overlay
          show={showOther !== null}
          onClose={() => setShowOther(null)}
          title={bin.otherVariablePrompt ?? 'Other'}
        >
          {showOther && (
            <OtherVariableForm
              node={showOther}
              prompt={bin.otherVariablePrompt!}
              onSubmit={handleSubmitOtherVariableForm}
              onCancel={() => setShowOther(null)}
              initialValues={{
                otherVariable: getEntityAttributes(showOther)[
                  bin.otherVariable!
                ] as string,
              }}
            />
          )}
        </Overlay>
      )}
    </div>
  );
};

export default CategoricalListItem;
