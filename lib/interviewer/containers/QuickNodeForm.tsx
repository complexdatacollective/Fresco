import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useForm, useStore } from '@tanstack/react-form';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ActionButton, Node } from '~/lib/ui/components';
import QuickAdd from '~/lib/ui/components/Fields/QuickAdd';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getCodebookVariablesForSubjectType } from '../selectors/protocol';
import {
  getNetworkEntitiesForType,
  getNodeColor,
  getNodeTypeLabel,
  getStageSubject,
} from '../selectors/session';
import { getTanStackNativeValidators } from '../utils/field-validation';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

const containerVariants = {
  animate: (wide: boolean) =>
    wide
      ? {
          width: 'var(--open-width)',
          y: '0rem',
          transition: {
            duration: 0,
          },
        }
      : {
          width: 'var(--closed-width)',
          y: '0rem',
          transition: {
            delay: FIRST_LOAD_UI_ELEMENT_DELAY,
          },
        },
  initial: {
    y: '100%',
  },
};

const itemVariants = {
  show: {
    opacity: 1,
    x: '0px',
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
  hide: {
    opacity: 0,
    x: '10rem',
  },
};

type QuickAddFormProps = {
  disabled: boolean;
  targetVariable: string;
  onShowForm: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const QuickAddForm = ({
  disabled,
  targetVariable,
  onShowForm,
  addNode,
}: QuickAddFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [showTooltip, setShowTooltip] = useState(false);

  const subject = useSelector(getStageSubject)!;
  const codebookVariables = useSelector(getCodebookVariablesForSubjectType);
  const variable = codebookVariables[targetVariable];
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const nodeColor = useSelector(getNodeColor(subject.type));
  const icon = useSelector(getNodeIconName);
  const networkEntities = useSelector(getNetworkEntitiesForType);

  const validators = getTanStackNativeValidators(variable?.validation ?? {}, {
    codebookVariables,
    networkEntities,
    currentEntityId: undefined, // No current entity ID in this context
  });
  
  console.log('Variable validation config:', variable?.validation);
  console.log('Generated validators:', validators);

  const form = useForm({
    defaultValues: {
      nodeLabel: '',
    },
  });

  const handleBlur = () => {
    form.reset();
    setShowForm(false);
  };

  // Handle showing/hiding the tooltip based on the nodeLabel
  // Logic: wait 5 seconds after the user last typed something
  const currentNodeLabel = useStore(
    form.store,
    (state) => state.values.nodeLabel,
  );

  useEffect(() => {
    if (currentNodeLabel !== '') {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);

      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
    } else {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
    }
  }, [currentNodeLabel]);

  const isValid =
    useStore(form.store, (state) => state.isFormValid) &&
    currentNodeLabel !== '';

  const handleSubmit = async () => {
    if (!disabled) {
      // Validate the form first
      await form.validateAllFields('submit');
      
      // Get the current form state after validation
      const formState = form.state;
      const fieldState = formState.fieldMeta.nodeLabel;
      const hasErrors = fieldState?.errors && fieldState.errors.length > 0;
      
      console.log('Form validation state:', {
        isFormValid: formState.isFormValid,
        fieldErrors: fieldState?.errors,
        hasErrors,
        value: currentNodeLabel,
      });
      
      // Only submit if form is valid and has no errors
      if (formState.isFormValid && !hasErrors) {
        void addNode({
          ...newNodeAttributes,
          [targetVariable]: currentNodeLabel,
        });
        form.reset();
      } else {
        console.log('Submission blocked due to validation errors');
      }
    }
  };

  const handleShowForm = useCallback(() => {
    setShowForm(true);
    onShowForm();
  }, [onShowForm]);

  useEffect(() => {
    if (disabled) {
      setShowForm(false);
      form.reset();
    }
  }, [disabled, form]);

  return (
    <motion.div
      className="flip-form"
      variants={containerVariants}
      custom={showForm}
    >
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="form-container"
            className="form-container"
            initial={itemVariants.hide}
            animate={itemVariants.show}
            exit={itemVariants.hide}
          >
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <form.Field
                name="nodeLabel"
                validators={{
                  onChange: ({ value }) => {
                    console.log('Field onChange validator called with value:', value);
                    const result = validators.onChange({
                      value,
                      fieldApi: {
                        form: { store: { state: { values: form.state.values } } },
                        name: 'nodeLabel',
                      },
                    });
                    console.log('Validator result:', result);
                    return result;
                  },
                  onSubmit: ({ value }) => {
                    console.log('Field onSubmit validator called with value:', value);
                    const result = validators.onChange({
                      value,
                      fieldApi: {
                        form: { store: { state: { values: form.state.values } } },
                        name: 'nodeLabel',
                      },
                    });
                    console.log('Validator result:', result);
                    return result;
                  },
                }}
              >
                {(field) => (
                  <QuickAdd
                    input={{
                      name: field.name,
                      value: field.state.value,
                      onChange: field.handleChange,
                      onBlur: () => {
                        field.handleBlur();
                        handleBlur();
                      },
                    }}
                    meta={{
                      error: field.state.meta.errors?.[0] ?? null,
                      invalid: field.state.meta.errors.length > 0,
                      touched: field.state.meta.isTouched,
                    }}
                    targetVariable={targetVariable}
                    disabled={disabled}
                    onSubmit={() => void handleSubmit()}
                    showTooltip={showTooltip}
                    tooltipText={`Press enter to add ${nodeType}...`}
                  />
                )}
              </form.Field>
            </form>
            <Node
              label={currentNodeLabel}
              selected={isValid}
              color={nodeColor}
              handleClick={handleSubmit}
            />
          </motion.div>
        )}
        {!showForm && (
          <motion.div
            key="button-container"
            className="button-container"
            initial={itemVariants.hide}
            animate={itemVariants.show}
            exit={itemVariants.hide}
          >
            <ActionButton
              disabled={disabled}
              onClick={handleShowForm}
              icon={icon}
              title={`Add ${nodeType}...`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuickAddForm;
