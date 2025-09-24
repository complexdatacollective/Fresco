import { type Stage } from '@codaco/protocol-validation';
import { type NcNode, type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import FamilyTreePlaceholderNodeList from '~/lib/interviewer/components/FamilyTreePlaceholderNodeList';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { getNetworkEgo } from '~/lib/interviewer/selectors/session';
import UIChildConnector from '~/lib/ui/components/FamilyTree/ChildConnector';
import UIExPartnerConnector from '~/lib/ui/components/FamilyTree/ExPartnerConnector';
import UIOffspringConnector from '~/lib/ui/components/FamilyTree/OffspringConnector';
import UIPartnerConnector from '~/lib/ui/components/FamilyTree/PartnerConnector';
// import NumberInput from '~/lib/ui/components/Fields/Number';
import NumberInput from '~/lib/form/components/fields/Number';
import Form from '~/lib/form/components/Form';
import { getNetworkNodes } from '~/lib/interviewer/selectors/session';
import { Scroller } from '~/lib/ui/components';
import Prompt from '~/lib/ui/components/Prompts/Prompt';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { updatePedigreeStageMetadata } from '../../../ducks/modules/session';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { useAppDispatch } from '../../../store';
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
const xOffset = 200;
const yOffset = 100;

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { getNavigationHelpers, registerBeforeNext, stage } = props;

  const networkEgo = useSelector(getNetworkEgo);
  const networkNodes = useSelector(getNetworkNodes);

  const {
    setPlaceholderNodesBulk,
    allNodes,
    commitPlaceholderNode,
    removePlaceholderNode,
  } = useFamilyTreeNodes(networkNodes, stage);

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
      siblings: 150,
      partners: 120,
      generations: 180,
    });

    return layout.nodes;
  }

  function positionedNodesWithOffsets(
    nodes: PlaceholderNodeProps[],
    xOffset: number,
    yOffset: number,
  ) {
    return nodes.map((n) => ({
      ...n,
      xPos: n.xPos + xOffset,
      yPos: n.yPos + yOffset,
    }));
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
    if (direction === 'forwards') {
      if (activeIndex === 1) {
        const nodesWithOffsets = positionedNodes.map((n) => ({
          ...n,
          xPos: n.xPos ?? 0,
          yPos: n.yPos ?? 0,
        }));
        setPlaceholderNodesBulk(nodesWithOffsets);
      }
      nextItem();
    } else if (direction === 'backwards') {
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
    formData: Record<string, number>,
    relation: string,
  ) => {
    if (typeof formData[relation] != 'number' || formData[relation] < 1) {
      return [];
    } else {
      return [...Array(formData[relation]).keys()];
    }
  };

  const egoChildCheck = (formData: Record<string, number>) => {
    const sons = formData.sons ? formData.sons : 0;
    const daughters = formData.daughters ? formData.daughters : 0;

    return sons > 0 || daughters > 0;
  };

  let keyCounter = 0;

  const generatePlaceholderNodes = (formData: Record<string, number>) => {
    // Use a temporary local array to accumulate nodes before setting
    const tempNodes: PlaceholderNodeProps[] = [];

    const createNode = (
      gender: string,
      label: string,
      isEgo: boolean,
    ): PlaceholderNodeProps => {
      return {
        id: crypto.randomUUID(),
        isEgo,
        gender,
        label,
        parentIds: [],
        childIds: [],
        xPos: undefined,
        yPos: undefined,
        unDeletable: false,
      };
    };

    // Helper to add node and push to tempNodes array
    const addNode = (gender: string, label: string, isEgo = false) => {
      const node = createNode(gender, label, isEgo);
      tempNodes.push(node);
      return node;
    };

    // Create family members
    const maternalGrandmother = addNode('female', 'maternal grandmother');
    const maternalGrandfather = addNode('male', 'maternal grandfather');
    maternalGrandfather.partnerId = maternalGrandmother.id;
    maternalGrandfather.unDeletable = true;
    maternalGrandmother.partnerId = maternalGrandfather.id;
    maternalGrandmother.unDeletable = true;

    const paternalGrandmother = addNode('female', 'paternal grandmother');
    const paternalGrandfather = addNode('male', 'paternal grandfather');
    paternalGrandfather.partnerId = paternalGrandmother.id;
    paternalGrandfather.unDeletable = true;
    paternalGrandmother.partnerId = paternalGrandfather.id;
    paternalGrandmother.unDeletable = true;

    const mother = addNode('female', 'mother');
    maternalGrandfather.childIds?.push(mother.id ?? '');
    maternalGrandmother.childIds?.push(mother.id ?? '');
    mother.parentIds?.push(
      maternalGrandfather.id ?? '',
      maternalGrandmother.id ?? '',
    );
    mother.unDeletable = true;

    const father = addNode('male', 'father');
    father.partnerId = mother.id;
    mother.partnerId = father.id;
    paternalGrandfather.childIds?.push(father.id ?? '');
    paternalGrandmother.childIds?.push(father.id ?? '');
    father.parentIds?.push(
      paternalGrandfather.id ?? '',
      paternalGrandmother.id ?? '',
    );
    father.unDeletable = true;

    const ego: PlaceholderNodeProps = {
      id: networkEgo?._uid! || crypto.randomUUID(),
      isEgo: true,
      gender: 'female',
      label: (networkEgo?.attributes.name as string) ?? 'self',
      parentIds: [],
      childIds: [],
      xPos: undefined,
      yPos: undefined,
      unDeletable: true,
      networkNode: {
        _uid: networkEgo?._uid!,
        type: stage.subject.type,
        attributes: networkEgo?.attributes,
        promptIDs: [],
        stageId: stage.id,
      },
    };
    tempNodes.push(ego);
    setEgoNodeId(ego.id);
    father.childIds?.push(ego.id ?? '');
    mother.childIds?.push(ego.id ?? '');
    ego.parentIds?.push(father.id ?? '', mother.id ?? '');

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

    if (egoChildCheck(formData)) {
      const partner = addNode('male', `${ego.label}'s partner`);
      ego.partnerId = partner.id;
      partner.partnerId = ego.id;

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
    }

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
    const treeLayout = new FamilyTreeLayout(tempNodes, {
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

  const numberValidation = {
    onChange: ({ value }) => {
      if (value === '' || value == null) return undefined;
      if (value < 0) return 'Number must be 0 or greater';

      return undefined;
    },
  };

  const renderCensusForm = () => {
    const step1CensusForm = {
      fields: [
        {
          variable: 'brothers',
          label: 'How many brothers do you have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'sisters',
          label: 'How many sisters do you have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'sons',
          label: 'How many sons do you have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'daughters',
          label: 'How many daughters do you have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'maternal-uncles',
          label: 'How many brothers does your mother have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'maternal-aunts',
          label: 'How many sisters does your mother have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'paternal-uncles',
          label: 'How many brothers does your father have?',
          Component: NumberInput,
          validation: numberValidation,
        },
        {
          variable: 'paternal-aunts',
          label: 'How many sisters does your father have?',
          Component: NumberInput,
          validation: numberValidation,
        },
      ],
    };

    const handleSubmitCensusForm = (data: {
      value: Record<string, VariableValue>;
    }) => {
      const formData = data.value;

      moveForward();
      generatePlaceholderNodes(formData);
    };

    return (
      <div className="interface ego-form alter-form family-pedigree-interface">
        <Prompt text="This is the first step" />
        <div className="ego-form__form-container">
          <Form
            {...step1CensusForm}
            id="family-member-count-form"
            handleSubmit={handleSubmitCensusForm}
          />
        </div>
      </div>
    );
  };

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

  const nodeMaxX = Math.max(
    ...positionedNodes.map((n) => (n.xPos ?? 0) + 100),
    850,
  );

  const edgeMaxX = Math.max(
    ...positionedNodes.flatMap((node) => {
      const partnerX = familyTreeNodesById[node.partnerId]?.xPos ?? 0;
      const exPartnerX = familyTreeNodesById[node.exPartnerId]?.xPos ?? 0;
      const childrenX = node.childIds.map(
        (id) => familyTreeNodesById[id]?.xPos ?? 0,
      );

      return [partnerX, exPartnerX, ...childrenX];
    }),
  );

  const canvasWidth = Math.max(nodeMaxX, edgeMaxX + 300);

  const canvasHeight = Math.max(
    ...positionedNodes.map((n) => (n.yPos ?? 0) + 200),
    200,
  );

  const renderFamilyTreeShells = () => {
    const step2CensusForm = {
      fields: [],
      title: 'Add Relative',
    };

    return (
      <div className="family-pedigree-interface">
        <Prompt text="This is the second step" />
        <CensusStep2Form
          selectedNode={null}
          form={step2CensusForm}
          disabled={false}
          onClose={function (): void {}}
          setPlaceholderNodes={setPlaceholderNodesBulk}
          egoNodeId={egoNodeId}
        />
        <Scroller className="family-tree-census-scroller">
          <div
            className="census-node-canvas"
            style={{
              position: 'relative',
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            <div className="edge-layout">
              {positionedNodes.map((node) => {
                return (
                  node.partnerId != null && (
                    <UIPartnerConnector
                      key={keyCounter++}
                      xStartPos={(node.xPos ?? 0) + 10 + xOffset}
                      xEndPos={
                        (familyTreeNodesById[node.partnerId]?.xPos ?? 0) -
                        20 +
                        xOffset
                      }
                      yPos={node.yPos + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  node.exPartnerId != null && (
                    <UIExPartnerConnector
                      key={keyCounter++}
                      xStartPos={(node.xPos ?? 0) + 10 + xOffset}
                      xEndPos={
                        (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0) -
                        20 +
                        xOffset
                      }
                      yPos={node.yPos + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  node.partnerId != null &&
                  (node.childIds?.length ?? 0) > 0 && (
                    <UIOffspringConnector
                      key={keyCounter++}
                      xPos={
                        ((node.xPos ?? 0) +
                          (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                          2 +
                        xOffset
                      }
                      yStartPos={(node.yPos ?? 0) + yOffset}
                      yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30 + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  node.exPartnerId != null &&
                  (node.childIds?.length ?? 0) > 0 && (
                    <UIOffspringConnector
                      key={keyCounter++}
                      xPos={
                        ((node.xPos ?? 0) +
                          (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0)) /
                          2 +
                        xOffset
                      }
                      yStartPos={(node.yPos ?? 0) - 5 + yOffset}
                      yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30 + yOffset}
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
                        key={keyCounter++}
                        xStartPos={(childNode.xPos ?? 0) + xOffset}
                        xEndPos={
                          ((node.xPos ?? 0) +
                            (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                            2 +
                          xOffset
                        }
                        yPos={
                          (childNode.yPos ?? 0) - rowHeight / 3 - 15 + yOffset
                        }
                        height={rowHeight / 3 - 15}
                      />
                    );
                  })
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  familyTreeNodesById[node.exPartnerId] != null &&
                  familyTreeNodesById[node.exPartnerId] != null &&
                  node.childIds.length > 0 &&
                  node.childIds.map((child) => {
                    const childNode = familyTreeNodesById[child];
                    return (
                      <UIChildConnector
                        key={keyCounter++}
                        xStartPos={(childNode.xPos ?? 0) + xOffset}
                        xEndPos={
                          ((node.xPos ?? 0) +
                            (familyTreeNodesById[node.exPartnerId]?.xPos ??
                              0)) /
                            2 +
                          xOffset
                        }
                        yPos={
                          (childNode.yPos ?? 0) - rowHeight / 3 - 15 + yOffset
                        }
                        height={rowHeight / 3 - 15}
                      />
                    );
                  })
                );
              })}
            </div>
            <div className="node-layout" ref={elementRef}>
              <div className="inner-node-layout">
                <FamilyTreePlaceholderNodeList
                  items={positionedNodesWithOffsets(
                    positionedNodes,
                    xOffset,
                    yOffset,
                  )}
                  listId={`${stage.id}_MAIN_NODE_LIST`}
                  id="MAIN_NODE_LIST"
                  accepts={({ meta }: { meta: { itemType: string | null } }) =>
                    get(meta, 'itemType', null) === 'PLACEHOLDER_NODE'
                  }
                  itemType="PLACEHOLDER_NODE"
                  onDrop={() => {}}
                  onItemClick={() => {}}
                />
              </div>
            </div>
          </div>
        </Scroller>
        <NodeBin
          accepts={(node: PlaceholderNodeProps & { itemType: string }) =>
            node.itemType === 'PLACEHOLDER_NODE'
          }
          dropHandler={(meta: PlaceholderNodeProps) =>
            removePlaceholderNode(meta.id)
          }
        />
      </div>
    );
  };

  const renderFamilyTreeCompletion = () => {
    return (
      <div className="family-pedigree-interface">
        <Prompt text="This is the third step" />
        <Scroller className="family-tree-census-scroller">
          <div
            className="census-node-canvas"
            style={{
              position: 'relative',
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            <div className="edge-layout">
              {positionedNodes.map((node) => {
                return (
                  node.partnerId != null && (
                    <UIPartnerConnector
                      key={keyCounter++}
                      xStartPos={(node.xPos ?? 0) + 10 + xOffset}
                      xEndPos={
                        (familyTreeNodesById[node.partnerId]?.xPos ?? 0) -
                        20 +
                        xOffset
                      }
                      yPos={node.yPos + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  node.exPartnerId != null && (
                    <UIExPartnerConnector
                      key={keyCounter++}
                      xStartPos={(node.xPos ?? 0) + 10 + xOffset}
                      xEndPos={
                        (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0) -
                        20 +
                        xOffset
                      }
                      yPos={node.yPos + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  node.partnerId != null &&
                  (node.childIds?.length ?? 0) > 0 && (
                    <UIOffspringConnector
                      key={keyCounter++}
                      xPos={
                        ((node.xPos ?? 0) +
                          (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                          2 +
                        xOffset
                      }
                      yStartPos={(node.yPos ?? 0) + yOffset}
                      yEndPos={(node.yPos ?? 0) + rowHeight / 3 + 30 + yOffset}
                    />
                  )
                );
              })}
              {positionedNodes.map((node) => {
                return (
                  (node.partnerId != null || node.exPartnerId != null) &&
                  (node.childIds?.length ?? 0) > 0 &&
                  node.childIds.map((child) => {
                    const childNode = familyTreeNodesById[child];
                    return (
                      <UIChildConnector
                        key={keyCounter++}
                        xStartPos={(childNode.xPos ?? 0) + xOffset}
                        xEndPos={
                          ((node.xPos ?? 0) +
                            (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                            2 +
                          xOffset
                        }
                        yPos={
                          (childNode.yPos ?? 0) - rowHeight / 3 - 15 + yOffset
                        }
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
                        key={keyCounter++}
                        id={node.id}
                        isEgo={node.isEgo || false}
                        gender={node.gender}
                        label={node.label}
                        xPos={node.xPos + xOffset}
                        yPos={node.yPos + yOffset}
                        yOffset={yOffset}
                        parentIds={node.parentIds}
                        childIds={node.childIds}
                        networkNode={node.networkNode}
                        handleClick={
                          node.isEgo
                            ? () => {}
                            : (node) => setSelectedNode(node.networkNode)
                        }
                      />
                    );
                  } else {
                    return (
                      <FamilyTreeNode
                        key={keyCounter++}
                        id={node.id}
                        isEgo={node.isEgo || false}
                        gender={node.gender}
                        parentIds={node.parentIds}
                        label={node.label}
                        xPos={node.xPos + xOffset}
                        yPos={node.yPos + yOffset}
                        handleClick={(node) => setSelectedNode(node)}
                      />
                    );
                  }
                })}
              </div>
            </div>
          </div>
        </Scroller>
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

  return <>{renderActiveStep()}</>;
};

export default withNoSSRWrapper(FamilyTreeCensus);
