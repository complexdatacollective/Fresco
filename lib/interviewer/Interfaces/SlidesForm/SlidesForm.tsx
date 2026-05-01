import { type Form } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Surface from '@codaco/fresco-ui/layout/Surface';
import { ScrollArea } from '@codaco/fresco-ui/ScrollArea';
import { useScrolledToBottom } from '~/hooks/useScrolledToBottom';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import { type FieldValue } from '@codaco/fresco-ui/form/Field/types';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import { useFormMeta } from '@codaco/fresco-ui/form/hooks/useFormState';
import useFormStore from '@codaco/fresco-ui/form/hooks/useFormStore';
import useProtocolForm from '~/lib/interviewer/forms/useProtocolForm';
import FormStoreProvider, {
  FormStoreContext,
} from '@codaco/fresco-ui/form/store/formStoreProvider';
import { type FormSubmitHandler } from '@codaco/fresco-ui/form/store/types';
import { focusFirstError } from '@codaco/fresco-ui/form/utils/focusFirstError';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import {
  type BeforeNextFunction,
  type Direction,
} from '~/lib/interviewer/types';
import useInterviewNavigation from '../../hooks/useInterviewNavigation';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { type Subject } from '../../selectors/forms';

type SlidesFormProps<T extends NcNode | NcEdge = NcNode | NcEdge> = {
  form: Form;
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
  stiffness: 200,
  damping: 15,
};

type SlideHandle = {
  validate: () => Promise<boolean>;
  submit: () => Promise<void>;
  isDirty: () => boolean;
  focusFirstError: () => void;
};

type SlideContentProps = {
  item: NcNode | NcEdge;
  form: Form;
  subject: Subject;
  header: ReactNode;
  submitButton: ReactNode;
  onUpdate: (
    id: string,
    newAttributeData: NcNode[EntityAttributesProperty],
  ) => void;
  onReadyChange: (ready: boolean) => void;
};

const SlideContentInner = forwardRef<SlideHandle, SlideContentProps>(
  function SlideContentInner(
    { item, form, subject, header, submitButton, onUpdate, onReadyChange },
    ref,
  ) {
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
      currentEntityId: id,
    });

    const handleSubmit: FormSubmitHandler = (values) => {
      onUpdate(id, values as NcNode[EntityAttributesProperty]);
      return { success: true as const };
    };

    const storeApi = useContext(FormStoreContext);
    const { isValid } = useFormMeta();
    const fieldCount = useFormStore((s) => s.fields.size);
    const formErrors = useFormStore((s) => s.errors);
    const formErrorsRef = useRef(formErrors);
    useLayoutEffect(() => {
      formErrorsRef.current = formErrors;
    }, [formErrors]);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: scrollAreaRef });
    const headerScale = useTransform(scrollY, [0, 150], [1, 0.75]);
    const { hasScrolledToBottom, sentinelRef } =
      useScrolledToBottom(scrollAreaRef);

    useEffect(() => {
      onReadyChange(isValid && fieldCount > 0 && hasScrolledToBottom);
    }, [isValid, fieldCount, hasScrolledToBottom, onReadyChange]);

    useImperativeHandle(ref, () => ({
      validate: () => storeApi!.getState().validateForm(),
      submit: () => storeApi!.getState().submitForm(),
      isDirty: () => storeApi!.getState().isDirty,
      focusFirstError: () => focusFirstError(formErrorsRef.current),
    }));

    return (
      <ScrollArea
        ref={scrollAreaRef}
        className="size-full"
        viewportClassName="flex flex-col gap-4 items-center h-full"
      >
        <div className="phone-landscape:py-4 tablet-landscape:py-6 phone-landscape:mx-4 tablet-landscape:mx-6 mx-2 my-auto flex flex-col gap-4 py-2">
          <div className="sticky top-0 z-10 shrink-0">
            <motion.div
              className="flex justify-center"
              style={{
                scale: headerScale,
                transformOrigin: 'top center',
              }}
            >
              {header}
            </motion.div>
          </div>
          <Surface noContainer className="tablet:min-w-lg max-w-2xl shrink-0">
            <FormWithoutProvider
              onSubmit={handleSubmit}
              className="[&_.form-field-container]:break-inside-avoid"
            >
              {fieldComponents}
              {submitButton}
            </FormWithoutProvider>
          </Surface>
        </div>
        <div ref={sentinelRef} aria-hidden />
      </ScrollArea>
    );
  },
);

const SlideContent = forwardRef<SlideHandle, SlideContentProps>(
  function SlideContent(props, ref) {
    return (
      <FormStoreProvider>
        <SlideContentInner ref={ref} {...props} />
      </FormStoreProvider>
    );
  },
);

export default function SlidesForm({
  items = [],
  subject,
  updateItem,
  onNavigateBack,
  renderHeader,
  form,
}: SlidesFormProps) {
  const { confirm } = useDialog();

  const { moveForward } = useInterviewNavigation();

  const slideRef = useRef<SlideHandle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideCallbackRef = useCallback((handle: SlideHandle | null) => {
    if (handle !== null) {
      slideRef.current = handle;
    }
  }, []);

  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [slideReady, setSlideReady] = useState(false);

  const [pendingDirection, setPendingDirection] = useState<Direction | null>(
    null,
  );

  useEffect(() => {
    setIsReadyForNext(false);
    setSlideReady(false);
  }, [activeIndex, setIsReadyForNext]);

  useEffect(() => {
    setIsReadyForNext(slideReady);
  }, [setIsReadyForNext, slideReady]);

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

      const formIsValid = await slideRef.current?.validate();

      if (!formIsValid && slideRef.current?.isDirty()) {
        await confirm({
          title: 'Discard changes?',
          description:
            'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
          confirmLabel: 'Discard changes',
          cancelLabel: 'Cancel',
          intent: 'destructive',
          onConfirm: () => {
            setActiveIndex((prev) => prev - 1);
          },
        });
        return false;
      }

      if (formIsValid) {
        await slideRef.current?.submit();
      }

      setActiveIndex((prev) => prev - 1);
      return false;
    }

    // Forward direction
    const formIsValid = await slideRef.current?.validate();

    if (!formIsValid) {
      slideRef.current?.focusFirstError();
      return false;
    }

    await slideRef.current?.submit();

    if (activeIndex >= items.length - 1) {
      return true;
    }

    setActiveIndex((prev) => prev + 1);
    return false;
  };

  useBeforeNext(beforeNext);

  const handleEnterSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await moveForward();
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
          className="relative flex min-h-0 w-full shrink grow basis-auto flex-col items-center"
          animate={{ y: 0, opacity: 1 }}
          initial={{ y: '35%', opacity: 0 }}
          exit={{
            y: pendingDirection === 'forwards' ? '-35%' : '35%',
            opacity: 0,
          }}
          transition={slideTransition}
        >
          <SlideContent
            ref={slideCallbackRef}
            item={currentItem}
            form={form}
            subject={subject}
            header={renderHeader(currentItem)}
            onUpdate={updateItem}
            onReadyChange={setSlideReady}
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
