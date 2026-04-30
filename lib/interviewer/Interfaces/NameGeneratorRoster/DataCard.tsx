import { type VariableValue } from '@codaco/shared-consts';
import Heading from '@codaco/fresco-ui/typography/Heading';
import { cx } from '@codaco/fresco-ui/utils/cva';

type DataCardDetails = Record<string, VariableValue | undefined>;

type DataCardProps = Omit<
  React.ComponentPropsWithRef<'article'>,
  'aria-label'
> & {
  /** The card title — typically the displayLabel attribute */
  label: string;
  /** Label → value pairs to render below the title */
  details?: DataCardDetails;
};

const formatValue = (value: VariableValue | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map(formatValue).join(', ');
  }

  if (
    typeof value === 'object' &&
    'x' in value &&
    'y' in value &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  ) {
    return `${value.y.toFixed(4)}, ${value.x.toFixed(4)}`;
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(', ');
  }

  return String(value);
};

/**
 * DataCard renders a roster item with a prominent title and a tabular
 * (description-list) layout of additional properties. Renders correctly in
 * either a list or a grid layout — the card stretches to fill its container
 * and the description list reflows naturally at any width.
 *
 * Uses semantic `<dl>`/`<dt>`/`<dd>` elements so screen readers can announce
 * each property as a label/value pair instead of a flat run of text.
 */
const DataCard = ({
  label,
  details,
  className,
  ...articleProps
}: DataCardProps) => {
  const hasDetails = details && Object.keys(details).length > 0;

  return (
    <article
      {...articleProps}
      className={cx(
        'card group relative flex h-full flex-col overflow-hidden rounded-xs',
        'bg-platinum text-charcoal',
        'focusable outline-white',
        className,
      )}
      aria-label={label}
    >
      <header className="border-platinum-dark/30 border-b px-4 pt-3 pb-2">
        <Heading level="h4" margin="none" render={<h4 />}>
          {label}
        </Heading>
      </header>

      {hasDetails && (
        <dl className="bg-platinum-dark grid grow grid-cols-[fit-content(33%)_minmax(0,1fr)] items-baseline gap-x-6 gap-y-4 px-6 py-4 text-sm">
          {Object.entries(details).map(([detailLabel, value]) => (
            <div key={detailLabel} className="contents">
              <Heading
                level="label"
                variant="all-caps"
                margin="none"
                render={<dt />}
                className="text-right text-xs wrap-break-word"
              >
                {detailLabel}
              </Heading>
              <dd className="font-medium wrap-break-word">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
};

export default DataCard;
