/* eslint-disable react/display-name */
import { type StageType } from '@codaco/protocol-validation';
import dynamic from 'next/dynamic';
import Surface from '~/components/layout/Surface';
import { Spinner } from '~/lib/legacy-ui/components';
import Icon from '~/lib/legacy-ui/components/Icon';

const StageLoading = () => (
  <div className="flex size-full items-center justify-center">
    <Spinner size="lg" />
  </div>
);

const NotFoundInterface = ({ interfaceType }: { interfaceType: string }) => (
  <Surface>
    <div className="flex flex-col items-center">
      <Icon name="warning" />
      <h1 style={{ marginTop: '1rem' }}>
        No &quot;
        {interfaceType}
        &quot; interface found.
      </h1>
    </div>
  </Surface>
);

type InterfaceType = StageType | 'FinishSession';

const DynamicNameGenerator = dynamic(
  () => import('./NameGenerator/NameGenerator'),
  { loading: StageLoading },
);
const DynamicNameGeneratorQuickAdd = dynamic(
  () => import('./NameGenerator/NameGeneratorQuickAdd'),
  { loading: StageLoading },
);
const DynamicNameGeneratorRoster = dynamic(
  () => import('./NameGeneratorRoster'),
  { loading: StageLoading },
);
const DynamicSociogram = dynamic(() => import('./Sociogram'), {
  loading: StageLoading,
});
const DynamicInformation = dynamic(() => import('./Information'), {
  loading: StageLoading,
});
const DynamicOrdinalBin = dynamic(() => import('./OrdinalBin/OrdinalBin'), {
  loading: StageLoading,
});
const DynamicCategoricalBin = dynamic(() => import('./CategoricalBin'), {
  loading: StageLoading,
});
const DynamicNarrative = dynamic(() => import('./Narrative'), {
  loading: StageLoading,
});
const DynamicAlterForm = dynamic(() => import('./AlterForm'), {
  loading: StageLoading,
});
const DynamicEgoForm = dynamic(() => import('./EgoForm'), {
  loading: StageLoading,
});
const DynamicAlterEdgeForm = dynamic(() => import('./AlterEdgeForm'), {
  loading: StageLoading,
});
const DynamicDyadCensus = dynamic(() => import('./DyadCensus/DyadCensus'), {
  loading: StageLoading,
});
const DynamicTieStrengthCensus = dynamic(
  () => import('./TieStrengthCensus/TieStrengthCensus'),
  { loading: StageLoading },
);
const DynamicAnonymisation = dynamic(
  () => import('./Anonymisation/Anonymisation'),
  { loading: StageLoading },
);
const DynamicOneToManyDyadCensus = dynamic(
  () => import('./OneToManyDyadCensus'),
  { loading: StageLoading },
);
const DynamicGeospatial = dynamic(() => import('./Geospatial/Geospatial'), {
  loading: StageLoading,
});
const DynamicFinishSession = dynamic(() => import('./FinishSession'), {
  loading: StageLoading,
});
const DynamicFamilyTreeCensus = dynamic(
  () => import('./FamilyTreeCensus/FamilyTreeCensus'),
  { loading: StageLoading },
);

const getInterface = (interfaceType: InterfaceType) => {
  switch (interfaceType) {
    case 'NameGenerator':
      return DynamicNameGenerator;
    case 'NameGeneratorQuickAdd':
      return DynamicNameGeneratorQuickAdd;
    case 'NameGeneratorRoster':
      return DynamicNameGeneratorRoster;
    case 'Sociogram':
      return DynamicSociogram;
    case 'Information':
      return DynamicInformation;
    case 'OrdinalBin':
      return DynamicOrdinalBin;
    case 'CategoricalBin':
      return DynamicCategoricalBin;
    case 'Narrative':
      return DynamicNarrative;
    case 'AlterForm':
      return DynamicAlterForm;
    case 'EgoForm':
      return DynamicEgoForm;
    case 'AlterEdgeForm':
      return DynamicAlterEdgeForm;
    case 'DyadCensus':
      return DynamicDyadCensus;
    case 'TieStrengthCensus':
      return DynamicTieStrengthCensus;
    case 'Anonymisation':
      return DynamicAnonymisation;
    case 'OneToManyDyadCensus':
      return DynamicOneToManyDyadCensus;
    case 'Geospatial':
      return DynamicGeospatial;
    case 'FinishSession':
      return DynamicFinishSession;
    case 'FamilyTreeCensus':
      return DynamicFamilyTreeCensus;
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
