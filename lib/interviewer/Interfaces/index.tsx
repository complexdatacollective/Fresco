/* eslint-disable react/display-name */
import { type StageType } from '@codaco/protocol-validation';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '~/lib/ui/components/Icon';

const StageLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="animate-spin" size={48} />
  </div>
);

const NameGenerator = dynamic(() => import('./NameGenerator/NameGenerator'), {
  loading: StageLoading,
});
const NameGeneratorQuickAdd = dynamic(
  () => import('./NameGenerator/NameGeneratorQuickAdd'),
  {
    loading: StageLoading,
  },
);
const NameGeneratorRoster = dynamic(() => import('./NameGeneratorRoster'), {
  loading: StageLoading,
});
const Sociogram = dynamic(() => import('./Sociogram'), {
  loading: StageLoading,
});
const Information = dynamic(() => import('./Information'), {
  loading: StageLoading,
});
const OrdinalBin = dynamic(() => import('./OrdinalBin'), {
  loading: StageLoading,
});
const CategoricalBin = dynamic(() => import('./CategoricalBin'), {
  loading: StageLoading,
});
const Narrative = dynamic(() => import('./Narrative'), {
  loading: StageLoading,
});
const AlterForm = dynamic(() => import('./AlterForm'), {
  loading: StageLoading,
});
const EgoForm = dynamic(() => import('./EgoForm'), { loading: StageLoading });
const AlterEdgeForm = dynamic(() => import('./AlterEdgeForm'), {
  loading: StageLoading,
});
const DyadCensus = dynamic(() => import('./DyadCensus/DyadCensus'), {
  loading: StageLoading,
});
const TieStrengthCensus = dynamic(() => import('./TieStrengthCensus'), {
  loading: StageLoading,
});
const FinishSession = dynamic(() => import('./FinishSession'), {
  loading: StageLoading,
});
const Anonymisation = dynamic(() => import('./Anonymisation/Anonymisation'), {
  loading: StageLoading,
});
const OneToManyDyadCensus = dynamic(() => import('./OneToManyDyadCensus'), {
  loading: StageLoading,
});
const Geospatial = dynamic(() => import('./Geospatial/Geospatial'), {
  loading: StageLoading,
});

const NotFoundInterface = ({ interfaceType }: { interfaceType: string }) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex flex-col items-center">
      <Icon name="warning" />
      <h1 style={{ marginTop: '1rem' }}>
        No &quot;
        {interfaceType}
        &quot; interface found.
      </h1>
    </div>
  </div>
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
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
