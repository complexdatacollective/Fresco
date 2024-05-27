import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '~/lib/ui/components/Icon';
import { StageType } from '../../protocol-consts';

const StageLoading = () => (
  <div className="h-full w-full flex items-center justify-center">
    <Loader2 className='animate-spin' size={48} />
  </div>
);

const NameGenerator = dynamic(() => import('./NameGenerator'), { loading: StageLoading });
const NameGeneratorQuickAdd = dynamic(() => import('./NameGeneratorQuickAdd'), { loading: StageLoading });
// const NameGeneratorRoster = dynamic(() => import('./NameGeneratorRoster'), { loading: StageLoading });
// const Sociogram = dynamic(() => import('./Sociogram'), { loading: StageLoading });
// const Information = dynamic(() => import('./Information'), { loading: StageLoading });
// const OrdinalBin = dynamic(() => import('./OrdinalBin'), { loading: StageLoading });
// const CategoricalBin = dynamic(() => import('./CategoricalBin'), { loading: StageLoading });
// const Narrative = dynamic(() => import('./Narrative'), { loading: StageLoading });
// const AlterForm = dynamic(() => import('./AlterForm'), { loading: StageLoading });
// const EgoForm = dynamic(() => import('./EgoForm'), { loading: StageLoading });
// const AlterEdgeForm = dynamic(() => import('./AlterEdgeForm'), { loading: StageLoading });
// const DyadCensus = dynamic(() => import('./DyadCensus'), { loading: StageLoading });
// const TieStrengthCensus = dynamic(() => import('./TieStrengthCensus'), { loading: StageLoading });
// const FinishSession = dynamic(() => import('./FinishSession'), { loading: StageLoading });

const NotFoundInterface = ({ interfaceType }) => (
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

const getInterface = (interfaceType) => {
  switch (interfaceType) {
    case StageType.NameGenerator:
      return NameGenerator;
    case StageType.NameGeneratorQuickAdd:
      return NameGeneratorQuickAdd;
    case StageType.NameGeneratorRoster:
      return NameGeneratorRoster;
    case StageType.Sociogram:
      return Sociogram;
    case StageType.Information:
      return Information;
    case StageType.OrdinalBin:
      return OrdinalBin;
    case StageType.CategoricalBin:
      return CategoricalBin;
    case StageType.Narrative:
      return Narrative;
    case StageType.AlterForm:
      return AlterForm;
    case StageType.EgoForm:
      return EgoForm;
    case StageType.AlterEdgeForm:
      return AlterEdgeForm;
    case StageType.DyadCensus:
      return DyadCensus;
    case StageType.TieStrengthCensus:
      return TieStrengthCensus;
    case 'FinishSession':
      return FinishSession;
    default:
      return <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
