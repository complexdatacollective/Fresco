// YYYY-MM-DD string helpers. Arithmetic runs in UTC so derived bounds are
// stable regardless of the runtime timezone — critical because the form's
// min/max validators compare YYYY-MM-DD strings lexically; any drift would
// introduce off-by-one-day validation errors near DST transitions or across
// timezone boundaries.

function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDays(ymd: string, days: number): string {
  const parts = ymd.split('-').map(Number);
  const [year, month, day] = parts;
  if (year === undefined || month === undefined || day === undefined) {
    return ymd;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return formatYmd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function todayYmd(): string {
  const now = new Date();
  return formatYmd(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
  );
}
