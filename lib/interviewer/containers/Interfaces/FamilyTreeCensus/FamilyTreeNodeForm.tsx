import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useProtocolFieldProcessor } from '~/lib/form/hooks/useProtocolFieldProcessor';
import { updateNode as updateNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { Button, Scroller } from '~/lib/ui/components';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { useAppDispatch } from '../../../store';
import Overlay from '../../Overlay';
import { PlaceholderNodeProps } from './FamilyTreeNode';

type FamilyTreeNodeFormProps = {
  selectedNode: PlaceholderNodeProps | NcNode | null;
  form: TForm;
  onClose: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const FamilyTreeNodeForm = (props: FamilyTreeNodeFormProps) => {
  const { selectedNode, form, onClose, addNode } = props;

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);

  const [show, setShow] = useState(false);
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

  const processedFields = useProtocolFieldProcessor({
    fields: form.fields,
    validationMeta: {
      entityId: selectedNode?.[entityPrimaryKeyProperty],
    },
  });

  const getInitialValues = useCallback(
    () => selectedNode?.[entityAttributesProperty] ?? {},
    [selectedNode],
  );

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!selectedNode) return;

      if ('_uid' in selectedNode) {
        // It's an NcNode (already in network) → update
        console.log('[Form] Updating existing node', {
          id: selectedNode[entityPrimaryKeyProperty],
          value,
        });
        const selectedUID = selectedNode[entityPrimaryKeyProperty];
        void updateNode({
          nodeId: selectedUID,
          newAttributeData: value,
        });
      } else {
        console.log('[Form] Adding new node from placeholder', {
          placeholder: selectedNode,
          value,
        });
        // It's a placeholder node → commit as new node
        addNode({ ...newNodeAttributes, ...value });
      }

      setShow(false);
      onClose();
    },
    [selectedNode, newNodeAttributes, onClose, addNode, updateNode],
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

  return (
    <>
      <Overlay
        show={show}
        title={form.title}
        onClose={handleClose}
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
            getInitialValues={getInitialValues}
            focusFirstInput={true}
          />
        </Scroller>
      </Overlay>
    </>
  );
};

export default FamilyTreeNodeForm;
