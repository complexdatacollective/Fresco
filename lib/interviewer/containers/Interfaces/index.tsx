import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Icon from '~/lib/ui/components/Icon';
import { StageType } from '../../protocol-consts';

const StageLoading = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="animate-spin" size={48} />
  </div>
);

const NameGenerator = dynamic(() => import('./NameGenerator'), {
  loading: StageLoading,
});
const NameGeneratorQuickAdd = dynamic(() => import('./NameGeneratorQuickAdd'), {
  loading: StageLoading,
});
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

const getInterface = (interfaceType: string) => {
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
    case StageType.Geospatial:
      return Geospatial;
    case 'FinishSession':
      return FinishSession;

    default:
      // eslint-disable-next-line react/display-name
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
