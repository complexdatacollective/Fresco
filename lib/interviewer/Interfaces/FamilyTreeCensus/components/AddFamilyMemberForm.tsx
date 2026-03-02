import { type VariableValue } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '~/components/ui/Button';
import { type InterviewerIconName } from '~/components/ui/Icon';
import Dialog from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import ActionButton from '~/lib/interviewer/components/ActionButton';
import { useFamilyTreeStore } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { useDynamicFields } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/useDynamicFields';
import { useRelatives } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/useRelatives';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import { getNodeTypeLabel } from '~/lib/interviewer/selectors/session';

/**
 * Inner form content that can access the form store context.
 * Uses FormWithoutProvider since the parent already provides FormStoreProvider.
 */
const AddFamilyMemberFormContent = ({
  onSubmit,
}: {
  onSubmit: FormSubmitHandler;
}) => {
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const nodes = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );
  const edgesMap = useFamilyTreeStore((state) => state.network.edges);

  const { grandchildrenOptions, nieceOptions, firstCousinOptions } =
    useRelatives(nodesMap ?? new Map(), edgesMap ?? new Map());

  // Watch the relation field value to show conditional fields
  const relationValue = useFormStore(
    (state) => state.fields.get('relation')?.value as string | undefined,
  );
  const firstParentValue = useFormStore((state) => {
    // Find any field ending in 'Relation' that's not 'secondParentRelation'
    for (const [name, field] of state.fields.entries()) {
      if (name.endsWith('Relation') && name !== 'secondParentRelation') {
        return field.value as string | undefined;
      }
    }
    return undefined;
  });

  const { processedFields } = useDynamicFields({
    nodes,
    edges: edgesMap ?? new Map(),
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    relationValue: relationValue ?? null,
    firstParentValue: firstParentValue ?? null,
  });

  return (
    <FormWithoutProvider onSubmit={onSubmit} className="w-full">
      {processedFields.map((field) => (
        <Field
          key={field.variable}
          name={field.variable}
          label={field.fieldLabel}
          component={RadioGroupField}
          options={field.options as { label: string; value: string | number }[]}
          required
        />
      ))}
      <Button
        type="submit"
        aria-label="Submit"
        color="primary"
        className="mt-4 w-full"
      >
        Finished
      </Button>
    </FormWithoutProvider>
  );
};

const AddFamilyMemberForm = () => {
  const nodeType = useSelector(getNodeTypeLabel);
  const icon = useSelector(getNodeIconName);
  const addPlaceholderNode = useFamilyTreeStore(
    (state) => state.addPlaceholderNode,
  );

  const [show, setShow] = useState(false);

  const handleSubmit: FormSubmitHandler = useCallback(
    (values) => {
      const formValues = values as Record<string, VariableValue>;
      const relation = formValues.relation;
      const relationId =
        typeof relation === 'string'
          ? (formValues[`${relation}Relation`] as string | undefined)
          : undefined;
      const anchorId = typeof relationId === 'string' ? relationId : undefined;
      // Get second parent if selected (for cousins, nieces, nephews, grandchildren)
      const secondParentId =
        typeof formValues.secondParentRelation === 'string'
          ? formValues.secondParentRelation
          : undefined;
      if (typeof relation === 'string') {
        addPlaceholderNode(relation, anchorId, secondParentId);
      }
      setShow(false);
      return { success: true };
    },
    [addPlaceholderNode],
  );

  const handleClose = useCallback(() => {
    setShow(false);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute right-0 bottom-0 z-10 h-48 w-xl bg-[radial-gradient(ellipse_at_bottom_right,oklch(from_var(--background)_calc(l-0.1)_c_h),transparent_70%)]" />
      <AnimatePresence>
        <motion.div
          key="add-button"
          className="absolute right-14 bottom-5 z-20"
        >
          <ActionButton
            onClick={() => setShow(true)}
            iconName={icon as InterviewerIconName}
            title={`Add ${nodeType}...`}
          />
        </motion.div>
      </AnimatePresence>
      <Dialog
        open={show}
        title="Add Relative"
        closeDialog={handleClose}
        className="node-form"
      >
        <FormStoreProvider>
          <AddFamilyMemberFormContent onSubmit={handleSubmit} />
        </FormStoreProvider>
      </Dialog>
    </>
  );
};

export default AddFamilyMemberForm;
