import { type Form } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Surface from '~/components/layout/Surface';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { useScrolledToBottom } from '~/hooks/useScrolledToBottom';
import useDialog from '~/lib/dialogs/useDialog';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import useFormStore from '~/lib/form/hooks/useFormStore';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import {
  type BeforeNextFunction,
  type Direction,
  type StageProps,
} from '~/lib/interviewer/types';
import { type Subject } from '../../selectors/forms';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';

type SlidesFormProps<T extends NcNode | NcEdge = NcNode | NcEdge> = StageProps<
  'AlterForm' | 'AlterEdgeForm'
> & {
  items: T[];
  subject: Subject;
  updateItem: (
    id: string,
    newAttributeData: NcNode[EntityAttributesProperty],
  ) => void;
  onNavigateBack?: () => void;
  renderHeader: (item: T) => ReactNode;
};

const slideTransition = {
  type: 'spring' as const,
};

function SlideContent({
  item,
  form,
  subject,
  sentinelRef,
  submitButton,
  onUpdate,
}: {
  item: NcNode | NcEdge;
  form: Form;
  subject: Subject;
  sentinelRef: (node: HTMLDivElement | null) => void;
  submitButton: ReactNode;
  onUpdate: (
    id: string,
    newAttributeData: NcNode[EntityAttributesProperty],
  ) => void;
}) {
  const id = item[entityPrimaryKeyProperty];
  const rawAttributes = item[entityAttributesProperty];

  const initialValues: Record<string, FieldValue> | undefined = rawAttributes
    ? (Object.fromEntries(
        Object.entries(rawAttributes).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      ) as Record<string, FieldValue>)
    : undefined;

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    autoFocus: false,
    initialValues,
    subject,
  });

  const handleSubmit: FormSubmitHandler = (values) => {
    onUpdate(id, values as NcNode[EntityAttributesProperty]);
    return { success: true as const };
  };

  return (
    <div className="flex min-h-0 w-full shrink flex-col">
      <ScrollArea className="h-auto">
        <Surface maxWidth="2xl">
          <FormWithoutProvider
            onSubmit={handleSubmit}
            className="[&_.form-field-container]:break-inside-avoid"
          >
            {fieldComponents}
            {submitButton}
            <div ref={sentinelRef} aria-hidden />
          </FormWithoutProvider>
        </Surface>
      </ScrollArea>
    </div>
  );
}

function SlidesFormInner<T extends NcNode | NcEdge>({
  stage,
  getNavigationHelpers,
  items = [] as T[],
  subject,
  updateItem,
  onNavigateBack,
  renderHeader,
}: SlidesFormProps<T>) {
  const { moveForward } = getNavigationHelpers();
  const { openDialog } = useDialog();

  const { isValid, isDirty } = useFormMeta();
  const validateForm = useFormStore((s) => s.validateForm);
  const submitForm = useFormStore((s) => s.submitForm);
  const fieldCount = useFormStore((s) => s.fields.size);
  const formErrors = useFormStore((s) => s.errors);
  const formErrorsRef = useRef(formErrors);
  useLayoutEffect(() => {
    formErrorsRef.current = formErrors;
  }, [formErrors]);

  const { isAtBottom: hasScrolledToBottom, sentinelRef } =
    useScrolledToBottom();

  const [activeIndex, setActiveIndex] = useState(0);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [pendingDirection, setPendingDirection] = useState<Direction | null>(
    null,
  );

  useEffect(() => {
    setIsReadyForNext(false);
  }, [activeIndex, setIsReadyForNext]);

  useEffect(() => {
    setIsReadyForNext(isValid && hasScrolledToBottom && fieldCount > 0);
  }, [setIsReadyForNext, isValid, hasScrolledToBottom, fieldCount]);

  const beforeNext: BeforeNextFunction = async (direction: Direction) => {
    if (items.length === 0) {
      return true;
    }

    setPendingDirection(direction);

    if (direction === 'backwards') {
      if (activeIndex === 0) {
        if (onNavigateBack) {
          onNavigateBack();
          return false;
        }
        return true;
      }

      const formIsValid = await validateForm();

      if (!formIsValid && isDirty) {
        const confirm = await openDialog({
          type: 'choice',
          title: 'Discard changes?',
          description:
            'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
          intent: 'destructive',
          actions: {
            primary: { label: 'Discard changes', value: true },
            cancel: { label: 'Go back', value: false },
          },
        });

        if (confirm) {
          setActiveIndex((prev) => prev - 1);
        }
        return false;
      }

      if (formIsValid) {
        await submitForm();
      }

      setActiveIndex((prev) => prev - 1);
      return false;
    }

    // Forward direction
    const formIsValid = await validateForm();

    if (!formIsValid) {
      focusFirstError(formErrorsRef.current);
      return false;
    }

    await submitForm();

    if (activeIndex >= items.length - 1) {
      return true;
    }

    setActiveIndex((prev) => prev + 1);
    return false;
  };

  useBeforeNext(beforeNext);

  const handleEnterSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    moveForward();
    e.preventDefault();
  };

  const currentItem = items[activeIndex];

  if (!currentItem) {
    return null;
  }

  return (
    <div className="flex w-full flex-auto overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeIndex}
          className="relative flex min-h-0 w-full shrink grow basis-auto flex-col items-center justify-center"
          animate={{ y: 0, opacity: 1 }}
          initial={{ y: '35%', opacity: 0 }}
          exit={{
            y: pendingDirection === 'forwards' ? '-35%' : '35%',
            opacity: 0,
          }}
          transition={slideTransition}
        >
          {renderHeader(currentItem)}
          <SlideContent
            key={activeIndex}
            item={currentItem}
            form={stage.form}
            subject={subject}
            sentinelRef={sentinelRef}
            onUpdate={updateItem}
            submitButton={
              <button
                type="submit"
                key="submit"
                aria-label="Submit"
                hidden
                onClick={handleEnterSubmit}
              />
            }
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function SlidesForm<T extends NcNode | NcEdge>(
  props: SlidesFormProps<T>,
) {
  return (
    <FormStoreProvider>
      <SlidesFormInner {...props} />
    </FormStoreProvider>
  );
}
