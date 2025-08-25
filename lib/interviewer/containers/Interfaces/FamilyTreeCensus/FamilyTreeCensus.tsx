import { type Stage } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import UIChildConnector from '~/lib/ui/components/FamilyTree/ChildConnector';
import UIOffspringConnector from '~/lib/ui/components/FamilyTree/OffspringConnector';
import UIPartnerConnector from '~/lib/ui/components/FamilyTree/PartnerConnector';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { updatePedigreeStageMetadata } from '../../../ducks/modules/session';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { type RootState, useAppDispatch } from '../../../store';
import Form from '../../Form';
import { type StageProps } from '../../Stage';
import CensusStep2Form from './CensusStep2Form';
import FamilyTreeLayout from './FamilyTreeLayout';
import type { PlaceholderNodeProps } from './FamilyTreeNode';
import { FamilyTreeNode, FamilyTreeNodeNetworkBacked } from './FamilyTreeNode';
import FamilyTreeNodeForm from './FamilyTreeNodeForm';
import useFamilyTreeNodes from './useFamilyTreeNodes';

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const rowHeight = 205;

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { getNavigationHelpers, registerBeforeNext, stage } = props;

  const networkNodes = useSelector(
    (state: RootState) =>
      state.session.network.nodes?.filter(
        (n) => n.type === stage.subject.type,
      ) ?? [],
  );

  const { setPlaceholderNodesBulk, allNodes, commitPlaceholderNode } =
    useFamilyTreeNodes(networkNodes, stage);

  const positionedNodes = useMemo(() => {
    if (allNodes.length === 0) return [];
    return runLayout(allNodes);
  }, [allNodes]);

  const familyTreeNodesById = useMemo(() => {
    const m: Record<string, PlaceholderNodeProps> = {};
    for (const n of positionedNodes) m[n.id] = n;
    return m;
  }, [positionedNodes]);

  function runLayout(nodes: PlaceholderNodeProps[]) {
    const cloned = nodes.map((n) => ({
      ...n,
      parentIds: [...(n.parentIds ?? [])],
      childIds: [...(n.childIds ?? [])],
    }));

    const layout = new FamilyTreeLayout(cloned, {
      startX: 200,
      startY: 100,
      siblings: 150,
      partners: 120,
      generations: 180,
    });

    //return layout.arrangeNodes({ xOffset: 100, yOffset: 100 });
    return layout.nodes;
  }

  const elementRef = useRef(null);
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

  // const familyTreeNodeList = new FamilyTreeNodeList(familyTreeNodes, nodes);
  const [selectedNode, setSelectedNode] = useState<
    PlaceholderNodeProps | NcNode | null
  >(null);
  const [egoNodeId, setEgoNodeId] = useState<string>('');

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
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
    // Use a temporary local array to accumulate nodes before setting
    const tempNodes: PlaceholderNodeProps[] = [];

    const createNode = (
      gender: string,
      label: string,
    ): PlaceholderNodeProps => {
      return {
        id: crypto.randomUUID(),
        gender,
        label,
        parentIds: [],
        childIds: [],
        xPos: 0,
        yPos: 0,
      };
    };

    // Helper to add node and push to tempNodes array
    const addNode = (gender: string, label: string) => {
      const node = createNode(gender, label);
      tempNodes.push(node);
      return node;
    };

    // Create family members
    const maternalGrandmother = addNode('female', 'maternal grandmother');
    const maternalGrandfather = addNode('male', 'maternal grandfather');
    maternalGrandfather.partnerId = maternalGrandmother.id;
    maternalGrandmother.partnerId = maternalGrandfather.id;

    const paternalGrandmother = addNode('female', 'paternal grandmother');
    const paternalGrandfather = addNode('male', 'paternal grandfather');
    paternalGrandfather.partnerId = paternalGrandmother.id;
    paternalGrandmother.partnerId = paternalGrandfather.id;

    const mother = addNode('female', 'mother');
    maternalGrandfather.childIds?.push(mother.id ?? '');
    maternalGrandmother.childIds?.push(mother.id ?? '');
    mother.parentIds?.push(
      maternalGrandfather.id ?? '',
      maternalGrandmother.id ?? '',
    );

    const father = addNode('male', 'father');
    father.partnerId = mother.id;
    mother.partnerId = father.id;
    paternalGrandfather.childIds?.push(father.id ?? '');
    paternalGrandmother.childIds?.push(father.id ?? '');
    father.parentIds?.push(
      paternalGrandfather.id ?? '',
      paternalGrandmother.id ?? '',
    );

    const ego = addNode('female', 'self');
    setEgoNodeId(ego.id);
    father.childIds?.push(ego.id ?? '');
    mother.childIds?.push(ego.id ?? '');
    ego.parentIds?.push(father.id ?? '', mother.id ?? '');

    const partner = addNode('male', 'spouse');
    ego.partnerId = partner.id;
    partner.partnerId = ego.id;

    // Add siblings, children, uncles, aunts
    arrayFromRelationCount(formData, 'brothers').forEach(() => {
      const brother = addNode('male', 'brother');
      father.childIds?.push(brother.id ?? '');
      mother.childIds?.push(brother.id ?? '');
      brother.parentIds?.push(father.id ?? '', mother.id ?? '');
    });

    arrayFromRelationCount(formData, 'sisters').forEach(() => {
      const sister = addNode('female', 'sister');
      father.childIds?.push(sister.id ?? '');
      mother.childIds?.push(sister.id ?? '');
      sister.parentIds?.push(father.id ?? '', mother.id ?? '');
    });

    arrayFromRelationCount(formData, 'sons').forEach(() => {
      const son = addNode('male', 'son');
      ego.childIds?.push(son.id ?? '');
      partner.childIds?.push(son.id ?? '');
      son.parentIds?.push(ego.id ?? '', partner.id ?? '');
    });

    arrayFromRelationCount(formData, 'daughters').forEach(() => {
      const daughter = addNode('female', 'daughter');
      ego.childIds?.push(daughter.id ?? '');
      partner.childIds?.push(daughter.id ?? '');
      daughter.parentIds?.push(ego.id ?? '', partner.id ?? '');
    });

    arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
      const uncle = addNode('male', 'paternal uncle');
      paternalGrandfather.childIds?.push(uncle.id ?? '');
      paternalGrandmother.childIds?.push(uncle.id ?? '');
      uncle.parentIds?.push(
        paternalGrandfather.id ?? '',
        paternalGrandmother.id ?? '',
      );
    });

    arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
      const aunt = addNode('female', 'paternal aunt');
      paternalGrandfather.childIds?.push(aunt.id ?? '');
      paternalGrandmother.childIds?.push(aunt.id ?? '');
      aunt.parentIds?.push(
        paternalGrandfather.id ?? '',
        paternalGrandmother.id ?? '',
      );
    });

    arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
      const uncle = addNode('male', 'maternal uncle');
      maternalGrandfather.childIds?.push(uncle.id ?? '');
      maternalGrandmother.childIds?.push(uncle.id ?? '');
      uncle.parentIds?.push(
        maternalGrandfather.id ?? '',
        maternalGrandmother.id ?? '',
      );
    });

    arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
      const aunt = addNode('female', 'maternal aunt');
      maternalGrandfather.childIds?.push(aunt.id ?? '');
      maternalGrandmother.childIds?.push(aunt.id ?? '');
      aunt.parentIds?.push(
        maternalGrandfather.id ?? '',
        maternalGrandmother.id ?? '',
      );
    });

    // Now layout the nodes
    const xOffset = 100; // account for the scrollbar
    const yOffset = 100; // account for the navbar
    //const treeLayout = new TreeLayout(tempNodes);
    //treeLayout.arrangeNodes({ xOffset, yOffset });
    const treeLayout = new FamilyTreeLayout(tempNodes, {
      startX: 200,
      startY: 100,
      siblings: 150,
      partners: 120,
      generations: 180,
    });

    // Update positions after layout
    const updatedNodes = tempNodes.map((node) => {
      const layoutNode = treeLayout.nodes.find((n) => n.id === node.id);
      return {
        ...node,
        xPos: layoutNode?.xPos,
        yPos: layoutNode?.yPos,
      };
    });

    setPlaceholderNodesBulk(updatedNodes);

    setFamilyTreeNodes(updatedNodes);
    dispatch(updatePedigreeStageMetadata(updatedNodes));
  };

  // TODO: clean up all the state code tracking tree nodes.
  // there's like 3 different instances of state tracking the same thing

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

  // const addNode = useCallback(
  //   (attributes: NcNode[EntityAttributesProperty]) => {
  //     void dispatch(
  //       addNodeAction({
  //         type: stage.subject.type,
  //         attributeData: attributes,
  //       }),
  //     );
  //   },
  //   [dispatch, stage.subject.type],
  // );

  // const createNetworkNode = useCallback(
  //   (attributes: NcNode[EntityAttributesProperty]) => {
  //     if (selectedNode?.id) {
  //       void dispatch(
  //         addNodeAction({
  //           type: stage.type,
  //           modelData: {
  //             [entityPrimaryKeyProperty]: selectedNode.id,
  //           },
  //           attributeData: attributes,
  //         }),
  //       );
  //     }
  //   },
  //   [dispatch, stage.type, selectedNode?.id],
  // );

  const createNetworkNode = useCallback(
    (attributes: NcNode[EntityAttributesProperty]) => {
      if (!selectedNode) return;

      commitPlaceholderNode(selectedNode, {
        ...attributes,
        gender: selectedNode.gender,
        name: selectedNode.label,
        x: selectedNode.xPos,
        y: selectedNode.yPos,
      });

      setSelectedNode(null);
    },
    [commitPlaceholderNode, selectedNode],
  );

  const renderNodeForm = () => {
    const step3NameForm = stage.form;

    return (
      <div className="name-generator-interface">
        <FamilyTreeNodeForm
          selectedNode={selectedNode}
          form={step3NameForm}
          onClose={() => {
            setSelectedNode(null);
          }}
          addNode={(attrs) =>
            selectedNode && commitPlaceholderNode(selectedNode, attrs)
          }
        />
      </div>
    );
  };

  const renderFamilyTreeShells = () => {
    const step2CensusForm = {
      fields: [],
      title: 'Add Relative',
    };

    return (
      <div className="family-pedigree-interface">
        <CensusStep2Form
          selectedNode={null}
          form={step2CensusForm}
          disabled={false}
          onClose={function (): void {}}
          setPlaceholderNodes={setPlaceholderNodesBulk}
          egoNodeId={egoNodeId}
        />
        <div className="edge-layout">
          {positionedNodes.map((node) => {
            return (
              node.partnerId != null && (
                <UIPartnerConnector
                  key={crypto.randomUUID()}
                  xStartPos={(node.xPos ?? 0) + 10}
                  xEndPos={
                    (familyTreeNodesById[node.partnerId]?.xPos ?? 0) - 20
                  }
                  yPos={node.yPos}
                />
              )
            );
          })}
          {positionedNodes.map((node) => {
            return (
              node.partnerId != null &&
              (node.childIds?.length ?? 0) > 0 && (
                <UIOffspringConnector
                  key={crypto.randomUUID()}
                  xPos={
                    ((node.xPos ?? 0) +
                      (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                    2
                  }
                  yStartPos={node.yPos ?? 0}
                  yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30}
                />
              )
            );
          })}
          {positionedNodes.map((node) => {
            return (
              familyTreeNodesById[node.partnerId] != null &&
              familyTreeNodesById[node.partnerId] != null &&
              node.childIds.length > 0 &&
              node.childIds.map((child) => {
                const childNode = familyTreeNodesById[child];
                return (
                  <UIChildConnector
                    key={crypto.randomUUID()}
                    xStartPos={childNode.xPos ?? 0}
                    xEndPos={
                      ((node.xPos ?? 0) +
                        (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                      2
                    }
                    yPos={(childNode.yPos ?? 0) - rowHeight / 3 - 15}
                    height={rowHeight / 3 - 15}
                  />
                );
              })
            );
          })}
        </div>
        <div className="node-layout" ref={elementRef}>
          {positionedNodes.map((node) => {
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
          {positionedNodes.map((node) => {
            return (
              node.partnerId != null && (
                <UIPartnerConnector
                  key={`partner-${node.id}`}
                  xStartPos={(node.xPos ?? 0) + 10}
                  xEndPos={
                    (familyTreeNodesById[node.partnerId]?.xPos ?? 0) - 20
                  }
                  yPos={node.yPos}
                />
              )
            );
          })}
          {positionedNodes.map((node) => {
            return (
              node.partnerId != null &&
              (node.childIds?.length ?? 0) > 0 && (
                <UIOffspringConnector
                  key={`offspring-${node.id}`}
                  xPos={
                    ((node.xPos ?? 0) +
                      (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                    2
                  }
                  yStartPos={node.yPos ?? 0}
                  yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30}
                />
              )
            );
          })}
          {positionedNodes.map((node) => {
            return (
              node.partnerId != null &&
              (node.childIds?.length ?? 0) > 0 &&
              node.childIds.map((child) => {
                const childNode = familyTreeNodesById[child];
                return (
                  <UIChildConnector
                    key={crypto.randomUUID()}
                    xStartPos={childNode.xPos ?? 0}
                    xEndPos={
                      ((node.xPos ?? 0) +
                        (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                      2
                    }
                    yPos={(childNode.yPos ?? 0) - rowHeight / 3 - 15}
                    height={rowHeight / 3 - 15}
                  />
                );
              })
            );
          })}
        </div>
        <div className="node-layout" ref={elementRef}>
          <div className="inner-node-layout">
            {positionedNodes.map((node) => {
              if (node.networkNode) {
                return (
                  <FamilyTreeNodeNetworkBacked
                    key={node.id}
                    id={node.id}
                    gender={node.gender}
                    label={node.label}
                    xPos={node.xPos}
                    yPos={node.yPos}
                    networkNode={node.networkNode}
                    handleClick={(node) => setSelectedNode(node.networkNode)}
                  />
                );
              } else {
                return (
                  <FamilyTreeNode
                    key={crypto.randomUUID()}
                    id={node.id}
                    gender={node.gender}
                    label={node.label}
                    xPos={node.xPos}
                    yPos={node.yPos}
                    handleClick={(node) => setSelectedNode(node)}
                  />
                );
              }
            })}
          </div>
        </div>
        {selectedNode != null ? renderNodeForm() : null}
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
