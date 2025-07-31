import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useProtocolFieldProcessor } from '~/lib/form/hooks/useProtocolFieldProcessor';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import Overlay from '../../../containers/Overlay';
import { getNodeIconName } from '../../../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { getNodeTypeLabel, getStageSubject } from '../../../selectors/session';
import { useAppDispatch } from '../../../store';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

type NodeFormProps = {
  selectedNode: NcNode | null;
  form: TForm;
  disabled: boolean;
  onClose: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const NodeForm = (props: NodeFormProps) => {
  const { selectedNode, form, disabled, onClose, addNode } = props;

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const dispatch = useAppDispatch();

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => dispatch(updateNodeAction(payload)),
    [dispatch],
  );

  const processedFields = useProtocolFieldProcessor({
    fields: form.fields,
    validationMeta: {
      entityId: selectedNode?.[entityPrimaryKeyProperty],
    },
  });

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  // When a selected node is passed in, we are editing an existing node.
  // We need to show the form and populate it with the node's data.
  useEffect(() => {
    if (selectedNode) {
      setShow(true);
    }
  }, [selectedNode]);

  const handleClose = useCallback(() => {
    setShow(false);
    onClose();
  }, [onClose]);

  const variants = {
    initial: { opacity: 0, y: '100%' },
    animate: {
      opacity: 1,
      y: '0rem',
      transition: { delay: FIRST_LOAD_UI_ELEMENT_DELAY },
    },
  };

  const fields = [
    {
      variable: 'name',
      type: 'text',
      prompt: `Enter the ${nodeType} name`,
    },
    {
      variable: 'age',
      type: 'number',
      prompt: `Enter the ${nodeType} age`,
    },
  ];

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="name-generator-interface__add-button"
          variants={variants}
        >
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
        forceEnableFullscreen={useFullScreenForms}
        footer={
          !useFullScreenForms && (
            <Button
              key="submit"
              aria-label="Finished"
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
            >
              Finished
            </Button>
          )
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            ref={formRef}
            fields={fields}
            onSubmit={({ value }: { value: Record<string, VariableValue> }) => {
              if (!selectedNode) {
                addNode({ ...newNodeAttributes, ...value });
              } else {
                const selectedUID = selectedNode[entityPrimaryKeyProperty];
                void updateNode({
                  nodeId: selectedUID,
                  newAttributeData: value,
                });
              }

              setShow(false);
              onClose();
            }}
            initialValues={selectedNode?.[entityAttributesProperty]}
            focusFirstInput
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default NodeForm;
