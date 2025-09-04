import { type FormField } from '@codaco/protocol-validation';
import { useSelector } from 'react-redux';
import { selectFieldMetadata } from '~/lib/interviewer/selectors/forms';
import { type Field } from '../components';
import { translateProtocolValidation } from '../utils/translateProtocolValidation';

type UseProtocolFormReturn = {
  fieldComponents: (typeof Field)[];
  formContext: Record<string, unknown>;
};

export default function useProtocolForm({
  fields,
  autoFocus = false,
}: {
  fields: FormField[];
  autoFocus?: boolean;
}): UseProtocolFormReturn {
  // const formContext = useSelector(getProtocolFormContext);
  const formContext = {};

  const fieldsWithMetadata = useSelector((state) =>
    selectFieldMetadata(state, fields),
  );

  const fieldComponents = fieldsWithMetadata.map(
    ({ type, ...fieldProps }, index) => {
      const FieldComponent = fieldComponents[type];

      const validation = translateProtocolValidation(fieldProps, formContext);

      return <FieldComponent key={index} {...fieldProps} />;
    },
  );

  return {
    fieldComponents,
    formContext,
  };
}
