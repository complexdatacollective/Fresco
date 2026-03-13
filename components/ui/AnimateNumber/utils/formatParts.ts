export type NumberPart = {
  type: string;
  value: number | string;
  key?: string;
};

type FormattedParts = {
  pre: NumberPart[];
  integer: NumberPart[];
  fraction: NumberPart[];
  post: NumberPart[];
  formatted: string;
};

type FormatOptions = {
  locales?: Intl.LocalesArgument;
  format?: Omit<Intl.NumberFormatOptions, 'notation'> & {
    notation?: Exclude<
      Intl.NumberFormatOptions['notation'],
      'scientific' | 'engineering'
    >;
  };
};

export function formatToParts(
  value: number | bigint | string,
  { locales, format }: FormatOptions,
  prefix?: string,
  suffix?: string,
): FormattedParts {
  const formatter = new Intl.NumberFormat(locales, format);
  const parts: { type: string; value: string }[] = formatter.formatToParts(
    Number(value),
  );

  if (prefix) parts.unshift({ type: 'prefix', value: prefix });
  if (suffix) parts.push({ type: 'suffix', value: suffix });

  const pre: NumberPart[] = [];
  const _integer: NumberPart[] = [];
  const fraction: NumberPart[] = [];
  const post: NumberPart[] = [];

  const counts: Record<string, number> = {};
  const generateKey = (type: string) =>
    `${type}:${(counts[type] = (counts[type] ?? -1) + 1)}`;

  let formatted = '';
  let seenInteger = false;
  let seenDecimal = false;

  for (const part of parts) {
    formatted += part.value;
    const type =
      part.type === 'minusSign' || part.type === 'plusSign'
        ? 'sign'
        : part.type;

    switch (type) {
      case 'integer':
        seenInteger = true;
        _integer.push(
          ...part.value.split('').map((d) => ({ type, value: parseInt(d) })),
        );
        break;
      case 'group':
        _integer.push({ type, value: part.value });
        break;
      case 'decimal':
        seenDecimal = true;
        fraction.push({
          type,
          value: part.value,
          key: generateKey(type),
        });
        break;
      case 'fraction':
        fraction.push(
          ...part.value.split('').map((d) => ({
            type,
            value: parseInt(d),
            key: generateKey(type),
          })),
        );
        break;
      default:
        (seenInteger || seenDecimal ? post : pre).push({
          type,
          value: part.value,
          key: generateKey(type),
        });
    }
  }

  const integer: NumberPart[] = [];
  for (let i = _integer.length - 1; i >= 0; i--) {
    const part = _integer[i]!;
    integer.unshift({
      type: part.type,
      value: part.value,
      key: generateKey(part.type),
    });
  }

  return { pre, integer, fraction, post, formatted };
}
