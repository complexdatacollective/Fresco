import { type Stage } from '@codaco/protocol-validation';
import { type getNodeVariables } from '~/lib/interviewer/selectors/interface';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { type StageProps } from '../../Stage';

export const convertNamesToUUIDs = (
  variables: ReturnType<typeof getNodeVariables>,
  nameOrNames: string[] | string,
) => {
  if (typeof nameOrNames === 'string') {
    return getParentKeyByNameValue(variables, nameOrNames);
  }

  return nameOrNames.map((name) => getParentKeyByNameValue(variables, name));
};

export type NameGeneratorRosterProps = StageProps & {
  stage: Extract<Stage, { type: 'NameGeneratorRoster' }>;
};
