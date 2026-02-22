import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '~/components/ui/Button';
import Icon, { type InterviewerIconName } from '~/components/ui/Icon';
import Dialog from '~/lib/dialogs/Dialog';
import Form from '~/lib/form/components/Form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { getNodeIconName } from '../../../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { useAppDispatch } from '../../../store';
import { cx } from '~/utils/cva';

const PARTICLE_COUNT = 50;
const PARTICLE_ANGLES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2,
);

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

  const [buttonScope, animate] = useAnimate<HTMLButtonElement>();
  const particlesRef = useRef<(HTMLDivElement | null)[]>([]);

  const celebrate = useCallback(() => {
    const button = buttonScope.current;
    if (!button) return;

    const circle = button.querySelector('[data-toggle-circle]');
    if (circle) {
      void animate(
        circle,
        { scale: [0.6, 1] },
        { type: 'spring', stiffness: 500, damping: 8, mass: 0.8 },
      );
    }

    particlesRef.current.forEach((el, i) => {
      if (!el) return;
      const angle = PARTICLE_ANGLES[i];
      if (angle === undefined) return;
      const distance = 300 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const duration = 0.6 + Math.random() * 0.5;
      void animate(
        el,
        { x: [0, x], y: [0, y], opacity: [1, 0], scale: [1, 0] },
        { duration, ease: 'easeOut' },
      );
    });
  }, [animate, buttonScope]);

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
    },
  };

  // Convert null values to undefined for form compatibility
  const initialValues = selectedNode?.[entityAttributesProperty]
    ? Object.fromEntries(
        Object.entries(selectedNode[entityAttributesProperty]).map(
          ([key, value]) => [key, value ?? undefined],
        ),
      )
    : undefined;

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    autoFocus: true,
    initialValues,
  });

  // Handle form submission
  const handleSubmit: FormSubmitHandler = useCallback(
    (values) => {
      const variableValues = values as Record<string, VariableValue>;
      const isNewNode = !selectedNode;

      if (isNewNode) {
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

      if (isNewNode) {
        celebrate();
      }

      return { success: true as const };
    },
    [selectedNode, addNode, newNodeAttributes, updateNode, onClose, celebrate],
  );

  return (
    <>
      <div className="pointer-events-none absolute right-0 bottom-0 z-10 h-48 w-xl bg-[radial-gradient(ellipse_at_bottom_right,oklch(from_var(--background)_calc(l-0.1)_c_h),transparent_70%)]" />
      <AnimatePresence>
        <motion.div
          key="add-button"
          className="absolute right-14 bottom-5 z-20"
          variants={variants}
        >
          <button
            ref={buttonScope}
            onClick={() => setShow(true)}
            disabled={disabled}
            aria-label="Add a person"
            className="focusable relative aspect-square size-28 rounded-full"
          >
            {/* {PARTICLE_ANGLES.map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  particlesRef.current[i] = el;
                }}
                className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-1 -translate-1/2 rounded-full bg-white opacity-0"
              />
            ))} */}
            <motion.div
              data-toggle-circle
              className={cx(
                'elevation-high relative flex aspect-square size-28 items-center justify-center overflow-hidden rounded-full transition-[background-color,filter] duration-300 [&>.lucide]:aspect-square [&>.lucide]:h-16 [&>.lucide]:w-auto',
                disabled ? 'cursor-not-allowed saturate-0' : 'cursor-pointer',
              )}
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <motion.div className="h-full">
                <Icon
                  name={icon as InterviewerIconName}
                  className="h-full w-auto"
                />
              </motion.div>
            </motion.div>
            <motion.div className="bg-platinum text-charcoal absolute -top-2 -right-4 flex size-10 items-center justify-center rounded-full shadow-lg">
              <Plus className="size-6" size={12} />
            </motion.div>
          </button>
        </motion.div>
      </AnimatePresence>
      <Dialog
        open={show}
        title={form.title}
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
        <Form id="node-form" onSubmit={handleSubmit} className="w-full">
          {fieldComponents}
        </Form>
      </Dialog>
    </>
  );
};

export default NodeForm;
