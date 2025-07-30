import { type Stage } from '@codaco/protocol-validation';
import { useCallback, useState } from 'react';
import UIOffspringConnector from '~/lib/ui/components/FamilyTree/OffspringConnector';
import UIPartnerConnector from '~/lib/ui/components/FamilyTree/PartnerConnector';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import Form from '../../Form';
import { type StageProps } from '../../Stage';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { FamilyTreeNode } from './FamilyTreeNode';
import { arrangeCouples, assignCoordinates, assignLayers } from './Sugiyama';

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const xEgoOffset = 300;
const yParentOffset = 100;

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { getNavigationHelpers, registerBeforeNext } = props;
  // keep an index to the step that we're viewing
  // and configure navigation logic
  const [activeIndex, setActiveIndex] = useState(0);
  const { moveForward } = getNavigationHelpers();
  const getItemIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const isStep1 = useCallback(() => activeIndex === 0, [activeIndex]);
  const isStep2 = useCallback(() => activeIndex === 1, [activeIndex]);
  const previousItem = useCallback(
    () => setActiveIndex(getItemIndex()),
    [getItemIndex],
  );
  const nextItem = useCallback(
    () => setActiveIndex(activeIndex + 1),
    [activeIndex],
  );
  const beforeNext = (direction: string) => {
    if (direction == 'forwards') {
      nextItem();
    } else if (direction == 'backwards') {
      previousItem();
    }
    return false;
  };
  registerBeforeNext(beforeNext);

  const [familyTreeNodes, setFamilyTreeNodes] = useState<
    PlaceholderNodeProps[]
  >([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // return either an empty array or an array of integers from 1 to the number of relations
  const arrayFromRelationCount = (
    formData: Record<string, string>,
    relation: string,
  ) => {
    if (typeof formData[relation] != 'string') {
      return [];
    } else {
      return [...Array(parseInt(formData[relation])).keys()];
    }
  };

  const generatePlaceholderNodes = (formData: Record<string, string>) => {
    const allNodes: PlaceholderNodeProps[] = [];
    const addPlaceholderNode = (
      gender: string,
      label: string,
    ): PlaceholderNodeProps => {
      const newNode: PlaceholderNodeProps = {
        gender: gender,
        label: label,
        parents: [],
        children: [],
        handleClick: setSelectedNode,
      };
      allNodes.push(newNode);
      return newNode;
    };

    const paternalGrandfather = addPlaceholderNode(
      'male',
      'paternal grandfather',
    );
    const paternalGrandmother = addPlaceholderNode(
      'female',
      'paternal grandmother',
    );
    const father = addPlaceholderNode('male', 'father');
    paternalGrandfather.children?.push(father);
    paternalGrandmother.children?.push(father);
    father.parents?.push(paternalGrandfather, paternalGrandmother);
    const maternalGrandfather = addPlaceholderNode(
      'male',
      'maternal grandfather',
    );
    const maternalGrandmother = addPlaceholderNode(
      'female',
      'maternal grandmother',
    );
    const mother = addPlaceholderNode('female', 'mother');
    maternalGrandfather.children?.push(mother);
    maternalGrandmother.children?.push(mother);
    mother.parents?.push(maternalGrandfather, maternalGrandmother);
    const ego = addPlaceholderNode('female', 'self');
    father.children?.push(ego);
    mother.children?.push(ego);
    ego.parents?.push(father, mother);
    const partner = addPlaceholderNode('male', 'spouse');
    arrayFromRelationCount(formData, 'brothers').forEach(() => {
      const brother = addPlaceholderNode('male', 'brother');
      father.children?.push(brother);
      mother.children?.push(brother);
      brother.parents?.push(father, mother);
    });
    arrayFromRelationCount(formData, 'sisters').forEach(() => {
      const sister = addPlaceholderNode('female', 'sister');
      father.children?.push(sister);
      mother.children?.push(sister);
      sister.parents?.push(father, mother);
    });
    arrayFromRelationCount(formData, 'sons').forEach(() => {
      const son = addPlaceholderNode('male', 'son');
      ego.children?.push(son);
      partner.children?.push(son);
      son.parents?.push(ego, partner);
    });
    arrayFromRelationCount(formData, 'daughters').forEach(() => {
      const daughter = addPlaceholderNode('female', 'daughter');
      ego.children?.push(daughter);
      partner.children?.push(daughter);
      daughter.parents?.push(ego, partner);
    });
    arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
      const uncle = addPlaceholderNode('male', 'paternal uncle');
      paternalGrandfather.children?.push(uncle);
      paternalGrandmother.children?.push(uncle);
      uncle.parents?.push(paternalGrandfather, paternalGrandmother);
    });
    arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
      const aunt = addPlaceholderNode('female', 'paternal aunt');
      paternalGrandfather.children?.push(aunt);
      paternalGrandmother.children?.push(aunt);
      aunt.parents?.push(paternalGrandfather, paternalGrandmother);
    });
    arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
      const uncle = addPlaceholderNode('male', 'maternal uncle');
      maternalGrandfather.children?.push(uncle);
      maternalGrandmother.children?.push(uncle);
      uncle.parents?.push(maternalGrandfather, maternalGrandmother);
    });
    arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
      const aunt = addPlaceholderNode('female', 'maternal aunt');
      maternalGrandfather.children?.push(aunt);
      maternalGrandmother.children?.push(aunt);
      aunt.parents?.push(maternalGrandfather, maternalGrandmother);
    });

    const couples: [PlaceholderNodeProps, PlaceholderNodeProps][] = [
      [paternalGrandfather, paternalGrandmother],
      [maternalGrandfather, maternalGrandmother],
      [father, mother],
      [ego, partner],
    ];
    const layers = assignLayers(allNodes, couples);
    const coords = assignCoordinates(layers, couples, 200);
    const xOffset = 100;
    const yOffset = 100;
    arrangeCouples(coords, couples);
    allNodes.forEach((node) => {
      const pos = coords.get(node);
      node.xPos = (pos?.x ?? 0) + xOffset;
      node.yPos = (pos?.y ?? 0) + yOffset;
    });
    setFamilyTreeNodes(allNodes);
  };

  const renderCensusForm = () => {
    const step1CensusForm = {
      fields: [
        { variable: 'brothers', prompt: 'How many brothers do you have?' },
        { variable: 'sisters', prompt: 'How many sisters do you have?' },
        { variable: 'sons', prompt: 'How many sons do you have?' },
        { variable: 'daughters', prompt: 'How many daughters do you have?' },
        {
          variable: 'maternal-uncles',
          prompt: 'How many brothers does your mother have?',
        },
        {
          variable: 'maternal-aunts',
          prompt: 'How many sisters does your mother have?',
        },
        {
          variable: 'paternal-uncles',
          prompt: 'How many brothers does your father have?',
        },
        {
          variable: 'paternal-aunts',
          prompt: 'How many sisters does your father have?',
        },
      ],
    };

    const handleSubmitForm = (formData: Record<string, string>) => {
      generatePlaceholderNodes(formData);
      moveForward();
    };

    return (
      <div className="interface ego-form alter-form family-pedigree-interface">
        <div className="ego-form__form-container">
          <Form
            {...step1CensusForm}
            className="family-member-count-form"
            form="FamilyPedigree"
            onSubmit={handleSubmitForm}
          />
        </div>
      </div>
    );
  };

  const renderNameForm = () => {
    const step3NameForm = {
      fields: [{ variable: 'name', prompt: "What is this person's name?" }],
    };

    return (
      <div className="interface ego-form alter-form family-pedigree-interface">
        <div className="ego-form__form-container">
          <Form
            {...step3NameForm}
            className="family-member-count-form"
            form="FamilyPedigree"
          />
        </div>
      </div>
    );
  };

  const renderFamilyTreeShells = () => {
    return (
      <div className="family-pedigree-interface">
        <div className="edge-layout">
          {/*<UIPartnerConnector
            xStartPos={xEgoOffset - 50}
            xEndPos={xEgoOffset + 50}
            yPos={yParentOffset}
          />
          <UIOffspringConnector
            xPos={xEgoOffset}
            yStartPos={yParentOffset}
            yEndPos={yParentOffset + 50}
          />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={500} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={600} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={700} yPos={150} />*/}
        </div>
        <div className="node-layout">
          {familyTreeNodes.map((node) => {
            return (
              <FamilyTreeNode
                key={crypto.randomUUID()}
                id={node.id}
                gender={node.gender}
                label={node.label}
                xPos={node.xPos}
                yPos={node.yPos}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderFamilyTreeCompletion = () => {
    return (
      <div className="family-pedigree-interface">
        <div className="edge-layout">
          <UIPartnerConnector
            xStartPos={xEgoOffset - 50}
            xEndPos={xEgoOffset + 50}
            yPos={yParentOffset}
          />
          <UIOffspringConnector
            xPos={xEgoOffset}
            yStartPos={yParentOffset}
            yEndPos={yParentOffset + 50}
          />
          {/*<UISiblingConnector xStartPos={xEgoOffset} xEndPos={500} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={600} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={700} yPos={150} />*/}
        </div>
        <div className="node-layout">
          {familyTreeNodes.map((node) => {
            return (
              <FamilyTreeNode
                key={crypto.randomUUID()}
                id={node.id}
                gender={node.gender}
                label={node.label}
                xPos={node.xPos}
                yPos={node.yPos}
                handleClick={node.handleClick}
              />
            );
          })}
        </div>
        {selectedNode != null ? renderNameForm() : null}
      </div>
    );
  };

  const renderActiveStep = () => {
    if (isStep1()) {
      return renderCensusForm();
    } else if (isStep2()) {
      return renderFamilyTreeShells();
    } else {
      return renderFamilyTreeCompletion();
    }
  };

  return <div>{renderActiveStep()}</div>;
};

export default withNoSSRWrapper(FamilyTreeCensus);
