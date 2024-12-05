import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '~/lib/ui/components/Icon';
import { StageType } from '../../protocol-consts';

const StageLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="animate-spin" size={48} />
  </div>
);

const NotFoundInterface = ({ interfaceType }: { interfaceType: string }) => (
  <div
    style={{
      display: 'flex',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <Icon name="warning" />
      <h1 style={{ marginTop: '1rem' }}>
        No &quot;
        {interfaceType}
        &quot; interface found.
      </h1>
    </div>
  </div>
);

const getInterface = (interfaceType: string) => {
  switch (interfaceType) {
    case StageType.NameGenerator:
      return dynamic(() => import('./NameGenerator'), {
        loading: StageLoading,
      });
    case StageType.NameGeneratorQuickAdd:
      return dynamic(() => import('./NameGeneratorQuickAdd'), {
        loading: StageLoading,
      });
    case StageType.NameGeneratorRoster:
      return dynamic(() => import('./NameGeneratorRoster'), {
        loading: StageLoading,
      });
    case StageType.Sociogram:
      return dynamic(() => import('./Sociogram'), { loading: StageLoading });
    case StageType.Information:
      return dynamic(() => import('./Information'), { loading: StageLoading });
    case StageType.OrdinalBin:
      return dynamic(() => import('./OrdinalBin'), { loading: StageLoading });
    case StageType.CategoricalBin:
      return dynamic(() => import('./CategoricalBin'), {
        loading: StageLoading,
      });
    case StageType.Narrative:
      return dynamic(() => import('./Narrative'), { loading: StageLoading });
    case StageType.AlterForm:
      return dynamic(() => import('./AlterForm'), { loading: StageLoading });
    case StageType.EgoForm:
      return dynamic(() => import('./EgoForm'), { loading: StageLoading });
    case StageType.AlterEdgeForm:
      return dynamic(() => import('./AlterEdgeForm'), {
        loading: StageLoading,
      });
    case StageType.DyadCensus:
      return dynamic(() => import('./DyadCensus/DyadCensus'), {
        loading: StageLoading,
      });
    case StageType.TieStrengthCensus:
      return dynamic(() => import('./TieStrengthCensus'), {
        loading: StageLoading,
      });
    case StageType.OneToManyDyadCensus:
      return dynamic(() => import('./OneToManyDyadCensus'), {
        loading: StageLoading,
      });
    case StageType.Anonymisation:
      return dynamic(() => import('./Anonymisation'), {
        loading: StageLoading,
      });
    case 'FinishSession':
      return dynamic(() => import('./FinishSession'), {
        loading: StageLoading,
      });
    default:
      return <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
