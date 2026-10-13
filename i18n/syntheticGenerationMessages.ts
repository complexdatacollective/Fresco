import { defineMessages } from '@codaco/app-i18n/messages';

export const syntheticGenerationMessages = defineMessages({
  signInRequired: {
    id: 'fresco.syntheticGeneration.signInRequired',
    defaultMessage: 'Sign in to generate synthetic interviews.',
    description:
      'Generation request refused because there is no authenticated researcher session.',
  },
  invalidRequest: {
    id: 'fresco.syntheticGeneration.invalidRequest',
    defaultMessage:
      'The interview generation request is invalid. Reload the page and try again.',
    description:
      'Recovery guidance for malformed generation JSON or invalid generation options.',
  },
  missingProtocol: {
    id: 'fresco.syntheticGeneration.missingProtocol',
    defaultMessage:
      'This protocol is no longer available. Select another protocol.',
    description: 'The selected protocol was not found when generation started.',
  },
  unreadableProtocol: {
    id: 'fresco.syntheticGeneration.unreadableProtocol',
    defaultMessage:
      'This protocol could not be read, so no interviews were generated.',
    description:
      "The selected protocol's stored data does not parse, so generation was refused before creating anything.",
  },
  interrupted: {
    id: 'fresco.syntheticGeneration.interrupted',
    defaultMessage:
      'Interview generation could not finish. Try again. Some interviews may already have been created.',
    description:
      'Operational generation or stream failure; a partial batch may have been saved.',
  },
  constraints: {
    id: 'fresco.syntheticGeneration.constraints',
    defaultMessage:
      'Synthetic interviews could not be generated with these validation rules. Review the affected attributes below.',
    description:
      'Introduces actionable constraint conflicts reported by the shared synthetic generation engine.',
  },
  conflictSubject: {
    id: 'fresco.syntheticGeneration.conflictSubject',
    defaultMessage:
      '{entity, select, ego {Ego attributes: {variables}} node {Attributes on node type {type}: {variables}} edge {Attributes on edge type {type}: {variables}} other {Attributes: {variables}}}',
    description:
      'Identifies affected codebook attributes. Type and variable names are unchanged researcher data; variables is a locale-formatted list.',
  },
  technicalDetails: {
    id: 'fresco.syntheticGeneration.technicalDetails',
    defaultMessage: 'Technical details',
    description:
      'Disclosure label for the original, untranslated generation diagnostic.',
  },
  deleteFailed: {
    id: 'fresco.syntheticGeneration.deleteFailed',
    defaultMessage: 'Could not delete synthetic data. Try again.',
    description:
      'Fallback when the synthetic data deletion request fails without a specific refusal.',
  },
  refreshFailed: {
    id: 'fresco.syntheticGeneration.refreshFailed',
    defaultMessage: 'Could not refresh the latest data. Reload the page.',
    description:
      'The generation request finished but cache invalidation failed; do not imply that saved interviews were lost.',
  },
});
