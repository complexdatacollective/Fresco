import { type Stage } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import type { PlaceholderNodeProps } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeNode';
import { type StageProps } from '~/lib/interviewer/containers/Stage';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import UIPrompts from '~/lib/ui/components/Prompts/Prompts';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

const CensusForm = () => {
  return <div>Census form</div>;
};

const FamilyTreeShells = () => {
  return <div>Family tree shells</div>;
};
const FamilyTreeCompletion = () => {
  return <div>Family tree completion</div>;
};

const FamilyTreeContext = createContext<{
  selectedNode: PlaceholderNodeProps | NcNode | null;
  setSelectedNode: (node: PlaceholderNodeProps | NcNode | null) => void;
  placeholderNodes: PlaceholderNodeProps[];
  setPlaceholderNodesBulk: (nodes: PlaceholderNodeProps[]) => void;
  addPlaceholderNode: (node: PlaceholderNodeProps) => void;
  updatePlaceholderNode: (node: PlaceholderNodeProps) => void;
  removePlaceholderNode: (nodeId: string) => void;
}>({
  selectedNode: null,
  setSelectedNode: () => {},
  placeholderNodes: [],
  setPlaceholderNodesBulk: () => {},
  addPlaceholderNode: () => {},
  updatePlaceholderNode: () => {},
  removePlaceholderNode: () => {},
});

const FamilyTreeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedNode, setSelectedNode] = useState<
    PlaceholderNodeProps | NcNode | null
  >(null);
  const [placeholderNodes, setPlaceholderNodes] = useState<
    PlaceholderNodeProps[]
  >([]);

  const setPlaceholderNodesBulk = (nodes: PlaceholderNodeProps[]) => {
    setPlaceholderNodes(nodes);
  };

  const addPlaceholderNode = (node: PlaceholderNodeProps) => {
    setPlaceholderNodes((prev) => [...prev, node]);
  };

  const updatePlaceholderNode = (node: PlaceholderNodeProps) => {
    setPlaceholderNodes((prev) =>
      prev.map((n) => (n._uid === node._uid ? node : n)),
    );
  };

  const removePlaceholderNode = (nodeId: string) => {
    setPlaceholderNodes((prev) => prev.filter((n) => n._uid !== nodeId));
    if (
      selectedNode &&
      '_uid' in selectedNode &&
      selectedNode._uid === nodeId
    ) {
      setSelectedNode(null);
    }
  };

  return (
    <FamilyTreeContext.Provider
      value={{
        selectedNode,
        setSelectedNode,
        placeholderNodes,
        setPlaceholderNodesBulk,
        addPlaceholderNode,
        updatePlaceholderNode,
        removePlaceholderNode,
      }}
    >
      {children}
    </FamilyTreeContext.Provider>
  );
};

const useFamilyTreeContext = () => useContext(FamilyTreeContext);

const getFamilyTreeStepText = createSelector(getCurrentStage, (stage) => {
  if (stage.type !== 'FamilyTreeCensus') return null;

  const prompts = [];

  prompts.push({
    id: '0',
    text: stage.step1.text,
  });

  prompts.push({
    id: '1',
    text: stage.step2.text,
  });

  if (stage.step3) {
    prompts.push({
      id: '2',
      text: stage.step3.text,
    });
  }

  return prompts;
});

const FamilyTreePrompts = ({ currentStep }: { currentStep: number }) => {
  const familyTreeStepText = useSelector(getFamilyTreeStepText);

  invariant(
    familyTreeStepText,
    'No step text found for FamilyTreeCensus stage',
  );

  return (
    <UIPrompts
      currentPromptId={currentStep.toString()}
      prompts={familyTreeStepText}
    />
  );
};

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { getNavigationHelpers, registerBeforeNext, stage } = props;

  /**
   * Steps:
   *  1. Census form (number of each type of family member)
   *  2. Family tree shells (placeholders for each family member)
   *  3. Family tree completion (fill in details for each family member)
   */
  const steps = [CensusForm, FamilyTreeShells, FamilyTreeCompletion];

  const [currentStep, setCurrentStep] = useState(0);

  const dispatch = useAppDispatch();

  registerBeforeNext((direction) => {
    if (direction === 'forwards') {
      if (currentStep >= steps.length - 1) {
        return true; // Allow navigation to next stage
      }

      setCurrentStep((s) => s + 1);
      return false;
    } else if (direction === 'backwards') {
      if (currentStep <= 0) {
        return true; // Allow navigation to previous stage
      }

      setCurrentStep((s) => s - 1);
      return false;
    }
    return false;
  });

  const CurrentStepComponent = steps[currentStep];

  return (
    <div className="flex h-full flex-col">
      <FamilyTreePrompts currentStep={currentStep} />
      <FamilyTreeContextProvider>
        {CurrentStepComponent && <CurrentStepComponent />}
      </FamilyTreeContextProvider>
    </div>
  );
};

export default withNoSSRWrapper(FamilyTreeCensus);
