import {
  type AdditionalAttributes,
  type Codebook,
  type FilterRule,
  type FormField,
  type NcNode,
  type StageSubject,
  type VariableDefinition,
  type VariableValidation,
} from '@codaco/shared-consts';
import { get, isObject } from 'es-toolkit/compat';
import { Protocol } from '../schemas/src/8.zod';
import Validator from './Validator';
import {
  duplicateId,
  duplicateInArray,
  entityDefFromRule,
  getEntityNames,
  getVariableNameFromID,
  getVariableNames,
  getVariablesForSubject,
  nodeVarsIncludeDisplayVar,
} from './helpers';

/**
 * Define and run all dynamic validations (which aren't covered by the JSON Schema).
 *
 * @return {string[]} an array of failure messages from the validator
 */
export const validateLogic = (protocol: Protocol) => {
  const v = new Validator(protocol);
  const codebook = protocol.codebook;

  v.addValidation<Codebook>(
    'codebook',
    (codebook) => !duplicateInArray(getEntityNames(codebook)),
    (codebook) =>
      `Duplicate entity name "${duplicateInArray(getEntityNames(codebook))}"`,
  );

  v.addValidation<NcNode>(
    'codebook.node.*',
    (nodeType) => nodeVarsIncludeDisplayVar(nodeType),
    (nodeType) =>
      `node displayVariable "${nodeType.displayVariable}" did not match any node variable`,
  );

  v.addValidation<StageSubject>(
    'stages[].subject',
    (subject) => {
      const entity = subject.entity;
      const type = subject.type as keyof Codebook[typeof entity];
      return codebook?.[entity]?.[type] !== undefined;
    },
    () => 'Stage subject is not defined in the codebook',
  );

  // Tries to validate inline forms.
  // If the stage type is egoform, lookup variables in codebook[ego]
  // Otherwise, use stage.subject to get codebook reference
  v.addValidationSequence<FormField>('stages[].form.fields[]', [
    (field, _subject, keypath) => {
      // We know that keypath will be in key order, with dedicated keys for array index.
      // Therefore: keypath[1] = 'stages', keypath[2] = [index]
      const stage = get(protocol, `${keypath[1]}${keypath[2]}`);
      let codebookEntity;

      if (stage.type === 'EgoForm') {
        codebookEntity = codebook.ego;
      } else {
        const stageSubject = stage.subject;
        const path = `codebook.${stageSubject.entity}.${stageSubject.type}`;

        codebookEntity = get(protocol, path);
      }

      const variable = field.variable;

      return codebookEntity.variables[variable];
    },
    () => 'Form field variable not found in codebook.',
  ]);

  // Variable validation...validation (:/)
  // Needs to:
  //   1. Check that any variables referenced by a validation exist in the codebook
  //   2. Check that validation is not applied on a variable that is on an inappropriate
  //      entity type.
  v.addValidation<VariableValidation>(
    'codebook.ego.variables.*.validation',
    // First, check that unique is not applied on any ego variables
    (validation) => !Object.keys(validation).includes('unique'),
    (_, __, keypath) =>
      `The 'unique' variable validation cannot be used on ego variables. Was used on ego variable "${getVariableNameFromID(
        codebook,
        { entity: 'ego' },
        keypath[4],
      )}".`,
  );

  v.addValidation<string>(
    new RegExp(
      'codebook\\..*\\.variables\\..*\\.validation\\.(sameAs|differentFrom|greaterThanVariable|lessThanVariable)',
    ),
    (variable, _, keypath) => {
      let variablesForType: Record<string, VariableDefinition>;

      if (keypath[2] === 'ego') {
        // Get variable registryfor the current variable's entity type
        variablesForType = get(protocol, ['codebook', 'ego', 'variables'], {});
      } else {
        const path = `codebook.${keypath[2]}.${keypath[3]}.variables`;
        variablesForType = get(protocol, path, {});
      }

      // Check that the variable referenced by the validation exists in the codebook
      return !!variablesForType[variable];
    },
    (variable, _, keypath) => {
      if (keypath[2] === 'ego') {
        return `Validation configuration for the variable "${getVariableNameFromID(
          codebook,
          { entity: 'ego' },
          keypath[4],
        )}" is invalid! The variable "${variable}" does not exist in the codebook for this type.`;
      }

      return `Validation configuration for the variable "${getVariableNameFromID(
        codebook,
        { entity: keypath[2], type: keypath[3] },
        keypath[5],
      )}" is invalid! The variable "${variable}" does not exist in the codebook for this type.`;
    },
  );

  v.addValidationSequence<FilterRule>(
    'filter.rules[]',
    [
      (rule) => entityDefFromRule(rule, codebook),
      (rule) =>
        `Rule option type "${rule.options.type}" is not defined in codebook`,
    ],
    [
      (rule) => {
        if (!rule.options.attribute) {
          return true;
        } // Entity type rules do not have an attribute
        const variables = entityDefFromRule(rule, codebook).variables;
        return variables?.[rule.options.attribute];
      },
      (rule) => `"${rule.options.attribute}" is not a valid variable ID`,
    ],
  );

  v.addValidation(
    'protocol.stages',
    (stages) => !duplicateId(stages),
    (stages) => `Stages contain duplicate ID "${duplicateId(stages)}"`,
  );

  v.addValidation(
    'stages[].panels',
    (panels) => !duplicateId(panels),
    (panels) => `Panels contain duplicate ID "${duplicateId(panels)}"`,
  );

  v.addValidation(
    '.rules',
    (rules) => !duplicateId(rules),
    (rules) => `Rules contain duplicate ID "${duplicateId(rules)}"`,
  );

  v.addValidation(
    'stages[].prompts',
    (prompts) => !duplicateId(prompts),
    (prompts) => `Prompts contain duplicate ID "${duplicateId(prompts)}"`,
  );

  v.addValidation(
    'stages[].items',
    (items) => !duplicateId(items),
    (items) => `Items contain duplicate ID "${duplicateId(items)}"`,
  );

  v.addValidation(
    new RegExp('codebook\\..*\\.variables'),
    (variableMap) => !duplicateInArray(getVariableNames(variableMap)),
    (variableMap) =>
      `Duplicate variable name "${duplicateInArray(
        getVariableNames(variableMap),
      )}"`,
  );

  // Ordinal and categorical bin interfaces have a variable property on the prompt.
  // Check this variable exists in the stage subject codebook
  v.addValidation<string>(
    'prompts[].variable',
    (variable, subject) => getVariablesForSubject(codebook, subject)[variable],
    (variable, subject) =>
      `"${variable}" not defined in codebook[${subject!.entity}][${
        subject!.type
      }].variables`,
  );

  // 'otherVariable' is used by categorical bin for 'other' responses. Check this variable
  // exists in the stage subject codebook
  v.addValidation<string>(
    'prompts[].otherVariable',
    (otherVariable, subject) =>
      getVariablesForSubject(codebook, subject)[otherVariable],
    (otherVariable, subject) =>
      `"${otherVariable}" not defined in codebook[${subject!.entity}][${
        subject!.type
      }].variables`,
  );

  // Sociogram and TieStrengthCensus use createEdge to know which edge type to create.
  // Check this edge type exists in the edge codebook
  v.addValidation<string>(
    'prompts[].createEdge',
    (createEdge) => {
      if (!codebook.edge) {
        return false;
      }

      const edgeTypes = Object.keys(codebook.edge);
      return edgeTypes.includes(createEdge);
    },
    (createEdge) =>
      `"${createEdge}" definition for createEdge not found in codebook["edge"]`,
  );

  // TieStrengthCensus uses edgeVariable to indicate which ordinal variable should be used to
  // provide the strength options.
  // Check that it exists on the edge type specified by createEdge, and that its type is ordinal.
  v.addValidationSequence<string>(
    'prompts[].edgeVariable',
    [
      (edgeVariable, _, keypath) => {
        // Keypath = [ 'protocol', 'stages', '[{stageIndex}]', 'prompts', '[{promptIndex}]', 'edgeVariable' ]
        const path = `stages.${keypath[2]}.prompts${keypath[4]}.createEdge`;
        const createEdgeForPrompt = get(protocol, path);
        return getVariablesForSubject(codebook, {
          entity: 'edge',
          type: createEdgeForPrompt,
        })[edgeVariable];
      },
      (edgeVariable, _, keypath) => {
        const path = `stages.${keypath[2]}.prompts${keypath[4]}.createEdge`;
        const createEdgeForPrompt = get(protocol, path);
        return `"${edgeVariable}" not defined in codebook[edge][${createEdgeForPrompt}].variables`;
      },
    ],
    [
      (edgeVariable, _, keypath) => {
        // Keypath = [ 'protocol', 'stages', '[{stageIndex}]', 'prompts', '[{promptIndex}]', 'edgeVariable' ]
        const path = `stages.${keypath[2]}.prompts${keypath[4]}.createEdge`;
        const createEdgeForPrompt = get(protocol, path);
        const codebookEdgeVariable = getVariablesForSubject(codebook, {
          entity: 'edge',
          type: createEdgeForPrompt,
        })[edgeVariable];

        return codebookEdgeVariable.type === 'ordinal';
      },
      (edgeVariable) => `"${edgeVariable}" is not of type 'ordinal'.`,
    ],
  );

  // layoutVariable can either be a string, or an object where the key is a node type and the value
  // is a variable ID.
  v.addValidation<string>(
    'prompts[].layout.layoutVariable',
    (variable, subject) => {
      if (isObject(variable)) {
        return Object.keys(variable).every(
          (nodeType) =>
            getVariablesForSubject(codebook, {
              entity: 'node',
              type: nodeType,
            })[variable[nodeType]],
        );
      }

      return getVariablesForSubject(codebook, subject)[variable];
    },
    (variable, subject) => {
      if (isObject(variable)) {
        const missing = Object.keys(variable).filter(
          (nodeType) =>
            !getVariablesForSubject(codebook, {
              entity: 'node',
              type: nodeType,
            })[variable[nodeType]],
        );
        return missing
          .map(
            (nodeType) =>
              `Layout variable "${variable[nodeType]}" not defined in codebook[node][${nodeType}].variables.`,
          )
          .join(' ');
      }

      return `Layout variable "${variable}" not defined in codebook[${
        subject!.entity
      }][${subject!.type}].variables.`;
    },
  );

  v.addValidation<AdditionalAttributes>(
    'prompts[].additionalAttributes',
    (additionalAttributes, subject) =>
      additionalAttributes.every(
        ({ variable }) => getVariablesForSubject(codebook, subject)[variable],
      ),
    (additionalAttributes) =>
      `One or more sortable properties not defined in codebook: ${additionalAttributes.map(
        ({ variable }) => variable,
      )}`,
  );

  // Sociogram prompt edges key can contain a restrict object.

  // If restrict.origin is present, its value must be a valid node type.
  v.addValidation<string>(
    'prompts[].edges.restrict.origin',
    (origin) => {
      if (!codebook.node) return false;
      return Object.keys(codebook.node).includes(origin);
    },
    (origin) => `"${origin}" is not a valid node type.`,
  );

  v.runValidations();

  v.warnings.forEach((warning) => console.error(warning)); // eslint-disable-line no-console

  if (v.errors.length > 0) {
    return {
      hasErrors: true,
      errors: v.errors,
    };
  }

  return {
    hasErrors: false,
    errors: [],
  };
};
