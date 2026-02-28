import { memo, type ReactNode } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import { cx } from '~/utils/cva';

type BooleanOptionProps = {
  classes?: string;
  selected?: boolean;
  label: string | (() => ReactNode);
  onClick?: () => void;
  negative?: boolean;
};

const BooleanOption = memo(function BooleanOption({
  classes = '',
  selected = false,
  label,
  onClick,
  negative = false,
}: BooleanOptionProps) {
  return (
    <div
      className={cx(
        'boolean-option',
        selected && 'boolean-option--selected',
        negative && 'boolean-option--negative',
        classes,
      )}
      onClick={onClick}
    >
      {typeof label === 'function' ? (
        label()
      ) : (
        <span className="form-field-inline-label">
          <RenderMarkdown>{label}</RenderMarkdown>
        </span>
      )}
    </div>
  );
});

export default BooleanOption;
