import { type Stage } from '@codaco/protocol-validation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [addRelativeStep, setAddRelativeStep] = useState<
    'initial' | 'selectRelative' | 'selectGender'
  >('initial');
  const [addRelativeType, setAddRelativeType] = useState<
    'parent' | 'sibling' | 'partner' | 'child'
  >('child');
  const [couples, setCouples] = useState<
    [PlaceholderNodeProps, PlaceholderNodeProps][]
  >([]);

  useEffect(() => {
    const layers = assignLayers(familyTreeNodes, couples);
    console.log(layers);
    const coords = assignCoordinates(layers, couples, 200);
    arrangeCouples(coords, couples);

    const updatedNodes = familyTreeNodes.map((node) => {
      const pos = coords.get(node);
      return {
        ...node,
        xPos: (pos?.x ?? 0) + 100,
        yPos: (pos?.y ?? 0) + 100,
      };
    });

    setFamilyTreeNodes(updatedNodes);
  }, [familyTreeNodes.length, couples]);

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

  const addPlaceholderNode = (
    gender: string,
    label: string,
  ): PlaceholderNodeProps => {
    const newNode: PlaceholderNodeProps = {
      id: crypto.randomUUID(),
      gender: gender,
      label: label,
      parents: [],
      children: [],
    };
    return newNode;
  };

  // const generatePlaceholderNodes = (formData: Record<string, string>) => {
  //   const paternalGrandfather = addPlaceholderNode(
  //     'male',
  //     'paternal grandfather',
  //   );
  //   const paternalGrandmother = addPlaceholderNode(
  //     'female',
  //     'paternal grandmother',
  //   );
  //   const father = addPlaceholderNode('male', 'father');
  //   paternalGrandfather.children?.push(father);
  //   paternalGrandmother.children?.push(father);
  //   father.parents?.push(paternalGrandfather, paternalGrandmother);
  //   const maternalGrandfather = addPlaceholderNode(
  //     'male',
  //     'maternal grandfather',
  //   );
  //   const maternalGrandmother = addPlaceholderNode(
  //     'female',
  //     'maternal grandmother',
  //   );
  //   const mother = addPlaceholderNode('female', 'mother');
  //   maternalGrandfather.children?.push(mother);
  //   maternalGrandmother.children?.push(mother);
  //   mother.parents?.push(maternalGrandfather, maternalGrandmother);
  //   const ego = addPlaceholderNode('female', 'self');
  //   father.children?.push(ego);
  //   mother.children?.push(ego);
  //   ego.parents?.push(father, mother);
  //   const partner = addPlaceholderNode('male', 'spouse');
  //   arrayFromRelationCount(formData, 'brothers').forEach(() => {
  //     const brother = addPlaceholderNode('male', 'brother');
  //     father.children?.push(brother);
  //     mother.children?.push(brother);
  //     brother.parents?.push(father, mother);
  //   });
  //   arrayFromRelationCount(formData, 'sisters').forEach(() => {
  //     const sister = addPlaceholderNode('female', 'sister');
  //     father.children?.push(sister);
  //     mother.children?.push(sister);
  //     sister.parents?.push(father, mother);
  //   });
  //   arrayFromRelationCount(formData, 'sons').forEach(() => {
  //     const son = addPlaceholderNode('male', 'son');
  //     ego.children?.push(son);
  //     partner.children?.push(son);
  //     son.parents?.push(ego, partner);
  //   });
  //   arrayFromRelationCount(formData, 'daughters').forEach(() => {
  //     const daughter = addPlaceholderNode('female', 'daughter');
  //     ego.children?.push(daughter);
  //     partner.children?.push(daughter);
  //     daughter.parents?.push(ego, partner);
  //   });
  //   arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
  //     const uncle = addPlaceholderNode('male', 'paternal uncle');
  //     paternalGrandfather.children?.push(uncle);
  //     paternalGrandmother.children?.push(uncle);
  //     uncle.parents?.push(paternalGrandfather, paternalGrandmother);
  //   });
  //   arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
  //     const aunt = addPlaceholderNode('female', 'paternal aunt');
  //     paternalGrandfather.children?.push(aunt);
  //     paternalGrandmother.children?.push(aunt);
  //     aunt.parents?.push(paternalGrandfather, paternalGrandmother);
  //   });
  //   arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
  //     const uncle = addPlaceholderNode('male', 'maternal uncle');
  //     maternalGrandfather.children?.push(uncle);
  //     maternalGrandmother.children?.push(uncle);
  //     uncle.parents?.push(maternalGrandfather, maternalGrandmother);
  //   });
  //   arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
  //     const aunt = addPlaceholderNode('female', 'maternal aunt');
  //     maternalGrandfather.children?.push(aunt);
  //     maternalGrandmother.children?.push(aunt);
  //     aunt.parents?.push(maternalGrandfather, maternalGrandmother);
  //   });

  //   const newCouples: [PlaceholderNodeProps, PlaceholderNodeProps][] = [
  //     [paternalGrandfather, paternalGrandmother],
  //     [maternalGrandfather, maternalGrandmother],
  //     [father, mother],
  //     [ego, partner],
  //   ];
  //   setCouples(newCouples);
  //   setFamilyTreeNodes(allNodes);
  // };

  const generatePlaceholderNodes = (formData: Record<string, string>) => {
    const nodes: PlaceholderNodeProps[] = [];
    const newCouples: [PlaceholderNodeProps, PlaceholderNodeProps][] = [];

    const addNode = (gender: string, label: string): PlaceholderNodeProps => {
      const node: PlaceholderNodeProps = {
        id: crypto.randomUUID(),
        gender,
        label,
        parents: [],
        children: [],
      };
      nodes.push(node);
      return node;
    };

    const paternalGrandfather = addNode('male', 'paternal grandfather');
    const paternalGrandmother = addNode('female', 'paternal grandmother');
    const father = addNode('male', 'father');
    paternalGrandfather.children?.push(father);
    paternalGrandmother.children?.push(father);
    father.parents?.push(paternalGrandfather, paternalGrandmother);
    newCouples.push([paternalGrandfather, paternalGrandmother]);

    const maternalGrandfather = addNode('male', 'maternal grandfather');
    const maternalGrandmother = addNode('female', 'maternal grandmother');
    const mother = addNode('female', 'mother');
    maternalGrandfather.children?.push(mother);
    maternalGrandmother.children?.push(mother);
    mother.parents?.push(maternalGrandfather, maternalGrandmother);
    newCouples.push([maternalGrandfather, maternalGrandmother]);

    newCouples.push([father, mother]);

    const ego = addNode('female', 'self');
    const partner = addNode('male', 'spouse');
    father.children?.push(ego);
    mother.children?.push(ego);
    ego.parents?.push(father, mother);
    newCouples.push([ego, partner]);

    arrayFromRelationCount(formData, 'brothers').forEach(() => {
      const brother = addNode('male', 'brother');
      brother.parents?.push(father, mother);
      father.children?.push(brother);
      mother.children?.push(brother);
    });
    arrayFromRelationCount(formData, 'sisters').forEach(() => {
      const sister = addNode('female', 'sister');
      sister.parents?.push(father, mother);
      father.children?.push(sister);
      mother.children?.push(sister);
    });

    arrayFromRelationCount(formData, 'sons').forEach(() => {
      const son = addNode('male', 'son');
      son.parents?.push(ego, partner);
      ego.children?.push(son);
      partner.children?.push(son);
    });
    arrayFromRelationCount(formData, 'daughters').forEach(() => {
      const daughter = addNode('female', 'daughter');
      daughter.parents?.push(ego, partner);
      ego.children?.push(daughter);
      partner.children?.push(daughter);
    });

    arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
      const uncle = addNode('male', 'paternal uncle');
      uncle.parents?.push(paternalGrandfather, paternalGrandmother);
      paternalGrandfather.children?.push(uncle);
      paternalGrandmother.children?.push(uncle);
    });
    arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
      const aunt = addNode('female', 'paternal aunt');
      aunt.parents?.push(paternalGrandfather, paternalGrandmother);
      paternalGrandfather.children?.push(aunt);
      paternalGrandmother.children?.push(aunt);
    });

    arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
      const uncle = addNode('male', 'maternal uncle');
      uncle.parents?.push(maternalGrandfather, maternalGrandmother);
      maternalGrandfather.children?.push(uncle);
      maternalGrandmother.children?.push(uncle);
    });
    arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
      const aunt = addNode('female', 'maternal aunt');
      aunt.parents?.push(maternalGrandfather, maternalGrandmother);
      maternalGrandfather.children?.push(aunt);
      maternalGrandmother.children?.push(aunt);
    });

    setFamilyTreeNodes(nodes);
    setCouples(newCouples);
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

  const addNode = (newNode: PlaceholderNodeProps) => {
    setFamilyTreeNodes((prev) => [...prev, newNode]);
  };

  const addCouple = (a: PlaceholderNodeProps, b: PlaceholderNodeProps) => {
    setCouples((prev) => [...prev, [a, b]]);
  };

  const addNewRelative = (relative: string, gender: string) => {
    const selected = familyTreeNodes.find((n) => n.id === selectedNode.id);

    switch (relative) {
      case 'parent':
        const newParent = addPlaceholderNode(
          gender,
          gender === 'female' ? 'mother' : 'father',
        );

        selected?.parents?.push(newParent);
        addNode(newParent);
        break;
      case 'sibling':
        const newSibling = addPlaceholderNode(
          gender,
          gender === 'female' ? 'daughter' : 'brother',
        );
        const parents = selected?.parents;
        parents?.forEach((parent) => parent.children?.push(newSibling));
        newSibling?.parents?.push(...parents);
        addNode(newSibling);
        break;
      case 'partner':
        console.log('partner');
        break;
      case 'child':
        console.log('child');
        break;
    }
  };

  const AddNodeHelper = ({
    x,
    y,
    label,
  }: {
    x: number;
    y: number;
    label: string;
  }) => {
    let animateClass;
    let clickAction = () => {};

    switch (label) {
      case 'Add Parent':
        animateClass = 'fade-slide-up';
        clickAction = () => {
          setAddRelativeType('parent');
          setAddRelativeStep('selectGender');
        };
        break;
      case 'Add Sibling':
        animateClass = 'fade-slide-diag-up';
        clickAction = () => {
          setAddRelativeType('sibling');
          setAddRelativeStep('selectGender');
        };
        break;
      case 'Add Partner':
        animateClass = 'fade-slide-diag-down';
        clickAction = () => {
          setAddRelativeType('partner');
          setAddRelativeStep('selectGender');
        };
        break;
      case 'Add Child':
        animateClass = 'fade-slide-down';
        clickAction = () => {
          setAddRelativeType('child');
          setAddRelativeStep('selectGender');
        };
        break;
      case 'Male':
        animateClass = 'fade-slide-right';
        clickAction = () => {
          addNewRelative(addRelativeType, 'male');
          setAddRelativeStep('initial');
        };
        break;
      case 'Female':
        animateClass = 'fade-slide-left';
        clickAction = () => {
          addNewRelative(addRelativeType, 'female');
          setAddRelativeStep('initial');
        };
        break;
    }

    return (
      <div
        className={`${animateClass} absolute cursor-pointer rounded-full border px-2 py-1 text-xs shadow`}
        style={{
          top: y,
          left: x,
          fontWeight: 'bold',
          height: '55px',
          width: '55px',
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          color: 'black',
          backgroundColor: 'rgb(33, 226, 171)',
        }}
        onClick={clickAction}
      >
        {label}
      </div>
    );
  };

  const nodeRefs = useRef(new Map<string, React.RefObject<HTMLDivElement>>());

  const addAdditionalMember = (node: PlaceholderNodeProps) => {
    const ref = nodeRefs.current.get(node.id!);
    const nodeEl = ref?.current;

    setAddRelativeStep('selectRelative');

    if (nodeEl) {
      const rect = nodeEl.getBoundingClientRect();
      const parentRect = document
        .querySelector('.node-layout')
        ?.getBoundingClientRect();
      const offsetX = rect.left - (parentRect?.left || 0);
      const offsetY = rect.top - (parentRect?.top || 0);

      setSelectedNode({
        id: node.id!,
        x: offsetX + rect.width / 2,
        y: offsetY + rect.height / 2,
      });
    }
  };

  const renderFamilyTreeShells = () => {
    return (
      <div className="family-pedigree-interface">
        <div className="edge-layout"></div>
        <div className="node-layout">
          {familyTreeNodes.map((node) => {
            if (!nodeRefs.current.has(node.id!)) {
              nodeRefs.current.set(node.id!, React.createRef<HTMLDivElement>());
            }

            return (
              <FamilyTreeNode
                key={crypto.randomUUID()}
                ref={nodeRefs.current.get(node.id!)}
                id={node.id}
                gender={node.gender}
                label={node.label}
                xPos={node.xPos}
                yPos={node.yPos}
                handleClick={() => addAdditionalMember(node)}
              />
            );
          })}

          {selectedNode && addRelativeStep === 'selectRelative' && (
            <>
              <AddNodeHelper
                key={`parent-${selectedNode.id}`}
                x={selectedNode.x}
                y={selectedNode.y}
                label="Add Parent"
              />
              <AddNodeHelper
                key={`sibling-${selectedNode.id}`}
                x={selectedNode.x}
                y={selectedNode.y}
                label="Add Sibling"
              />
              <AddNodeHelper
                key={`child-${selectedNode.id}`}
                x={selectedNode.x}
                y={selectedNode.y}
                label="Add Child"
              />
              <AddNodeHelper
                key={`partner-${selectedNode.id}`}
                x={selectedNode.x}
                y={selectedNode.y}
                label="Add Partner"
              />
            </>
          )}

          {selectedNode && addRelativeStep === 'selectGender' && (
            <>
              <AddNodeHelper
                x={selectedNode.x}
                y={selectedNode.y}
                label="Male"
              />
              <AddNodeHelper
                x={selectedNode.x}
                y={selectedNode.y}
                label="Female"
              />
            </>
          )}
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
        {/* {selectedNode != null ? renderNameForm() : null} */}
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
