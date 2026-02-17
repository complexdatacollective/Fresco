/* eslint-disable react/display-name */
import { type StageType } from '@codaco/protocol-validation';
import { lazy } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Icon from '~/components/ui/Icon';

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

const LazyNameGenerator = lazy(() => import('./NameGenerator/NameGenerator'));
const LazyNameGeneratorQuickAdd = lazy(
  () => import('./NameGenerator/NameGeneratorQuickAdd'),
);
const LazyNameGeneratorRoster = lazy(() => import('./NameGeneratorRoster'));
const LazySociogram = lazy(() => import('./Sociogram/Sociogram'));
const LazyInformation = lazy(() => import('./Information'));
const LazyOrdinalBin = lazy(() => import('./OrdinalBin/OrdinalBin'));
const LazyCategoricalBin = lazy(() => import('./CategoricalBin'));
const LazyNarrative = lazy(() => import('./Narrative/Narrative'));
const LazyAlterForm = lazy(() => import('./AlterForm'));
const LazyEgoForm = lazy(() => import('./EgoForm'));
const LazyAlterEdgeForm = lazy(() => import('./AlterEdgeForm'));
const LazyDyadCensus = lazy(() => import('./DyadCensus/DyadCensus'));
const LazyTieStrengthCensus = lazy(
  () => import('./TieStrengthCensus/TieStrengthCensus'),
);
const LazyAnonymisation = lazy(() => import('./Anonymisation/Anonymisation'));
const LazyOneToManyDyadCensus = lazy(() => import('./OneToManyDyadCensus'));
const LazyGeospatial = lazy(() => import('./Geospatial/Geospatial'));
const LazyFinishSession = lazy(() => import('./FinishSession'));
const LazyFamilyTreeCensus = lazy(
  () => import('./FamilyTreeCensus/FamilyTreeCensus'),
);

const getInterface = (interfaceType: InterfaceType) => {
  switch (interfaceType) {
    case 'NameGenerator':
      return LazyNameGenerator;
    case 'NameGeneratorQuickAdd':
      return LazyNameGeneratorQuickAdd;
    case 'NameGeneratorRoster':
      return LazyNameGeneratorRoster;
    case 'Sociogram':
      return LazySociogram;
    case 'Information':
      return LazyInformation;
    case 'OrdinalBin':
      return LazyOrdinalBin;
    case 'CategoricalBin':
      return LazyCategoricalBin;
    case 'Narrative':
      return LazyNarrative;
    case 'AlterForm':
      return LazyAlterForm;
    case 'EgoForm':
      return LazyEgoForm;
    case 'AlterEdgeForm':
      return LazyAlterEdgeForm;
    case 'DyadCensus':
      return LazyDyadCensus;
    case 'TieStrengthCensus':
      return LazyTieStrengthCensus;
    case 'Anonymisation':
      return LazyAnonymisation;
    case 'OneToManyDyadCensus':
      return LazyOneToManyDyadCensus;
    case 'Geospatial':
      return LazyGeospatial;
    case 'FinishSession':
      return LazyFinishSession;
    case 'FamilyTreeCensus':
      return LazyFamilyTreeCensus;
    default:
      return () => <NotFoundInterface interfaceType={interfaceType} />;
  }
};

export default getInterface;
