import { type VariableValue } from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useStore as useReduxStore, useSelector } from 'react-redux';
import type { FieldType, FormField } from '../../containers/TanStackForm/types';
import { makeEnrichFieldsWithCodebookMetadata } from '../../selectors/forms';
import { getCodebookVariablesForSubjectType } from '../../selectors/protocol';
import {
  getNetworkEntitiesForType,
  getStageSubject,
} from '../../selectors/session';
import { type AppStore } from '../../store';
import { getTanStackNativeValidators } from '../../utils/field-validation';
import { type ValidationContext } from '../../utils/formContexts';

export type UseFormDataReturn = {
  enrichedFields: FieldType[];
  validationContext: ValidationContext;
  defaultValues: Record<string, VariableValue>;
  fieldsWithProps: (FieldType & {
    isFirst?: boolean;
    validators: ReturnType<typeof getTanStackNativeValidators>;
  })[];
};

export type UseFormDataOptions = {
  fields: FormField[];
  entityId?: string;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
};

/**
 * Custom hook that extracts and centralizes form data management logic.
 * This includes field enrichment, validation context creation, and default value computation.
 *
 */
export const useFormData = ({
  fields,
  entityId,
  initialValues,
  autoFocus,
}: UseFormDataOptions): UseFormDataReturn => {
  const store = useReduxStore() as AppStore;
  const subject = useSelector(getStageSubject);

  // Create validation context with memoized data
  const validationContext = useMemo((): ValidationContext => {
    const state = store.getState();
    return {
      codebookVariables: getCodebookVariablesForSubjectType(state),
      networkEntities: getNetworkEntitiesForType(state),
      currentEntityId: entityId,
    };
  }, [store, entityId]);

  // Get enriched fields from Redux selector
  const enrichedFields = useSelector(
    (state): FieldType[] =>
      makeEnrichFieldsWithCodebookMetadata()(state, {
        fields,
        subject,
      }) as FieldType[],
  );

  // Process fields and compute default values
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

  return {
    enrichedFields,
    validationContext,
    defaultValues,
    fieldsWithProps,
  };
};
