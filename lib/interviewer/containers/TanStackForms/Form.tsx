import {
  type ComponentType,
  type ValidationError,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { type ValidationErrorMap } from '@tanstack/react-form';
import { useMemo } from 'react';
import { useStore as useReduxStore, useSelector } from 'react-redux';
import { useAppForm } from '../../hooks/useTanStackForm';
import { makeRehydrateFields } from '../../selectors/forms';
import { AppStore } from '../../store';
import {
  getTanStackFormValidators,
  type ValidationFunction,
  type VariableValidation,
} from '../../utils/field-validation';
import Field from './Field';

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
  if (!errors) {
    return;
  }

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

type Field = {
  prompt: string;
  variable: string;
};

type TanStackFormErrors = Record<
  string,
  {
    errors: ValidationError[];
    errorMap: ValidationErrorMap;
  }
>;

export type FieldType = {
  fieldLabel?: string;
  label?: string;
  name: string;
  component: ComponentType;
  validation?: VariableValidation;
  validate?: ValidationFunction;
  type: VariableType;
  value?: VariableValue;
  options?: { label: string; value: VariableValue }[];
  parameters: Record<string, unknown> | null;
};

const TanStackForm = ({
  fields,
  subject,
  onSubmit: handleFormSubmit,
  submitButton = <button type="submit" key="submit" aria-label="Submit" />,
  initialValues,
  autoFocus,
  id,
}: {
  fields: Field[];
  subject?: { entity: string; type?: string };
  onSubmit: (formData: Record<string, VariableValue>) => void;
  submitButton?: React.ReactNode;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
  id?: string;
}) => {
  const rehydrateFields = useMemo(() => makeRehydrateFields(), []);

  const rehydratedFields = useSelector((state): FieldType[] => {
    const result = rehydrateFields(state, { fields, subject }) as FieldType[];
    return result;
  });

  const defaultValues = useMemo(() => {
    const defaults: Record<string, VariableValue> = {};
    rehydratedFields.forEach((field: FieldType) => {
      defaults[field.name] = initialValues?.[field.name] ?? field.value ?? '';
    });
    return defaults;
  }, [rehydratedFields, initialValues]);

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      // will only be called if validation passes
      handleFormSubmit(value);
    },
    onSubmitInvalid: ({ formApi }) => {
      const errors = formApi.getAllErrors().fields as TanStackFormErrors;
      scrollToFirstError(errors);
    },
  });

  const store = useReduxStore() as AppStore;

  const fieldsWithProps = useMemo(() => {
    return rehydratedFields.map((field: FieldType, index: number) => {
      const isFirst = autoFocus && index === 0;
      const validators = getTanStackFormValidators(
        field.validation ?? {},
        store,
        field.validate,
        field.name,
      );
      return {
        ...field,
        isFirst,
        validators,
      };
    });
  }, [rehydratedFields, autoFocus, store]);

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        id={id}
      >
        {fieldsWithProps.map((field, index) => (
          <form.AppField
            name={field.name}
            key={`${field.name} ${index}`}
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
