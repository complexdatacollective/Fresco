import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submit } from 'redux-form';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '~/lib/shared-consts';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import Form from './Form';
import FormWizard from './FormWizard';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';
import Overlay from './Overlay';

const reduxFormName = 'NODE_FORM';

const NodeForm = (props) => {
  const {
    subject,
    selectedNode,
    form,
    disabled,
    icon,
    nodeType,
    newNodeAttributes,
    onClose,
    addNode,
    updateNode,
  } = props;

  const [show, setShow] = useState(false);

  const dispatch = useDispatch();
  const submitForm = () => dispatch(submit(reduxFormName));

  const useFullScreenForms = useSelector(
    (state) => state.deviceSettings.useFullScreenForms,
  );

  const handleSubmit = useCallback(
    (formData) => {
      if (!selectedNode) {
        /**
         *  addNode(modelData, attributeData);
         */
        addNode({ ...newNodeAttributes, ...formData });
      } else {
        /**
         * updateNode(nodeId, newModelData, newAttributeData)
         */
        const selectedUID = selectedNode[entityPrimaryKeyProperty];
        updateNode(selectedUID, {}, formData);
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

  const FormComponent = useMemo(() => {
    if (useFullScreenForms) {
      return FormWizard;
    }

    const DynamicForm = (formProps) => (
      <Scroller>
        <Form {...formProps} />
      </Scroller>
    );

    return DynamicForm;
  }, [useFullScreenForms]);

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
        <FormComponent
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
      </Overlay>
    </>
  );
};

export default NodeForm;
