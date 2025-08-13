import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
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
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import {
  getNodeTypeLabel,
  getPedigreeStageMetadata,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import { PlaceholderNodeProps } from './FamilyTreeNode';
import useFamilyTreeNodes from './useFamilyTreeNodes';

type NodeFormProps = {
  selectedNode: NcNode | null;
  form: TForm;
  disabled: boolean;
  onClose: () => void;
  addNode: (nodes: PlaceholderNodeProps[]) => void;
  egoNodeId: string;
};

const CensusStep2Form = (props: NodeFormProps) => {
  const { selectedNode, form, disabled, onClose, addNode, egoNodeId } = props;
  const {
    placeholderNodes,
    addPlaceholderNode,
    setPlaceholderNodesBulk,
    allNodes,
  } = useFamilyTreeNodes([]);

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);
  const currentFamilyNodes = useSelector(getPedigreeStageMetadata);

  const [show, setShow] = useState(false);
  const [relationValue, setRelationValue] = useState('');
  const [egoId, setEgoId] = useState<string>(egoNodeId);
  const [step2Nodes, setStep2Nodes] = useState(currentFamilyNodes);
  const formRef = useRef<HTMLFormElement>(null);

  const dispatch = useAppDispatch();

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => dispatch(updateNodeAction(payload)),
    [dispatch],
  );

  // TODO: conditionally render these depending on relations added.
  // i.e. cousins shouldn't be an option without adding aunt or uncles first
  const baseField = {
    fieldLabel: 'How is this person related to you?',
    options: [
      {
        label: 'Aunt',
        value: 'Aunt',
      },
      {
        label: 'Uncle',
        value: 'Uncle',
      },
      {
        label: 'Daughter',
        value: 'Daughter',
      },
      {
        label: 'Son',
        value: 'Son',
      },
      {
        label: 'Brother',
        value: 'Brother',
      },
      {
        label: 'Sister',
        value: 'Sister',
      },
      {
        label: 'Half Sister',
        value: 'Half Sister',
      },
      {
        label: 'Half Brother',
        value: 'Half Brother',
      },
      {
        label: '(First) Cousin',
        value: '(First) Cousin',
      },
      {
        label: 'Niece',
        value: 'Niece',
      },
      {
        label: 'Nephew',
        value: 'Nephew',
      },
      {
        label: 'Granddaughter',
        value: 'Granddaughter',
      },
      {
        label: 'Grandson',
        value: 'Grandson',
      },
    ],
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

  function getParents(subjectId: string, nodes) {
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
    let options: { label: string; value: string }[] = [];

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
    let options: { label: string; value: string }[] = [];

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
    let options: { label: string; value: string }[] = [];

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
    'Aunt': {
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
    'Uncle': {
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
    'Half Sister': {
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
    'Half Brother': {
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
    '(First) Cousin': {
      fieldLabel: 'Who is the parent of your first cousin?',
      options: firstCousinOptions,
      type: 'ordinal',
      variable: 'firstCousinRelation',
      Component: RadioGroup,
      validation: {},
    },
    'Niece': {
      fieldLabel: 'Who is the parent of your niece?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {},
    },
    'Nephew': {
      fieldLabel: 'Who is the parent of your nephew?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {},
    },
    'Granddaughter': {
      fieldLabel: 'Who is the parent of your granddaughter?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {},
    },
    'Grandson': {
      fieldLabel: 'Who is the parent of your granddaughter?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {},
    },
  };

  // const createNewPlaceholderNode(relative) = () => {
  //   switch (relative) {
  //     case 'Daughter':
  //       const newDaughter
  //   }
  // }

  const processedFields = [
    baseField,
    ...(relationValue && additionalFieldsMap[relationValue]
      ? [additionalFieldsMap[relationValue]]
      : []),
  ];

  const useFullScreenForms = false;

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      const fullData = { ...newNodeAttributes, ...value };

      const parentsObject = getParents(
        fullData.auntRelation as string,
        step2Nodes,
      );
      const parentsArray = Object.values(parentsObject).filter(Boolean);

      const newNode: PlaceholderNodeProps = {
        id: crypto.randomUUID(),
        gender: 'female',
        label: `aunt ${Math.random()}`,
        parentIds: parentsArray.map((p) => p.id),
        childIds: [],
        xPos: 0,
        yPos: 0,
      };

      const updatedParents = parentsArray.map((parent) => ({
        ...parent,
        childIds: parent.childIds
          ? [...parent.childIds, newNode.id]
          : [newNode.id],
      }));

      const updatedNodes = [...updatedParents, newNode];
      addNode(updatedNodes);

      setShow(false);
      onClose();
    },
    [newNodeAttributes, onClose, step2Nodes, addNode, setShow],
  );

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  // When a selected node is passed in, we are editing an existing node.
  // We need to show the form and populate it with the node's data.
  useEffect(() => {
    if (selectedNode) {
      setShow(true);
    }
  }, [selectedNode]);

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
