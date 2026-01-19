import { type VariableValue } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ActionButton from '~/components/interview/ActionButton';
import Button from '~/components/ui/Button';
import { type InterviewerIconName } from '~/components/ui/Icon';
import Form from '~/lib/form/components/Form';
import { useFamilyTreeStore } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import { useDynamicFields } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useDynamicFields';
import { useRelatives } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';
import Overlay from '~/lib/interviewer/containers/Overlay';
import { getNodeIconName } from '~/lib/interviewer/selectors/name-generator';
import {
  getNodeTypeLabel,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';
import { Scroller } from '~/lib/legacy-ui/components';

const AddFamilyMemberForm = () => {
  const subject = useSelector(getStageSubject);
  const nodeType = useSelector(
    getNodeTypeLabel(subject.entity !== 'ego' ? subject.type : ''),
  );
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

  const handleSubmit = (formData: { value: Record<string, VariableValue> }) => {
    const { value } = formData;
    const relation = value.relation;
    const relationId =
      typeof relation === 'string'
        ? (value[`${relation}Relation`] as string | undefined)
        : undefined;
    const anchorId = typeof relationId === 'string' ? relationId : undefined;
    if (typeof relation === 'string') {
      addPlaceholderNode(relation, anchorId);
    }
    setShow(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div className="name-generator-interface__add-button">
          <ActionButton
            onClick={() => setShow(true)}
            iconName={icon as InterviewerIconName}
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
      >
        <Scroller>
          <Form
            ref={formRef}
            // FieldComponentProps expects options of type FieldConfig[] but RadioGroup is JavaScript and options is an untyped array
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
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
