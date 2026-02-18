// Interfaces are imported eagerly (not via React.lazy) so they render
// synchronously in the same React commit as the stage's motion.div wrapper.
// Lazy loading caused variant propagation to fail on first load: the parent's
// initial→animate transition would start (and complete) while the lazy module
// was still being fetched, so descendants like Prompts never received the
// "initial" variant and skipped their enter animation entirely.
/* eslint-disable react/display-name */
import { type StageType } from '@codaco/protocol-validation';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Icon from '~/components/ui/Icon';
import AlterEdgeForm from './AlterEdgeForm';
import AlterForm from './AlterForm';
import Anonymisation from './Anonymisation/Anonymisation';
import CategoricalBin from './CategoricalBin';
import DyadCensus from './DyadCensus/DyadCensus';
import EgoForm from './EgoForm';
import FamilyTreeCensus from './FamilyTreeCensus/FamilyTreeCensus';
import FinishSession from './FinishSession';
import Geospatial from './Geospatial/Geospatial';
import Information from './Information';
import NameGenerator from './NameGenerator/NameGenerator';
import NameGeneratorQuickAdd from './NameGenerator/NameGeneratorQuickAdd';
import NameGeneratorRoster from './NameGeneratorRoster';
import Narrative from './Narrative/Narrative';
import OrdinalBin from './OrdinalBin/OrdinalBin';
import Sociogram from './Sociogram/Sociogram';
import TieStrengthCensus from './TieStrengthCensus/TieStrengthCensus';
import OneToManyDyadCensus from './OneToManyDyadCensus';

const NotFoundInterface = ({ interfaceType }: { interfaceType: string }) => (
  <Surface>
    <Icon name="warning" />
    <Heading level="h2" className="mt-4">
      No &quot;
      {interfaceType}
      &quot; interface found.
    </Heading>
  </Surface>
);

type InterfaceType = StageType | 'FinishSession';

const getInterface = (interfaceType: InterfaceType) => {
  switch (interfaceType) {
    case 'NameGenerator':
      return NameGenerator;
    case 'NameGeneratorQuickAdd':
      return NameGeneratorQuickAdd;
    case 'NameGeneratorRoster':
      return NameGeneratorRoster;
    case 'Sociogram':
      return Sociogram;
    case 'Information':
      return Information;
    case 'OrdinalBin':
      return OrdinalBin;
    case 'CategoricalBin':
      return CategoricalBin;
    case 'Narrative':
      return Narrative;
    case 'AlterForm':
      return AlterForm;
    case 'EgoForm':
      return EgoForm;
    case 'AlterEdgeForm':
      return AlterEdgeForm;
    case 'DyadCensus':
      return DyadCensus;
    case 'TieStrengthCensus':
      return TieStrengthCensus;
    case 'Anonymisation':
      return Anonymisation;
    case 'OneToManyDyadCensus':
      return OneToManyDyadCensus;
    case 'Geospatial':
      return Geospatial;
    case 'FinishSession':
      return FinishSession;
    case 'FamilyTreeCensus':
      return FamilyTreeCensus;
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
