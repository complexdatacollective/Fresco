import { type Stage } from '@codaco/protocol-validation';
import { Node } from '~/lib/ui/components';
import { Rectangle } from '~/lib/ui/components/Node';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { type StageProps } from '../Stage';
import generateCoords from './Sugiyama';
import TreeNode from './TreeNode';

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};

const tree = new TreeNode('Parents', [
  new TreeNode('Me', [new TreeNode('Son'), new TreeNode('Daughter')]),
  new TreeNode('Sister', [
    new TreeNode('Sister son'),
    new TreeNode('Sister daughter', [new TreeNode('Sister granddaughter')]),
  ]),
]);

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const step2CensusNodes = [
    {
      id: 3,
      level: 1,
      parent: [0],
      children: [null],
      node: {
        label: 'sister',
      },
    },
    {
      id: 0,
      level: 0,
      parent: [null],
      children: [1, 3],
      node: {
        label: 'mother',
      },
    },
    {
      id: 1,
      level: 1,
      parent: [0],
      children: [2],
      node: {
        label: 'me',
        shape: Rectangle,
      },
    },
    {
      id: 2,
      level: 2,
      parent: [1],
      children: [null],
      node: {
        label: 'son',
        shape: Rectangle,
      },
    },
  ];

  generateCoords();

  return (
    <div className="family-pedigree-interface">
      {step2CensusNodes.map((person, index) => (
        <Node
          key={index}
          label={person.node.label}
          {...(person.node.shape ? { shape: person.node.shape } : {})}
        />
      ))}
    </div>
  );
};

export default withNoSSRWrapper(FamilyTreeCensus);
