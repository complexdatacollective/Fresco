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
      return dynamic(() => import('./NameGenerator/NameGenerator'), {
        loading: StageLoading,
      });
    case 'NameGeneratorQuickAdd':
      return dynamic(() => import('./NameGenerator/NameGeneratorQuickAdd'), {
        loading: StageLoading,
      });
    case 'NameGeneratorRoster':
      return dynamic(() => import('./NameGeneratorRoster'), {
        loading: StageLoading,
      });
    case 'Sociogram':
      return dynamic(() => import('./Sociogram'), {
        loading: StageLoading,
      });
    case 'Information':
      return dynamic(() => import('./Information'), {
        loading: StageLoading,
      });
    case 'OrdinalBin':
      return dynamic(() => import('./OrdinalBin'), {
        loading: StageLoading,
      });
    case 'CategoricalBin':
      return dynamic(() => import('./CategoricalBin'), {
        loading: StageLoading,
      });
    case 'Narrative':
      return dynamic(() => import('./Narrative'), {
        loading: StageLoading,
      });
    case 'AlterForm':
      return dynamic(() => import('./AlterForm'), {
        loading: StageLoading,
      });
    case 'EgoForm':
      return dynamic(() => import('./EgoForm'), {
        loading: StageLoading,
      });
    case 'AlterEdgeForm':
      return dynamic(() => import('./AlterEdgeForm'), {
        loading: StageLoading,
      });
    case 'DyadCensus':
      return dynamic(() => import('./DyadCensus/DyadCensus'), {
        loading: StageLoading,
      });
    case 'TieStrengthCensus':
      return dynamic(() => import('./TieStrengthCensus'), {
        loading: StageLoading,
      });
    case 'Anonymisation':
      return dynamic(() => import('./Anonymisation/Anonymisation'), {
        loading: StageLoading,
      });
    case 'OneToManyDyadCensus':
      return dynamic(() => import('./OneToManyDyadCensus'), {
        loading: StageLoading,
      });
    case 'Geospatial':
      return dynamic(() => import('./Geospatial/Geospatial'), {
        loading: StageLoading,
      });
    case 'FinishSession':
      return dynamic(() => import('./FinishSession'), {
        loading: StageLoading,
      });
    case 'FamilyTreeCensus':
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
