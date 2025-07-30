import { type Stage } from '@codaco/protocol-validation';
import { useCallback, useState } from 'react';
import UINode from '~/lib/ui/components/FamilyTree/FamilyTreeNode';
import UIOffspringConnector from '~/lib/ui/components/FamilyTree/OffspringConnector';
import UIPartnerConnector from '~/lib/ui/components/FamilyTree/PartnerConnector';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import Form from '../Form';
import { type StageProps } from '../Stage';

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const xEgoOffset = 300;
const yParentOffset = 100;
const yGap = 100;
const egoGender = 'female';

const genderColors: Record<string, string> = {
  'male': "primary-color-seq-1",
  'female': "primary-color-seq-2",
}; const genderShapes: Record<string, string> = {
  'male': 'circle',
  'female': 'triangle',
};

type PlaceholderNodeProps = {
  id?: string,
  gender: string,
  label: string,
  xPos: number,
  yPos: number,
  handleClick?: (id: string) => void,
};
const FamilyTreeNode = (props: PlaceholderNodeProps) => {
  const {
    id = crypto.randomUUID(),
    gender,
    label,
    xPos,
    yPos,
    handleClick = () => undefined,
  } = props;

  return <UINode
    key={`${xPos}-${yPos}`}
    color={genderColors[gender]}
    label={label}
    shape={genderShapes[gender]}
    xPos={xPos}
    yPos={yPos}
    handleClick={() => handleClick(id)}
  />
}

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const {
    getNavigationHelpers,
    registerBeforeNext,
  } = props;
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
    if (direction == "forwards") {
      nextItem();
    } else if (direction == "backwards") {
      previousItem();
    }
    return false;
  };
  registerBeforeNext(beforeNext);

  const [familyTreeNodes, setFamilyTreeNodes] = useState<(PlaceholderNodeProps)[]>([]);
  const addFamilyTreeNode = (newNode: PlaceholderNodeProps) => {
    setFamilyTreeNodes(oldNodes => [...oldNodes, newNode])
  };
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // return either an empty array or an array of integers from 1 to the number of relations
  const arrayFromRelationCount = (formData: Record<string, string>, relation: string) => {
    if (typeof formData[relation] != "string") {
      return [];
    } else {
      return [...Array(parseInt(formData[relation])).keys()];
    }
  }

  const generatePlaceholderNodes = (formData: Record<string, string>) => {
    addFamilyTreeNode({
      gender: "male",
      label: "father",
      xPos: xEgoOffset - 50,
      yPos: yParentOffset,
      handleClick: setSelectedNode
    });
    addFamilyTreeNode({
      gender: "female",
      label: "mother",
      xPos: xEgoOffset + 50,
      yPos: yParentOffset,
      handleClick: setSelectedNode
    });
    addFamilyTreeNode({
      gender: egoGender,
      label: "self",
      xPos: xEgoOffset,
      yPos: yParentOffset + yGap,
      handleClick: setSelectedNode
    });
    arrayFromRelationCount(formData, 'brothers').forEach(i => {
      addFamilyTreeNode({
        gender: "male",
        label: "brother",
        xPos: xEgoOffset + 100 * (i + 1),
        yPos: yParentOffset + yGap,
        handleClick: setSelectedNode
      });
    });
    arrayFromRelationCount(formData, 'sisters').forEach(i => {
      addFamilyTreeNode({
        gender: "female",
        label: "sister",
        xPos: xEgoOffset + arrayFromRelationCount(formData, 'brothers').length * 100 + 100 * (i + 1),
        yPos: yParentOffset + yGap,
        handleClick: setSelectedNode
      });
    });
    arrayFromRelationCount(formData, 'sons').forEach(i => {
      addFamilyTreeNode({
        gender: "male",
        label: "son",
        xPos: xEgoOffset + 100 * (i + 1),
        yPos: yParentOffset + 2 * yGap,
        handleClick: setSelectedNode
      });
    });
    arrayFromRelationCount(formData, 'daughters').forEach(i => {
      addFamilyTreeNode({
        gender: "female",
        label: "daughter",
        xPos: xEgoOffset + arrayFromRelationCount(formData, 'sons').length * 100 + 100 * (i + 1),
        yPos: yParentOffset + 2 * yGap,
        handleClick: setSelectedNode
      });
    });
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
      fields: [
        { variable: 'name', prompt: 'What is this person\'s name?' },
      ],
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
          <UIPartnerConnector xStartPos={xEgoOffset - 50} xEndPos={xEgoOffset + 50} yPos={yParentOffset} />
          <UIOffspringConnector xPos={xEgoOffset} yStartPos={yParentOffset} yEndPos={yParentOffset + 50} />
          {/*<UISiblingConnector xStartPos={xEgoOffset} xEndPos={500} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={600} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={700} yPos={150} />*/}
        </div>
        <div className="node-layout">
          {familyTreeNodes.map((node) => {
            return <FamilyTreeNode key={crypto.randomUUID()} id={node.id} gender={node.gender} label={node.label} xPos={node.xPos} yPos={node.yPos} />
          })}
        </div>
      </div>
    );
  };

  const renderFamilyTreeCompletion = () => {
    return (
      <div className="family-pedigree-interface">
        <div className="edge-layout">
          <UIPartnerConnector xStartPos={xEgoOffset - 50} xEndPos={xEgoOffset + 50} yPos={yParentOffset} />
          <UIOffspringConnector xPos={xEgoOffset} yStartPos={yParentOffset} yEndPos={yParentOffset + 50} />
          {/*<UISiblingConnector xStartPos={xEgoOffset} xEndPos={500} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={600} yPos={150} />
          <UISiblingConnector xStartPos={xEgoOffset} xEndPos={700} yPos={150} />*/}
        </div>
        <div className="node-layout">
          {familyTreeNodes.map((node) => {
            return <FamilyTreeNode key={crypto.randomUUID()} id={node.id} gender={node.gender} label={node.label} xPos={node.xPos} yPos={node.yPos} handleClick={node.handleClick} />
          })}
        </div>
        {selectedNode != null ? renderNameForm() : null}
      </div>
    );
  }

  const renderActiveStep = () => {
    if (isStep1()) {
      return renderCensusForm();
    } else if (isStep2()) {
      return renderFamilyTreeShells();
    } else {
      return renderFamilyTreeCompletion();
    }
  }

  return (
    <div>
      {renderActiveStep()}
    </div>
  );
};


export default withNoSSRWrapper(FamilyTreeCensus);