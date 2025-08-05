import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import UIChildConnector from '~/lib/ui/components/FamilyTree/ChildConnector';
import UIOffspringConnector from '~/lib/ui/components/FamilyTree/OffspringConnector';
import UIPartnerConnector from '~/lib/ui/components/FamilyTree/PartnerConnector';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { addNode as addNodeAction } from '../../../ducks/modules/session';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { getNetworkNodesForType } from '../../../selectors/session';
import { useAppDispatch } from '../../../store';
import Form from '../../Form';
import { type StageProps } from '../../Stage';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { FamilyTreeNode } from './FamilyTreeNode';
import {
  arrangeCouples,
  arrangeSiblings,
  assignCoordinates,
  assignLayers,
  fixOverlaps,
} from './Sugiyama';

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const rowHeight = 150;

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { getNavigationHelpers, registerBeforeNext, stage } = props;
  let elementRef = useRef(null);
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
  const getFamilyTreeNodes = () => {
    const placeholderNodeFromRealNode = (
      node: NcNode,
    ): PlaceholderNodeProps => {
      let name = node[entityAttributesProperty]['name'];
      name = typeof name == 'string' ? name : 'unknown';
      let gender = node[entityAttributesProperty]['gender'];
      gender = typeof gender == 'string' ? gender : 'unknown';
      let xPos = node[entityAttributesProperty]['x'];
      xPos = typeof xPos == 'number' ? xPos : 0;
      let yPos = node[entityAttributesProperty]['y'];
      yPos = typeof yPos == 'number' ? yPos : 0;
      return {
        id: node[entityPrimaryKeyProperty],
        gender: gender,
        label: name,
        xPos: xPos,
        yPos: yPos,
      };
    };
    const networkNodeIds = nodes.map((node) => node[entityPrimaryKeyProperty]);
    return familyTreeNodes
      .filter((node) => !networkNodeIds.includes(node.id || ''))
      .concat(nodes.map((node) => placeholderNodeFromRealNode(node)));
  };
  const [selectedNode, setSelectedNode] = useState<PlaceholderNodeProps | null>(
    null,
  );

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const nodes = useSelector(getNetworkNodesForType);
  const dispatch = useAppDispatch();

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
        id: crypto.randomUUID(),
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
    paternalGrandfather.partner = paternalGrandmother;
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
    maternalGrandfather.partner = maternalGrandmother;
    const mother = addPlaceholderNode('female', 'mother');
    father.partner = mother;
    maternalGrandfather.children?.push(mother);
    maternalGrandmother.children?.push(mother);
    mother.parents?.push(maternalGrandfather, maternalGrandmother);
    const ego = addPlaceholderNode('female', 'self');
    father.children?.push(ego);
    mother.children?.push(ego);
    ego.parents?.push(father, mother);
    const partner = addPlaceholderNode('male', 'spouse');
    ego.partner = partner;
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
    const [coords, grouped] = assignCoordinates(layers, couples);
    arrangeSiblings(grouped, coords);
    arrangeCouples(coords, couples);
    fixOverlaps(grouped, coords, couples);
    // centerTree(allNodes, coords, elementRef);
    const xOffset = 200; // account for the scrollbar
    const yOffset = 100; // account for the navbar
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

    const handleSubmitCensusForm = (formData: Record<string, string>) => {
      moveForward();
      generatePlaceholderNodes(formData);
    };

    return (
      <div className="interface ego-form alter-form family-pedigree-interface">
        <div className="ego-form__form-container">
          <Form
            {...step1CensusForm}
            className="family-member-count-form"
            form="FamilyPedigree"
            onSubmit={handleSubmitCensusForm}
          />
        </div>
      </div>
    );
  };

  const addNode = useCallback(
    (
      primaryKey: NcNode[EntityPrimaryKey],
      attributes: NcNode[EntityAttributesProperty],
    ) => {
      void dispatch(
        addNodeAction({
          type: stage.subject.type,
          attributeData: attributes,
          modelData: { [entityPrimaryKeyProperty]: primaryKey },
        }),
      );
    },
    [dispatch, stage.subject.type],
  );

  const handleSubmitName = useCallback(
    (formData: Record<string, string>) => {
      if (
        selectedNode == null ||
        selectedNode.id == null ||
        formData['name'] == null
      )
        return;

      addNode(selectedNode.id, {
        name: formData['name'],
        gender: selectedNode.gender,
        x: selectedNode.xPos ?? 0,
        y: selectedNode.yPos ?? 0,
      });

      setSelectedNode(null);
    },
    [selectedNode, newNodeAttributes, addNode, setSelectedNode],
  );

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
            onSubmit={handleSubmitName}
          />
        </div>
      </div>
    );
  };

  const renderFamilyTreeShells = () => {
    return (
      <div className="family-pedigree-interface">
        <div className="edge-layout">
          {familyTreeNodes.map((node) => {
            return (
              node.partner != null && (
                <UIPartnerConnector
                  key={crypto.randomUUID()}
                  xStartPos={(node.xPos ?? 0) + 10}
                  xEndPos={(node.partner?.xPos ?? 0) - 20}
                  yPos={node.yPos}
                />
              )
            );
          })}
          {familyTreeNodes.map((node) => {
            return (
              node.partner != null &&
              (node.children?.length ?? 0) > 0 && (
                <UIOffspringConnector
                  key={crypto.randomUUID()}
                  xPos={((node.xPos ?? 0) + (node.partner?.xPos ?? 0)) / 2}
                  yStartPos={node.yPos ?? 0}
                  yEndPos={(node.yPos ?? 0) + rowHeight / 3}
                />
              )
            );
          })}
          {familyTreeNodes.map((node) => {
            return (
              node.partner != null &&
              node.children != null &&
              node.children.length > 0 &&
              node.children.map((child) => {
                return (
                  <UIChildConnector
                    key={crypto.randomUUID()}
                    xStartPos={child.xPos ?? 0}
                    xEndPos={((node.xPos ?? 0) + (node.partner?.xPos ?? 0)) / 2}
                    yPos={(child.yPos ?? 0) - rowHeight / 2 + 5}
                    height={rowHeight / 3 - 15}
                  />
                );
              })
            );
          })}
        </div>
        <div className="node-layout" ref={elementRef}>
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
          {getFamilyTreeNodes().map((node) => {
            return (
              node.partner != null && (
                <UIPartnerConnector
                  key={`partner-${node.id}`}
                  xStartPos={(node.xPos ?? 0) + 10}
                  xEndPos={(node.partner?.xPos ?? 0) - 20}
                  yPos={node.yPos}
                />
              )
            );
          })}
          {getFamilyTreeNodes().map((node) => {
            return (
              node.partner != null &&
              (node.children?.length ?? 0) > 0 && (
                <UIOffspringConnector
                  key={`offspring-${node.id}`}
                  xPos={((node.xPos ?? 0) + (node.partner?.xPos ?? 0)) / 2}
                  yStartPos={node.yPos ?? 0}
                  yEndPos={(node.yPos ?? 0) + rowHeight / 3}
                />
              )
            );
          })}
          {getFamilyTreeNodes().map((node) => {
            return (
              node.partner != null &&
              node.children != null &&
              node.children.length > 0 &&
              node.children.map((child) => {
                return (
                  <UIChildConnector
                    key={`child-${node.id}`}
                    xStartPos={child.xPos ?? 0}
                    xEndPos={((node.xPos ?? 0) + (node.partner?.xPos ?? 0)) / 2}
                    yPos={(child.yPos ?? 0) - rowHeight / 2 + 5}
                    height={rowHeight / 3 - 15}
                  />
                );
              })
            );
          })}
        </div>
        <div className="node-layout" ref={elementRef}>
          <div className="inner-node-layout">
            {getFamilyTreeNodes().map((node) => {
              return (
                <FamilyTreeNode
                  key={node.id}
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
