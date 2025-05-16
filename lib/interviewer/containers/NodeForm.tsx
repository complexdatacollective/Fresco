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
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { submit } from 'redux-form';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getNodeTypeLabel, getStageSubject } from '../selectors/session';
import { useAppDispatch } from '../store';
import Form from './Form';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';
import Overlay from './Overlay';

const reduxFormName = 'NODE_FORM';

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

  const dispatch = useAppDispatch();
  const submitForm = () => dispatch(submit(reduxFormName));

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => dispatch(updateNodeAction(payload)),
    [dispatch],
  );

  const useFullScreenForms = false;

  const handleSubmit = useCallback(
    (rawFormData: Record<string, VariableValue>) => {
      // This is needed because redux-form is passing its state directly, causing
      // a mutation error.
      const formData = structuredClone(rawFormData);
      if (!selectedNode) {
        addNode({ ...newNodeAttributes, ...formData });
      } else {
        const selectedUID = selectedNode[entityPrimaryKeyProperty];
        void updateNode({ nodeId: selectedUID, newAttributeData: formData });
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
              type="submit"
              onClick={submitForm}
            >
              Finished
            </Button>
          )
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            {...form}
            subject={subject}
            initialValues={selectedNode?.[entityAttributesProperty]}
            onSubmit={handleSubmit}
            autoFocus
            form={reduxFormName}
            validationMeta={{
              entityId: selectedNode?.[entityPrimaryKeyProperty],
            }}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default NodeForm;
