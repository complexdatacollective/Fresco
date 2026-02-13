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
      return dynamic(() => import('./OrdinalBin/OrdinalBin'), {
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
      return dynamic(() => import('./TieStrengthCensus/TieStrengthCensus'), {
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
      return dynamic(() => import('./FamilyTreeCensus/FamilyTreeCensus'), {
        loading: StageLoading,
      });
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
