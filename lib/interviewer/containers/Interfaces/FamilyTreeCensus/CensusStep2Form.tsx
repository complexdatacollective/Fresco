import { type Form as TForm } from '@codaco/protocol-validation';
import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import {
  getNodeTypeLabel,
  getStageMetadata,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import { getFamilyTreeNodes } from './censusMetadataUtil';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { useDynamicFields } from './useDynamicFields';
import { usePlaceholderNodeFormSubmit } from './usePlaceholderNodeFormSubmit';
import { useRelatives } from './useRelatives';

type NodeFormProps = {
  selectedNode: NcNode | null;
  form: TForm;
  disabled: boolean;
  onClose: () => void;
  setPlaceholderNodes: (nodes: PlaceholderNodeProps[]) => void;
  egoNodeId: string;
};

const CensusStep2Form = (props: NodeFormProps) => {
  const {
    selectedNode,
    form,
    disabled,
    onClose,
    setPlaceholderNodes,
    egoNodeId,
  } = props;

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);
  const stageMetadata = useSelector(getStageMetadata);
  const step2Nodes = getFamilyTreeNodes(stageMetadata!);

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    mother,
    father,
    grandchildrenOptions,
    nieceOptions,
    firstCousinOptions,
  } = useRelatives(egoNodeId, step2Nodes);

  const { processedFields } = useDynamicFields({
    step2Nodes,
    father,
    mother,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    show,
  });

  const { handleSubmit } = usePlaceholderNodeFormSubmit({
    egoNodeId,
    step2Nodes,
    newNodeAttributes,
    setPlaceholderNodes,
    setShow,
    onClose,
  });

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  const handleClose = useCallback(() => {
    setShow(false);
    onClose();
  }, [onClose]);

  return (
    <>
      <AnimatePresence>
        <motion.div className="name-generator-interface__add-button">
          <ActionButton
            disabled={disabled}
            onClick={() => setShow(true)}
            icon={icon}
            title={`Add ${nodeType}...`}
          />
        </motion.div>
      </AnimatePresence>
      <Overlay
        show={show}
        title={form.title}
        onClose={handleClose}
        className="node-form"
        footer={
          <Button
            key="submit"
            aria-label="Submit"
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
          >
            Finished
          </Button>
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            ref={formRef}
            fields={processedFields}
            handleSubmit={handleSubmit}
            getInitialValues={getInitialValues}
            focusFirstInput={true}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default CensusStep2Form;
