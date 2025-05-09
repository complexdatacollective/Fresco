import { type SortOrder, type Stage } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type FormSubmitHandler } from 'redux-form';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import CategoricalItem from '../../components/CategoricalItem';
import { updateNode as updateNodeAction } from '../../ducks/modules/session';
import { getNodeColor, getSubjectType } from '../../selectors/session';
import { useAppDispatch } from '../../store';
import { useNodeLabeller } from '../Interfaces/Anonymisation/useNodeLabel';
import Overlay from '../Overlay';
import OtherVariableForm from './OtherVariableForm';

const formatBinDetails = async (
  nodes: NcNode[],
  getNodeLabel: (n: NcNode) => Promise<string>,
) => {
  if (nodes.length === 0) {
    return '';
  }

  // todo: the following should be updated to reflect the sort order of the bins
  const name = await getNodeLabel(nodes[0]!);

  return `${name}${nodes.length > 1 ? ` and ${nodes.length - 1} other${nodes.length > 2 ? 's' : ''}` : ''}`;
};

const otherVariableWindowInitialState = {
  show: false,
};

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
    accentColor = null,
    activePromptVariable,
    promptOtherVariable = null,
    bin,
    index,
    sortOrder = [],
    onExpandBin,
    stage,
  } = props;

  const dispatch = useAppDispatch();
  const updateNode = (payload: {
    nodeId: NcNode[EntityPrimaryKey];
    newModelData?: Record<string, unknown>;
    newAttributeData: NcNode[EntityAttributesProperty];
  }) => dispatch(updateNodeAction(payload));

  const type = useSelector(getSubjectType);
  const nodeColor = useSelector(getNodeColor(type ?? ''));
  const labelNode = useNodeLabeller();

  const isOtherVariable = !!bin.otherVariable;
  const [otherVariableWindow, setOtherVariableWindow] = useState<
    Partial<{
      show: boolean;
      node: NcNode;
      label: string;
      color: string;
      initialValues: {
        otherVariable: string | null;
      };
    }>
  >(otherVariableWindowInitialState);

  const openOtherVariableWindow = async (node: NcNode) => {
    const otherVariable = get(
      getEntityAttributes(node),
      bin.otherVariable!,
      null,
    ) as string | null;

    const label = await labelNode(node);

    setOtherVariableWindow({
      show: true,
      node,
      label,
      color: nodeColor,
      initialValues: {
        otherVariable,
      },
    });
  };

  const closeOtherVariableWindow = () =>
    setOtherVariableWindow(otherVariableWindowInitialState);

  const setNodeCategory = (node: NcNode, category: string) => {
    console.log('setNodeCategory', node, category);
    const variable = bin.otherVariable ?? activePromptVariable;

    const resetVariable = bin.otherVariable
      ? activePromptVariable
      : promptOtherVariable;

    // categorical requires an array, otherVariable is a string
    const value = bin.otherVariable ? category : [category];

    if (getEntityAttributes(node)[variable] === value) {
      return;
    }

    updateNode({
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
      void openOtherVariableWindow(node);
      return;
    }

    setNodeCategory(node, binValue);
  };

  const handleClickItem = (node: NcNode) => {
    if (!isOtherVariable) {
      return;
    }
    void openOtherVariableWindow(node);
  };

  const handleSubmitOtherVariableForm: FormSubmitHandler<{
    otherVariable: string;
  }> = ({ otherVariable: value }) => {
    const { node } = otherVariableWindow;

    setNodeCategory(node!, value);
    closeOtherVariableWindow();
  };

  const handleExpandBin = (e: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onExpandBin(index);
  };

  const [binDetails, setBinDetails] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBinDetails() {
      const details = await formatBinDetails(bin.nodes, labelNode);
      setBinDetails(details);
    }
    void fetchBinDetails();
  }, [bin.nodes, labelNode]);

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
        details={binDetails}
        isExpanded={isExpanded}
        nodes={bin.nodes}
        sortOrder={sortOrder}
        stage={stage}
      />
      {isOtherVariable && (
        <Overlay
          style={{ maxWidth: '85ch' }}
          show={otherVariableWindow.show}
          onClose={closeOtherVariableWindow}
          onBlur={closeOtherVariableWindow}
        >
          {otherVariableWindow.show && (
            <OtherVariableForm
              label={otherVariableWindow.label}
              color={otherVariableWindow.color}
              otherVariablePrompt={bin.otherVariablePrompt}
              // @ts-expect-error not sure how to type this correctly
              onSubmit={handleSubmitOtherVariableForm}
              onCancel={closeOtherVariableWindow}
              initialValues={otherVariableWindow.initialValues}
            />
          )}
        </Overlay>
      )}
    </div>
  );
};

export default CategoricalListItem;
