import { type Form as TForm } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';
import { useProtocolFieldProcessor } from '~/lib/form/hooks/useProtocolFieldProcessor';
import { type Node } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import Overlay from '~/lib/interviewer/containers/Overlay';
import {
  addNode as addNetworkNode,
  updateNode as updateNetworkNode,
} from '~/lib/interviewer/ducks/modules/session';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { useAppDispatch } from '~/lib/interviewer/store';
import { Button, Scroller } from '~/lib/ui/components';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import type { FamilyTreeNode } from './FamilyTreeNode';

type FamilyTreeNodeFormProps = {
  nodeType: string;
  selectedNode: FamilyTreeNode | void;
  form: TForm;
  onClose: () => void;
};

const FamilyTreeNodeForm = (props: FamilyTreeNodeFormProps) => {
  const { nodeType, selectedNode, form, onClose } = props;

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);

  const [show, setShow] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateShellNode = useFamilyTreeStore((state) => state.updateNode);
  const getShellIdByNetworkId = useFamilyTreeStore(
    (state) => state.getShellIdByNetworkId,
  );
  const dispatch = useAppDispatch();

  const commitShellNode = useCallback(
    (node: Node, attributes: NcNode[EntityAttributesProperty]) => {
      if (!node) return;

      const nodeNetworkId = crypto.randomUUID();
      const { label, name, ...networkAttributes } = attributes;

      void dispatch(
        addNetworkNode({
          type: nodeType,
          modelData: { [entityPrimaryKeyProperty]: nodeNetworkId },
          attributeData: networkAttributes,
        }),
      ).then(() => {
        if (node.id) {
          updateShellNode(node.id, {
            interviewNetworkId: nodeNetworkId,
            name: name as string,
            fields: networkAttributes, // ✅ keep structure consistent from the start
          });
        }
      });
    },
    [dispatch, nodeType, updateShellNode],
  );

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey]; // network ID
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => {
      const { name, ...attributes } = payload.newAttributeData;
      void dispatch(updateNetworkNode(payload)).then(() => {
        // find shell node by interviewNetworkId
        const shellId = getShellIdByNetworkId(payload.nodeId);
        if (shellId) {
          updateShellNode(shellId, {
            name: name as string,
            fields: attributes,
          });
        }
      });
    },
    [dispatch, getShellIdByNetworkId, updateShellNode],
  );

  const processedFields = useProtocolFieldProcessor({
    fields: form.fields,
    validationMeta: {
      entityId: selectedNode?.id,
    },
  });

  const getInitialValues = useCallback(() => {
    const values: Record<string, VariableValue> = {};

    if (!selectedNode) return values;

    form.fields.forEach((field: { variable: string }) => {
      // Check in fields first (updated values), then fall back to top-level
      const value =
        (selectedNode.fields as Record<string, unknown> | undefined)?.[
          field.variable
        ] ?? selectedNode[field.variable];

      if (value !== undefined) {
        values[field.variable] = value as VariableValue;
      }
    });

    return values;
  }, [selectedNode, form.fields]);

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!selectedNode || !selectedNode.id) return;

      if (selectedNode.interviewNetworkId) {
        // Existing node → update only the editable fields
        void updateNode({
          nodeId: selectedNode.interviewNetworkId,
          newAttributeData: value,
        });
      } else {
        // Placeholder → label and commit
        const { label } = selectedNode;
        const fullPayload = {
          ...newNodeAttributes,
          ...value,
          label,
        };
        commitShellNode(selectedNode, fullPayload);
      }

      setShow(false);
      onClose();
    },
    [selectedNode, newNodeAttributes, commitShellNode, onClose, updateNode],
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
