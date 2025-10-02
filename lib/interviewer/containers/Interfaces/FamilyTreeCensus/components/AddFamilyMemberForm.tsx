import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useDynamicFields } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useDynamicFields';
import { usePlaceholderNodeFormSubmit } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/usePlaceholderNodeFormSubmit';
import { useRelatives } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';
import { getFamilyTreeNodes } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/censusMetadataUtil';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import {
  getNodeTypeLabel,
  getStageMetadata,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { ActionButton, Button, Scroller } from '~/lib/ui/components';

const AddFamilyMemberForm = () => {
  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const icon = useSelector(getNodeIconName);
  const stageMetadata = useSelector(getStageMetadata);
  const step2Nodes = getFamilyTreeNodes(stageMetadata!);

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    mother,
    father,
    grandchildrenOptions,
    nieceOptions,
    firstCousinOptions,
  } = useRelatives(egoNodeId, step2Nodes);

  const { processedFields } = useDynamicFields({
    step2Nodes,
    father,
    mother,
    firstCousinOptions,
    nieceOptions,
    grandchildrenOptions,
    show,
  });

  const { handleSubmit } = usePlaceholderNodeFormSubmit({
    egoNodeId,
    step2Nodes,
    newNodeAttributes,
    setPlaceholderNodes,
    setShow,
  });

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
