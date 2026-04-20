import { cx } from '~/utils/cva';
import { type CreateFormFieldProps } from '../Field/types';
import { addDays, todayYmd } from '../../utils/ymd';
import InputField from './InputField';

type RelativeDatePickerFieldProps = CreateFormFieldProps<
  string,
  'input',
  {
    anchor?: string; // ISO date string (YYYY-MM-DD)
    before?: number; // days before anchor
    after?: number; // days after anchor
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
  }
>;

// See DatePicker for rationale — native <input type="date"> doesn't expose its
// empty-state format hint via ::placeholder, so we style Firefox (via the
// input's own color) and Chromium/Safari (via ::-webkit-datetime-edit)
// directly when the value is empty.
const emptyDateInputClass = cx(
  'text-input-contrast/50 italic',
  '[&::-webkit-datetime-edit]:text-input-contrast/50',
  '[&::-webkit-datetime-edit]:italic',
);

export default function RelativeDatePickerField(
  props: RelativeDatePickerFieldProps,
) {
  const {
    anchor,
    before = 180,
    after = 0,
    value,
    onChange,
    name,
    size = 'md',
    placeholder,
    className,
    disabled,
    readOnly,
    ...rest
  } = props;

  const anchorYmd = anchor && typeof anchor === 'string' ? anchor : todayYmd();
  const minYmd = addDays(anchorYmd, -before);
  const maxYmd = addDays(anchorYmd, after);

  return (
    <InputField
      type="date"
      size={size}
      min={minYmd}
      max={maxYmd}
      value={value}
      onChange={(value) => onChange?.(String(value))}
      onBlur={rest.onBlur}
      name={name ?? ''}
      placeholder={placeholder}
      className={cx(
        'outline-input-contrast',
        !value && emptyDateInputClass,
        className,
      )}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={rest['aria-invalid']}
      aria-describedby={rest['aria-describedby']}
      aria-required={rest['aria-required']}
    />
  );
}
