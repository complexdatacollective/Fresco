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
import ActionButton from '~/components/interview/ActionButton';
import Button from '~/components/ui/Button';
import { ControlledDialog } from '~/lib/dialogs/ControlledDialog';
import { Form } from '~/lib/form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { getNodeIconName } from '../../../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { useAppDispatch } from '../../../store';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '../../utils/constants';

type NodeFormProps = {
  selectedNode: NcNode | null;
  form: TForm;
  disabled: boolean;
  onClose: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const NodeForm = (props: NodeFormProps) => {
  const { selectedNode, form, disabled, onClose, addNode } = props;

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);

  const [show, setShow] = useState(false);

  const dispatch = useAppDispatch();

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => dispatch(updateNodeAction(payload)),
    [dispatch],
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

  const fieldComponents = useProtocolForm({
    fields: form.fields,
    autoFocus: true,
    initialValues: selectedNode?.[entityAttributesProperty],
  });

  // Handle form submission
  const handleSubmit = useCallback(
    (values: Record<string, unknown>) => {
      const variableValues = values as Record<string, VariableValue>;

      if (!selectedNode) {
        addNode({ ...newNodeAttributes, ...variableValues });
      } else {
        const selectedUID = selectedNode[entityPrimaryKeyProperty];
        void updateNode({
          nodeId: selectedUID,
          newAttributeData: variableValues,
        });
      }

      setShow(false);
      onClose();
      return Promise.resolve({ success: true as const });
    },
    [selectedNode, addNode, newNodeAttributes, updateNode, onClose],
  );

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
            iconName={icon}
            title={`Add...`}
          />
        </motion.div>
      </AnimatePresence>
      <ControlledDialog
        open={show}
        title={form.title!}
        description="Please fill out the form below. Fields marked with * are required."
        closeDialog={handleClose}
        footer={
          <Button
            key="submit"
            type="submit"
            form="node-form"
            aria-label="Finished"
            color="primary"
          >
            Finished
          </Button>
        }
      >
        <Form
          id="node-form"
          onSubmit={handleSubmit}
          className="w-full"
          key={`${show}`}
        >
          {fieldComponents}
        </Form>
      </ControlledDialog>
    </>
  );
};

export default NodeForm;
