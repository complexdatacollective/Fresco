import { type Codebook, type StageSubject } from '@codaco/protocol-validation';

export function getVariableDefinition(
  codebook: Codebook,
  subject: StageSubject,
  attribute: string,
) {
  if (subject.entity === 'ego') {
    return codebook.ego?.variables?.[attribute];
  }

  return codebook[subject.entity]?.[subject.type]?.variables?.[attribute];
}
