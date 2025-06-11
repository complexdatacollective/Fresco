import { type VariableValue } from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useStore as useReduxStore, useSelector } from 'react-redux';
import { useTanStackForm } from '../../hooks/useTanStackForm';
import { makeEnrichFieldsWithCodebookMetadata } from '../../selectors/forms';
import { getCodebookVariablesForSubjectType } from '../../selectors/protocol';
import { getNetworkEntitiesForType, getStageSubject } from '../../selectors/session';
import { type AppStore } from '../../store';
import { getTanStackNativeValidators } from '../../utils/field-validation';
import { type ValidationContext } from '../../utils/formContexts';
import Field from './Field';
import type { FieldType, FormProps, TanStackFormErrors } from './types';

const getScrollParent = (node: HTMLElement): Element => {
  const regex = /(auto|scroll)/;
  const parents = (_node: Element, ps: Element[]): Element[] => {
    if (_node.parentNode === null) {
      return ps;
    }
    return parents(_node.parentNode as Element, ps.concat([_node]));
  };

  const style = (_node: Element, prop: string): string =>
    getComputedStyle(_node, null).getPropertyValue(prop);

  const overflow = (_node: Element): string =>
    style(_node, 'overflow') +
    style(_node, 'overflow-y') +
    style(_node, 'overflow-x');

  const scroll = (_node: Element): boolean => regex.test(overflow(_node));

  const scrollParent = (_node: Element): Element => {
    if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
      return document.scrollingElement ?? document.documentElement;
    }

    const ps = parents(_node.parentNode as Element, []);

    for (const p of ps) {
      if (scroll(p)) {
        return p;
      }
    }

    return document.scrollingElement ?? document.documentElement;
  };

  return scrollParent(node);
};

const scrollToFirstError = (errors: TanStackFormErrors) => {
  // Todo: first item is an assumption that may not be valid. Should iterate and check
  // vertical position to ensure it is actually the "first" in page order (topmost).
  if (!errors) return;

  const firstError = Object.keys(errors)[0];

  // All Fields have a name corresponding to variable ID so look this up.
  // When used on alter form, multiple forms can be differentiated by the active slide
  // class. This needs priority, so look it up first.
  const el: HTMLElement | null =
    document.querySelector(`.swiper-slide-active [name="${firstError}"]`) ??
    document.querySelector(`[name="${firstError}"]`);

  // If element is not found, prevent crash.
  if (!el) {
    // eslint-disable-next-line no-console
    console.warn(
      `scrollToFirstError(): Element [name="${firstError}"] not found in DOM`,
    );
    return;
  }

  // Subtract 200 to put more of the input in view.
  const topPos = el.offsetTop - 200;
  // Assume forms are inside a scrollable
  const scroller = getScrollParent(el);
  scroller.scrollTop = topPos;
};

const TanStackForm = ({
  fields,
  handleFormSubmit,
  submitButton = <button type="submit" key="submit" aria-label="Submit" />,
  initialValues,
  autoFocus,
  id,
}: FormProps) => {
  const store = useReduxStore() as AppStore;
  const subject = useSelector(getStageSubject);
  
  // Create validation context with memoized data
  const validationContext = useMemo((): ValidationContext => {
    const state = store.getState();
    return {
      codebookVariables: getCodebookVariablesForSubjectType(state),
      networkEntities: getNetworkEntitiesForType(state),
    };
  }, [store]);

  const enrichedFields = useSelector(
    (state): FieldType[] =>
      makeEnrichFieldsWithCodebookMetadata()(state, {
        fields,
        subject,
      }) as FieldType[],
  );

  const { defaultValues, fieldsWithProps } = useMemo(() => {
    const defaults: Record<string, VariableValue> = {};
    const processedFields = enrichedFields.map((field, index) => {
      // Build default values
      defaults[field.name] = initialValues?.[field.name] ?? '';

      // Return field with additional props
      return {
        ...field,
        isFirst: autoFocus && index === 0,
        validators: getTanStackNativeValidators(
          field.validation ?? {},
          validationContext,
        ),
      };
    });

    return { defaultValues: defaults, fieldsWithProps: processedFields };
  }, [enrichedFields, initialValues, autoFocus, validationContext]);

  const form = useTanStackForm({
    defaultValues,
    onSubmit: ({ value }) => handleFormSubmit(value),
    onSubmitInvalid: ({ formApi }) => {
      const errors = formApi.getAllErrors().fields as TanStackFormErrors;
      scrollToFirstError(errors);
    },
  });

  return (
    <div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }} id={id}>
        {fieldsWithProps.map((field, index) => (
          <form.AppField
            name={field.name}
            key={`${field.name}-${index}`}
            validators={field.validators}
          >
            {() => <Field field={field} autoFocus={field.isFirst} />}
          </form.AppField>
        ))}
        {submitButton}
      </form>
    </div>
  );
};

export default TanStackForm;
