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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import Form from '~/lib/form/Form';
import { processProtocolFields } from '~/lib/form/utils/processProtocolFields';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getNodeTypeLabel, getStageSubject } from '../selectors/session';
import type { RootState } from '../store';
import { useAppDispatch } from '../store';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';
import Overlay from './Overlay';

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
  const store = useStore<RootState>();

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

  const processedFields = useMemo(() => {
    const validationMeta = {
      entityId: selectedNode?.[entityPrimaryKeyProperty],
    };

    return processProtocolFields({
      fields: form.fields,
      validationMeta,
      autoFocus: true,
      state: store.getState(),
    });
  }, [form.fields, selectedNode, store]);

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  const useFullScreenForms = false;

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!selectedNode) {
        addNode({ ...newNodeAttributes, ...value });
      } else {
        const selectedUID = selectedNode[entityPrimaryKeyProperty];
        void updateNode({ nodeId: selectedUID, newAttributeData: value });
      }

      setShow(false);
      onClose();
    },
    [selectedNode, newNodeAttributes, onClose, addNode, updateNode],
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
              aria-label="Submit"
              onClick={() => {
                formRef.current?.dispatchEvent(new Event('submit'));
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
            fields={processedFields}
            handleSubmit={handleSubmit}
            getInitialValues={getInitialValues}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default NodeForm;
