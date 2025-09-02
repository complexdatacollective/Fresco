import type { ComponentType } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  type NcEdge,
  type NcEgo,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { filter, isEqual, some } from 'es-toolkit/compat';
import { z } from 'zod';
import { getNetworkEntitiesForType } from '~/lib/interviewer/selectors/session';
import { type AppStore } from '~/lib/interviewer/store';
import type { AdditionalContext, ValidationContext } from '../types';
import type { EnrichedFormField } from '../types/fields';

type FieldValue = VariableValue | undefined;

const isSomeValueMatching = (
  value: FieldValue,
  otherNetworkEntities: NcNode[] | NcEdge[] | NcEgo[],
  name: string,
) =>
  some(
    otherNetworkEntities,
    (entity) =>
      entity[entityAttributesProperty] &&
      isEqual(value, entity[entityAttributesProperty][name]),
  );

/**
 * Translates protocol validation rules to Zod schemas
 *
 * This directly implements validation logic in Zod rather than trying to bridge
 * existing field validation functions.
 */
export function translateProtocolValidation(
  field: EnrichedFormField,
  additionalContext: AdditionalContext,
): z.ZodTypeAny | ((context: ValidationContext) => z.ZodTypeAny) | undefined {
  const { validation } = field;

  if (!validation || typeof validation !== 'object') {
    return undefined;
  }

  // Start with base schema based on field type
  let schema: z.ZodTypeAny = z.any();

  // Set base type based on field component/type
  const fieldType = (field.component ?? field.type) as ComponentType;

  switch (fieldType) {
    case 'Number':
      schema = z.coerce.number();
      break;
    case 'Text':
    case 'TextArea':
      schema = z.string();
      break;
    case 'Boolean':
    case 'Toggle':
      schema = z.boolean();
      break;
    case 'CheckboxGroup':
      schema = z.array(z.coerce.string());
      break;
    case 'RadioGroup':
      schema = z.string();
      break;
    case 'DatePicker':
    case 'RelativeDatePicker':
      schema = z.string();
      break;
    case 'Slider':
    case 'VisualAnalogScale':
      schema = z.coerce.string();
      break;
    case 'LikertScale':
      schema = z.coerce.string();
      break;
    case 'ToggleButtonGroup':
      schema = z.array(z.string());
      break;
    default:
      schema = z.any();
  }

  const validationObj = validation as Record<string, unknown>;

  // Apply type-specific validations BEFORE making optional
  // String validations
  if (fieldType === 'Text' || fieldType === 'TextArea') {
    let stringSchema = schema as z.ZodString;
    if (
      validationObj.minLength &&
      typeof validationObj.minLength === 'number'
    ) {
      stringSchema = stringSchema.min(validationObj.minLength, {
        message: `Must be at least ${validationObj.minLength} characters`,
      });
    }
    if (
      validationObj.maxLength &&
      typeof validationObj.maxLength === 'number'
    ) {
      stringSchema = stringSchema.max(validationObj.maxLength, {
        message: `Must be at most ${validationObj.maxLength} characters`,
      });
    }
    schema = stringSchema;
  }

  // Number validations
  if (
    fieldType === 'Number' ||
    fieldType === 'Slider' ||
    fieldType === 'VisualAnalogScale'
  ) {
    let numberSchema = schema as z.ZodNumber;
    if (
      validationObj.minValue !== undefined &&
      typeof validationObj.minValue === 'number'
    ) {
      numberSchema = numberSchema.min(validationObj.minValue, {
        message: `Must be at least ${validationObj.minValue}`,
      });
    }
    if (
      validationObj.maxValue !== undefined &&
      typeof validationObj.maxValue === 'number'
    ) {
      numberSchema = numberSchema.max(validationObj.maxValue, {
        message: `Must be at most ${validationObj.maxValue}`,
      });
    }
    schema = numberSchema;
  }

  // Array validations (for checkbox/radio groups)
  if (fieldType === 'CheckboxGroup') {
    let arraySchema = schema as z.ZodArray<z.ZodTypeAny>;
    if (
      validationObj.minSelected &&
      typeof validationObj.minSelected === 'number'
    ) {
      arraySchema = arraySchema.min(validationObj.minSelected, {
        message: `Select at least ${validationObj.minSelected} options`,
      });
    }
    if (
      validationObj.maxSelected &&
      typeof validationObj.maxSelected === 'number'
    ) {
      arraySchema = arraySchema.max(validationObj.maxSelected, {
        message: `Select at most ${validationObj.maxSelected} options`,
      });
    }
    schema = arraySchema;
  }

  // Handle required validation after type-specific validations
  if (validationObj.required !== true) {
    schema = schema.optional();
  }

  // For complex validations that need context (unique, differentFrom, etc.)
  // Return a function that creates the schema with context
  if (
    validationObj.unique ||
    validationObj.differentFrom ||
    validationObj.sameAs ||
    validationObj.greaterThanVariable ||
    validationObj.lessThanVariable
  ) {
    return (context: ValidationContext) => {
      let contextSchema = schema;

      // differentFrom validation
      if (
        validationObj.differentFrom &&
        typeof validationObj.differentFrom === 'string'
      ) {
        const otherFieldId = validationObj.differentFrom;
        const otherFieldName = additionalContext.codebookVariables?.[otherFieldId]?.name ?? otherFieldId;
        contextSchema = contextSchema.refine(
          (value) => {
            const allValues = context.formValues ?? {};
            const otherValue = allValues[otherFieldId];
            return value !== otherValue;
          },
          {
            message: `Your answer must be different from ${otherFieldName}`,
          },
        );
      }

      // sameAs validation
      if (validationObj.sameAs && typeof validationObj.sameAs === 'string') {
        const otherFieldId = validationObj.sameAs;
        const otherFieldName = additionalContext.codebookVariables?.[otherFieldId]?.name ?? otherFieldId;
        contextSchema = contextSchema.refine(
          (value) => {
            const allValues = context.formValues ?? {};
            const otherValue = allValues[otherFieldId];
            return value === otherValue;
          },
          {
            message: `Your answer must be the same as ${otherFieldName}`,
          },
        );
      }

      if (validationObj.unique) {
        contextSchema = contextSchema.refine(
          (value) => {
            const subject = additionalContext.subject as {
              entity: string;
              type?: string;
              currentEntityId?: string;
            };
            const store = additionalContext.store as AppStore;
            const entityType = subject?.type;

            if (!entityType || !store) {
              return true;
            }

            const currentEntityId = subject?.currentEntityId;

            const networkEntities = getNetworkEntitiesForType(store.getState());

            const otherNetworkEntities = filter(
              networkEntities,
              (entity) => !currentEntityId || entity._uid !== currentEntityId,
            );

            // Return false if value matches existing values (validation fails)
            return !isSomeValueMatching(
              value as FieldValue,
              otherNetworkEntities,
              field.name,
            );
          },
          {
            message: 'Your answer must be unique',
          },
        );
      }

      return contextSchema;
    };
  }

  return schema;
}
