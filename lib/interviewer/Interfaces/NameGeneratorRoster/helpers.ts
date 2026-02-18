import { type getNodeVariables } from '~/lib/interviewer/selectors/interface';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { type StageProps } from '../../components/ProtocolScreen';

export const convertNamesToUUIDs = (
  variables: ReturnType<typeof getNodeVariables>,
  nameOrNames: string[],
) => {
  return nameOrNames.map((name) => getParentKeyByNameValue(variables, name));
};

export type NameGeneratorRosterProps = StageProps<'NameGeneratorRoster'>;
