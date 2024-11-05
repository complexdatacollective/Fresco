import { StageTypes } from '@codaco/shared-consts';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '~/lib/ui/components/Icon';
import { type StageProps } from '../Stage';

const StageLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="animate-spin" size={48} />
  </div>
);

const NotFoundInterface = ({ stage }: StageProps) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex flex-col items-center">
      <Icon name="warning" />
      <h1 style={{ marginTop: '1rem' }}>
        No &quot;
        {stage.type}
        &quot; interface found.
      </h1>
    </div>
  </div>
);

const getInterface = (
  interfaceType:
    | StageTypes.NameGenerator
    | StageTypes.NameGeneratorQuickAdd
    | StageTypes.NameGeneratorRoster
    | StageTypes.Sociogram
    | StageTypes.Information
    | StageTypes.OrdinalBin
    | StageTypes.CategoricalBin
    | StageTypes.Narrative
    | StageTypes.AlterForm
    | StageTypes.EgoForm
    | StageTypes.AlterEdgeForm
    | StageTypes.DyadCensus
    | StageTypes.TieStrengthCensus
    | 'FinishSession'
    | 'Anonymisation'
    | 'OneToManyDyadCensus',
) => {
  switch (interfaceType) {
    // Schema 8 interfaces
    case 'Anonymisation':
      return dynamic(() => import('./Anonymisation'), {
        loading: StageLoading,
      });
    case 'OneToManyDyadCensus':
      return dynamic(() => import('./OneToManyDyadCensus'), {
        loading: StageLoading,
      });
    case StageTypes.NameGenerator:
      return dynamic(() => import('./NameGenerator'), {
        loading: StageLoading,
      });
    case StageTypes.NameGeneratorQuickAdd:
      return dynamic(() => import('./NameGeneratorQuickAdd'), {
        loading: StageLoading,
      });
    case StageTypes.NameGeneratorRoster:
      return dynamic(() => import('./NameGeneratorRoster'), {
        loading: StageLoading,
      });
    case StageTypes.Sociogram:
      return dynamic(() => import('./Sociogram'), {
        loading: StageLoading,
      });
    case StageTypes.Information:
      return dynamic(() => import('./Information'), {
        loading: StageLoading,
      });
    case StageTypes.OrdinalBin:
      return dynamic(() => import('./OrdinalBin'), {
        loading: StageLoading,
      });
    case StageTypes.CategoricalBin:
      return dynamic(() => import('./CategoricalBin'), {
        loading: StageLoading,
      });
    case StageTypes.Narrative:
      return dynamic(() => import('./Narrative'), {
        loading: StageLoading,
      });
    case StageTypes.AlterForm:
      return dynamic(() => import('./AlterForm'), {
        loading: StageLoading,
      });
    case StageTypes.EgoForm:
      return dynamic(() => import('./EgoForm'), { loading: StageLoading });
    case StageTypes.AlterEdgeForm:
      return dynamic(() => import('./AlterEdgeForm'), {
        loading: StageLoading,
      });
    case StageTypes.DyadCensus:
      return dynamic(() => import('./DyadCensus'), {
        loading: StageLoading,
      });
    case StageTypes.TieStrengthCensus:
      return dynamic(() => import('./TieStrengthCensus'), {
        loading: StageLoading,
      });
    case 'FinishSession':
      return dynamic(() => import('./FinishSession'), {
        loading: StageLoading,
      });
    default:
      return NotFoundInterface;
  }
};

export default getInterface;
