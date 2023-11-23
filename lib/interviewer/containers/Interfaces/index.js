import { Icon } from '@codaco/ui';
import dynamic from 'next/dynamic';
import { StageType } from '../../protocol-consts';

// const NameGenerator = dynamic(() => import('./NameGenerator'));
// const NameGeneratorQuickAdd = dynamic(() => import('./NameGeneratorQuickAdd'));
// const NameGeneratorRoster = dynamic(() => import('./NameGeneratorRoster'));
// const Sociogram = dynamic(() => import('./Sociogram'));
const Information = dynamic(() => import('./Information'));
// const OrdinalBin = dynamic(() => import('./OrdinalBin'));
// const CategoricalBin = dynamic(() => import('./CategoricalBin'));
// const Narrative = dynamic(() => import('./Narrative'));
// const AlterForm = dynamic(() => import('./AlterForm'));
// const EgoForm = dynamic(() => import('./EgoForm'));
// const AlterEdgeForm = dynamic(() => import('./AlterEdgeForm'));
// const DyadCensus = dynamic(() => import('./DyadCensus'));
// const TieStrengthCensus = dynamic(() => import('./TieStrengthCensus'));
const FinishSession = dynamic(() => import('./FinishSession'));

const getInterface = (interfaceType) => {
  switch (interfaceType) {
    // case StageType.NameGenerator:
    //   return NameGenerator;
    // case StageType.NameGeneratorQuickAdd:
    //   return NameGeneratorQuickAdd;
    // case StageType.NameGeneratorRoster:
    //   return NameGeneratorRoster;
    // case StageType.Sociogram:
    //   return Sociogram;
    case StageType.Information:
      return Information;
    // case StageType.OrdinalBin:
    //   return OrdinalBin;
    // case StageType.CategoricalBin:
    //   return CategoricalBin;
    // case StageType.Narrative:
    //   return Narrative;
    // case StageType.AlterForm:
    //   return AlterForm;
    // case StageType.EgoForm:
    //   return EgoForm;
    // case StageType.AlterEdgeForm:
    //   return AlterEdgeForm;
    // case StageType.DyadCensus:
    //   return DyadCensus;
    // case StageType.TieStrengthCensus:
    //   return TieStrengthCensus;
    case 'FinishSession':
      return FinishSession;
    default:
      return () => (
        <div style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Icon name="warning" />
            <h1 style={{ marginTop: '1rem' }}>
              No &quot;
              {interfaceType}
              &quot; interface found.
            </h1>
          </div>
        </div>
      )
  }
};

export default getInterface;
