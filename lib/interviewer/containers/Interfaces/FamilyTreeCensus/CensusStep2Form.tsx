import { type Form as TForm } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import Form from '~/lib/form/components/Form';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '~/lib/interviewer/containers/Interfaces/utils/constants';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import {
  getNodeTypeLabel,
  getPedigreeStageMetadata,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import type { PlaceholderNodeProps } from './FamilyTreeNode';

type NodeFormProps = {
  selectedNode: NcNode | null;
  form: TForm;
  disabled: boolean;
  onClose: () => void;
  setPlaceholderNodes: (nodes: PlaceholderNodeProps[]) => void;
  egoNodeId: string;
};

const CensusStep2Form = (props: NodeFormProps) => {
  const {
    selectedNode,
    form,
    disabled,
    onClose,
    setPlaceholderNodes,
    egoNodeId,
  } = props;

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);
  const step2Nodes = useSelector(getPedigreeStageMetadata);

  const [show, setShow] = useState(false);
  const [relationValue, setRelationValue] = useState('');
  const [egoId, setEgoId] = useState<string>(egoNodeId);
  const formRef = useRef<HTMLFormElement>(null);

  function getExPartnerForParent(
    allNodes: PlaceholderNodeProps[],
    parentNode: PlaceholderNodeProps,
  ) {
    return allNodes.find((n) => n.id === parentNode.exPartnerId);
  }

  const baseField = {
    fieldLabel: 'How is this person related to you?',
    options: [],
    type: 'ordinal',
    variable: 'relation',
    Component: (props) => (
      <RadioGroup
        {...props}
        onChange={(val) => {
          setRelationValue(val);
        }}
      />
    ),
    validation: {},
  };

  const hasAuntOrUncle = step2Nodes.some((node) =>
    /aunt|uncle/i.test(node.label),
  );
  const hasSiblings = step2Nodes.some((node) =>
    /brother|sister/i.test(node.label),
  );
  const hasChildren = step2Nodes.some((node) =>
    ['son', 'daughter'].includes(node.label),
  );

  const dynamicBaseField = {
    ...baseField,
    options: [
      { label: 'Aunt', value: 'aunt' },
      { label: 'Uncle', value: 'uncle' },
      { label: 'Daughter', value: 'daughter' },
      { label: 'Son', value: 'son' },
      { label: 'Brother', value: 'brother' },
      { label: 'Sister', value: 'sister' },
      { label: 'Half Sister', value: 'halfSister' },
      { label: 'Half Brother', value: 'halfBrother' },
      ...(hasAuntOrUncle
        ? [
            { label: 'First Cousin (Male)', value: 'firstCousinMale' },
            { label: 'First Cousin (Female)', value: 'firstCousinFemale' },
          ]
        : []),
      ...(hasSiblings
        ? [
            { label: 'Niece', value: 'niece' },
            { label: 'Nephew', value: 'nephew' },
          ]
        : []),
      ...(hasChildren
        ? [
            { label: 'Granddaughter', value: 'granddaughter' },
            { label: 'Grandson', value: 'grandson' },
          ]
        : []),
    ],
  };

  function getParents(subjectId: string, nodes: PlaceholderNodeProps[]) {
    const ego = nodes.find((node) => node.id === subjectId);
    if (!ego) return { mother: null, father: null };

    const parentIds = ego.parentIds || [];

    let mother: PlaceholderNodeProps | null = null;
    let father: PlaceholderNodeProps | null = null;

    parentIds.forEach((parentId) => {
      const parent = nodes.find((node) => node.id === parentId);
      if (!parent) return;

      if (parent.gender.toLowerCase() === 'female') {
        mother = parent;
      } else if (parent.gender.toLowerCase() === 'male') {
        father = parent;
      }
    });

    return { mother, father };
  }

  function getSiblings(subjectId: string, nodes: PlaceholderNodeProps[]) {
    const subject = nodes.find((node) => node.id === subjectId);
    if (!subject) return [];

    const parentIds = subject.parentIds || [];
    if (parentIds.length === 0) return [];

    const siblings = nodes.filter(
      (node) =>
        node.id !== subjectId &&
        node.parentIds?.some((pid) => parentIds.includes(pid)),
    );

    siblings.sort((a, b) => a.xPos - b.xPos);

    return siblings;
  }

  function getChildren(parentId: string, nodes: PlaceholderNodeProps[]) {
    return nodes.filter((node) => node.parentIds?.includes(parentId));
  }

  const { mother, father } = useMemo(
    () => getParents(egoId, step2Nodes),
    [egoId, step2Nodes],
  );

  const maternalSiblings = useMemo(
    () => (mother ? getSiblings(mother.id, step2Nodes) : []),
    [mother, step2Nodes],
  );

  const paternalSiblings = useMemo(
    () => (father ? getSiblings(father.id, step2Nodes) : []),
    [father, step2Nodes],
  );

  const firstCousinOptions = useMemo(() => {
    let maternalAuntCount = 0;
    let maternalUncleCount = 0;
    let paternalAuntCount = 0;
    let paternalUncleCount = 0;
    const options: { label: string; value: string }[] = [];

    maternalSiblings.forEach((sibling) => {
      if (sibling.gender.toLowerCase() === 'female') {
        maternalAuntCount++;
        options.push({
          label: `Maternal Aunt ${maternalAuntCount}`,
          value: sibling.id,
        });
      } else {
        maternalUncleCount++;
        options.push({
          label: `Maternal Uncle ${maternalUncleCount}`,
          value: sibling.id,
        });
      }
    });

    paternalSiblings.forEach((sibling) => {
      if (sibling.gender.toLowerCase() === 'female') {
        paternalAuntCount++;
        options.push({
          label: `Paternal Aunt ${paternalAuntCount}`,
          value: sibling.id,
        });
      } else {
        paternalUncleCount++;
        options.push({
          label: `Paternal Uncle ${paternalUncleCount}`,
          value: sibling.id,
        });
      }
    });

    return options;
  }, [maternalSiblings, paternalSiblings]);

  const egoSiblings = useMemo(
    () => getSiblings(egoId, step2Nodes),
    [egoId, step2Nodes],
  );

  const nieceOptions = useMemo(() => {
    let sisterCount = 0;
    let brotherCount = 0;
    const options: { label: string; value: string }[] = [];

    egoSiblings.forEach((sibling) => {
      if (sibling.gender.toLowerCase() === 'female') {
        sisterCount++;
        options.push({
          label: `Sister ${sisterCount}`,
          value: sibling.id,
        });
      } else {
        brotherCount++;
        options.push({
          label: `Brother ${brotherCount}`,
          value: sibling.id,
        });
      }
    });

    return options;
  }, [egoSiblings]);

  const egoChildren = useMemo(
    () => getChildren(egoId, step2Nodes),
    [egoId, step2Nodes],
  );

  const grandchildrenOptions = useMemo(() => {
    let daughterCount = 0;
    let sonCount = 0;
    const options: { label: string; value: string }[] = [];

    egoChildren.forEach((child) => {
      if (child.gender.toLowerCase() === 'female') {
        daughterCount++;
        options.push({
          label: `Daughter ${daughterCount}`,
          value: child.id,
        });
      } else {
        sonCount++;
        options.push({
          label: `Son ${sonCount}`,
          value: child.id,
        });
      }
    });

    return options;
  }, [egoChildren]);

  // Daughter, Son, Brother, and Sister all automatically add node to ego/create spouse if needed.
  const additionalFieldsMap = {
    aunt: {
      fieldLabel: 'Whos is the aunt related to?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'auntRelation',
      Component: RadioGroup,
      validation: {},
    },
    uncle: {
      fieldLabel: 'Whos is the uncle related to?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'uncleRelation',
      Component: RadioGroup,
      validation: {},
    },
    halfSister: {
      fieldLabel: 'Who is the parent of your half sister?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'halfSisterRelation',
      Component: RadioGroup,
      validation: {},
    },
    halfBrother: {
      fieldLabel: 'Who is the parent of your half brother?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'halfBrotherRelation',
      Component: RadioGroup,
      validation: {},
    },
    firstCousinMale: {
      fieldLabel: 'Who is the parent of your first cousin?',
      options: firstCousinOptions,
      type: 'ordinal',
      variable: 'firstCousinMaleRelation',
      Component: RadioGroup,
      validation: {},
    },
    firstCousinFemale: {
      fieldLabel: 'Who is the parent of your first cousin?',
      options: firstCousinOptions,
      type: 'ordinal',
      variable: 'firstCousinFemaleRelation',
      Component: RadioGroup,
      validation: {},
    },
    niece: {
      fieldLabel: 'Who is the parent of your niece?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {},
    },
    nephew: {
      fieldLabel: 'Who is the parent of your nephew?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nephewRelation',
      Component: RadioGroup,
      validation: {},
    },
    granddaughter: {
      fieldLabel: 'Who is the parent of your granddaughter?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'granddaughterRelation',
      Component: RadioGroup,
      validation: {},
    },
    grandson: {
      fieldLabel: 'Who is the parent of your granddaughter?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'grandsonRelation',
      Component: RadioGroup,
      validation: {},
    },
  };

  // resets the additional fields from the previous relative selection
  useEffect(() => {
    if (!show) {
      setRelationValue('');
    }
  }, [show]);

  const processedFields = [
    dynamicBaseField,
    ...(relationValue && additionalFieldsMap[relationValue]
      ? [{ ...additionalFieldsMap[relationValue], _uniqueKey: Date.now() }]
      : []),
  ];

  const useFullScreenForms = false;

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      const cleanedData = Object.fromEntries(
        Object.entries(value).filter(([_, v]) => v !== '' && v != null),
      );
      const fullData = { ...newNodeAttributes, ...cleanedData };

      let parentsArray: PlaceholderNodeProps[] = [];
      let newNode: PlaceholderNodeProps;
      let newNodeParentIds: string[] = [];

      switch (fullData.relation) {
        case 'aunt':
        case 'uncle': {
          const parentsObject = getParents(
            fullData[`${fullData.relation}Relation`] as string,
            step2Nodes,
          );
          parentsArray = Object.values(parentsObject).filter(Boolean);
          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'aunt' ? 'female' : 'male',
            label: fullData.relation,
            parentIds: parentsArray.map((p) => p.id),
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };
          break;
        }

        case 'brother':
        case 'sister': {
          const egoNode = step2Nodes.find((n) => n.id === egoNodeId);
          if (!egoNode) break;

          parentsArray = step2Nodes.filter((n) =>
            egoNode.parentIds.includes(n.id),
          );

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'sister' ? 'female' : 'male',
            label: fullData.relation,
            parentIds: parentsArray.map((p) => p.id),
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };
          break;
        }

        case 'son':
        case 'daughter': {
          const egoNode = step2Nodes.find((n) => n.id === egoNodeId);
          if (!egoNode) break;

          let parentsArray: PlaceholderNodeProps[] = [egoNode];
          let newNodeParentIds: string[] = [egoNode.id];

          let updatedEgo: PlaceholderNodeProps = egoNode;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!egoNode.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: egoNode.gender === 'male' ? 'female' : 'male',
              label: `${egoNode.label}'s partner`,
              parentIds: [],
              childIds: [...(egoNode.childIds || [])],
              partnerId: egoNode.id,
              xPos: 0,
              yPos: 0,
            };

            updatedEgo = { ...egoNode, partnerId };
            parentsArray = [updatedEgo, partnerNode];
            newNodeParentIds = [updatedEgo.id, partnerId];
          } else {
            partnerNode = step2Nodes?.find((n) => n.id === egoNode.partnerId);

            if (partnerNode) {
              parentsArray = [egoNode, partnerNode];
              newNodeParentIds = [egoNode.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'son' ? 'male' : 'female',
            label: fullData.relation.toLowerCase(),
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };

          const updatedEgoWithChildren: PlaceholderNodeProps = {
            ...updatedEgo,
            childIds: [...(updatedEgo.childIds || []), newNode.id],
          };

          const updatedPartnerWithChildren: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds || []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedEgoWithChildren,
            ...(updatedPartnerWithChildren ? [updatedPartnerWithChildren] : []),
            newNode,
          ]);

          break;
        }

        case 'halfBrother':
        case 'halfSister': {
          const selectedRelative = step2Nodes.find(
            (n) => n.id === fullData[`${fullData.relation}Relation`],
          );

          if (!selectedRelative) break;

          let parentsArray: PlaceholderNodeProps[] = [selectedRelative];
          let newNodeParentIds: string[] = [selectedRelative.id];
          let partnerNode: PlaceholderNodeProps;

          const exPartner = getExPartnerForParent(step2Nodes, selectedRelative);

          if (exPartner) {
            partnerNode = exPartner;
            parentsArray = [selectedRelative, partnerNode];
            newNodeParentIds = [selectedRelative.id, partnerNode.id];
          } else {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedRelative.gender === 'male' ? 'female' : 'male',
              label: `${selectedRelative.label}'s ex partner`,
              parentIds: [],
              childIds: [],
              xPos: undefined,
              yPos: undefined,
            };

            parentsArray = [selectedRelative, partnerNode];
            newNodeParentIds = [selectedRelative.id, partnerId];
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'halfBrother' ? 'male' : 'female',
            label:
              fullData.relation === 'halfBrother'
                ? 'half brother'
                : 'half sister',
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };

          const updatedRelativeWithHalfSibling: PlaceholderNodeProps = {
            ...selectedRelative,
            exPartnerId: partnerNode.id,
            childIds: [...(selectedRelative.childIds || []), newNode.id],
          };

          const updatedPartnerWithHalfSibling: PlaceholderNodeProps = {
            ...partnerNode,
            exPartnerId: selectedRelative.id,
            childIds: [...(partnerNode.childIds || []), newNode.id],
          };

          setPlaceholderNodes([
            updatedRelativeWithHalfSibling,
            updatedPartnerWithHalfSibling,
            newNode,
          ]);

          break;
        }

        case 'firstCousinMale':
        case 'firstCousinFemale': {
          const selectedRelative = step2Nodes.find(
            (n) => n.id === fullData[`${fullData.relation}Relation`],
          );

          if (!selectedRelative) break;

          let parentsArray: PlaceholderNodeProps[] = [selectedRelative];
          let newNodeParentIds: string[] = [selectedRelative.id];

          let updatedSelectedRelative: PlaceholderNodeProps = selectedRelative;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!selectedRelative.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedRelative.gender === 'male' ? 'female' : 'male',
              label: `${selectedRelative.label}'s spouse`,
              parentIds: [],
              childIds: [...(selectedRelative.childIds || [])],
              partnerId: selectedRelative.id,
              xPos: undefined,
              yPos: undefined,
            };

            updatedSelectedRelative = { ...selectedRelative, partnerId };
            parentsArray = [updatedSelectedRelative, partnerNode];
            newNodeParentIds = [updatedSelectedRelative.id, partnerId];
          } else {
            partnerNode = step2Nodes.find(
              (n) => n.id === selectedRelative.partnerId,
            );
            if (partnerNode) {
              parentsArray = [selectedRelative, partnerNode];
              newNodeParentIds = [selectedRelative.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'firstCousinMale' ? 'male' : 'female',
            label: 'cousin',
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };

          const updatedRelativeWithCousin: PlaceholderNodeProps = {
            ...updatedSelectedRelative,
            childIds: [...(updatedSelectedRelative.childIds || []), newNode.id],
          };

          const updatedPartnerWithCousin: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds || []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedRelativeWithCousin,
            ...(updatedPartnerWithCousin ? [updatedPartnerWithCousin] : []),
            newNode,
          ]);

          break;
        }

        case 'niece':
        case 'nephew': {
          const selectedRelative = step2Nodes.find(
            (n) => n.id === fullData[`${fullData.relation}Relation`],
          );

          if (!selectedRelative) break;

          let parentsArray: PlaceholderNodeProps[] = [selectedRelative];
          let newNodeParentIds: string[] = [selectedRelative.id];

          let updatedSelectedRelative: PlaceholderNodeProps = selectedRelative;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!selectedRelative.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedRelative.gender === 'male' ? 'female' : 'male',
              label: `${selectedRelative.label}'s spouse`,
              parentIds: [],
              childIds: [...(selectedRelative.childIds || [])],
              partnerId: selectedRelative.id,
              xPos: undefined,
              yPos: undefined,
            };

            updatedSelectedRelative = { ...selectedRelative, partnerId };
            parentsArray = [updatedSelectedRelative, partnerNode];
            newNodeParentIds = [updatedSelectedRelative.id, partnerId];
          } else {
            partnerNode = step2Nodes.find(
              (n) => n.id === selectedRelative.partnerId,
            );
            if (partnerNode) {
              parentsArray = [selectedRelative, partnerNode];
              newNodeParentIds = [selectedRelative.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'niece' ? 'female' : 'male',
            label: fullData.relation,
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };

          const updatedRelativeWithChild: PlaceholderNodeProps = {
            ...updatedSelectedRelative,
            childIds: [...(updatedSelectedRelative.childIds || []), newNode.id],
          };

          const updatedPartnerWithChild: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds || []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedRelativeWithChild,
            ...(updatedPartnerWithChild ? [updatedPartnerWithChild] : []),
            newNode,
          ]);

          break;
        }

        case 'granddaughter':
        case 'grandson': {
          const selectedChild = step2Nodes.find(
            (n) => n.id === fullData[`${fullData.relation}Relation`],
          );
          if (!selectedChild) break;

          let parentsArray: PlaceholderNodeProps[] = [selectedChild];
          let newNodeParentIds: string[] = [selectedChild.id];

          let updatedSelectedChild: PlaceholderNodeProps = selectedChild;
          let partnerNode: PlaceholderNodeProps | undefined;

          if (!selectedChild.partnerId) {
            const partnerId = crypto.randomUUID();
            partnerNode = {
              id: partnerId,
              gender: selectedChild.gender === 'male' ? 'female' : 'male',
              label: `${selectedChild.label}'s spouse`,
              parentIds: [],
              childIds: [...(selectedChild.childIds || [])],
              partnerId: selectedChild.id,
              xPos: undefined,
              yPos: undefined,
            };

            updatedSelectedChild = { ...selectedChild, partnerId };
            parentsArray = [updatedSelectedChild, partnerNode];
            newNodeParentIds = [updatedSelectedChild.id, partnerId];
          } else {
            partnerNode = step2Nodes.find(
              (n) => n.id === selectedChild.partnerId,
            );
            if (partnerNode) {
              parentsArray = [selectedChild, partnerNode];
              newNodeParentIds = [selectedChild.id, partnerNode.id];
            }
          }

          newNode = {
            id: crypto.randomUUID(),
            gender: fullData.relation === 'granddaughter' ? 'female' : 'male',
            label: fullData.relation,
            parentIds: newNodeParentIds,
            childIds: [],
            xPos: undefined,
            yPos: undefined,
          };

          const updatedChildWithGrandchild: PlaceholderNodeProps = {
            ...updatedSelectedChild,
            childIds: [...(updatedSelectedChild.childIds || []), newNode.id],
          };

          const updatedPartnerWithGrandchild: PlaceholderNodeProps | undefined =
            partnerNode
              ? {
                  ...partnerNode,
                  childIds: [...(partnerNode.childIds || []), newNode.id],
                }
              : undefined;

          setPlaceholderNodes([
            updatedChildWithGrandchild,
            ...(updatedPartnerWithGrandchild
              ? [updatedPartnerWithGrandchild]
              : []),
            newNode,
          ]);

          break;
        }

        default:
          console.warn('Unhandled relation type', fullData.relation);
          return;
      }

      const updatedParents = parentsArray.map((parent) => ({
        ...parent,
        childIds: [...(parent.childIds || []), newNode.id],
      }));

      setPlaceholderNodes([...updatedParents, newNode]);
      setShow(false);
      onClose();
    },
    [newNodeAttributes, onClose, step2Nodes, setPlaceholderNodes, setShow],
  );

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  const handleClose = useCallback(() => {
    setShow(false);
    onClose();
  }, [onClose]);

  const variants = {
    initial: { opacity: 0, y: '100%' },
    animate: {
      opacity: 1,
      y: '0rem',
      transition: { delay: FIRST_LOAD_UI_ELEMENT_DELAY },
    },
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="name-generator-interface__add-button"
          variants={variants}
        >
          <ActionButton
            disabled={disabled}
            onClick={() => setShow(true)}
            icon={icon}
            title={`Add ${nodeType}...`}
          />
        </motion.div>
      </AnimatePresence>
      <Overlay
        show={show}
        title={form.title}
        onClose={handleClose}
        className="node-form"
        forceEnableFullscreen={useFullScreenForms}
        footer={
          !useFullScreenForms && (
            <Button
              key="submit"
              aria-label="Submit"
              onClick={() => {
                formRef.current?.requestSubmit();
              }}
            >
              Finished
            </Button>
          )
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            ref={formRef}
            fields={processedFields}
            handleSubmit={handleSubmit}
            getInitialValues={getInitialValues}
            focusFirstInput={true}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default CensusStep2Form;
