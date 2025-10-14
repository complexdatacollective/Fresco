import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useDynamicFields } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useDynamicFields';
import { useRelatives } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import {
  getNodeTypeLabel,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';
import { useFamilyTreeStore } from '../FamilyTreeProvider';

const AddFamilyMemberForm = () => {
  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const icon = useSelector(getNodeIconName);
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const nodes = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );
  const edgesMap = useFamilyTreeStore((state) => state.network.edges);
  const addPlaceholderNode = useFamilyTreeStore(
    (state) => state.addPlaceholderNode,
  );

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { grandchildrenOptions, nieceOptions, firstCousinOptions } =
    useRelatives(nodesMap ?? new Map(), edgesMap ?? new Map());

  const { processedFields } = useDynamicFields({
    nodes,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    show,
  });

  const handleSubmit = (formData) => {
    const { value } = formData;
    const relation = value.relation;
    const anchorId = value[`${relation}Relation`];
    addPlaceholderNode(relation, anchorId);
    setShow(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div className="name-generator-interface__add-button">
          <ActionButton
            onClick={() => setShow(true)}
            icon={icon}
            title={`Add ${nodeType}...`}
          />
        </motion.div>
      </AnimatePresence>
      <Overlay
        show={show}
        title="Add Relative"
        onClose={() => setShow(false)}
        className="node-form"
        footer={
          <Button
            key="submit"
            aria-label="Submit"
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
          >
            Finished
          </Button>
        }
        allowMaximize={false}
      >
        <Scroller>
          <Form
            ref={formRef}
            fields={processedFields}
            handleSubmit={handleSubmit}
            focusFirstInput={true}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default AddFamilyMemberForm;
