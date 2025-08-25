export type DateParts = {
  year: number | null;
  month: number | null;
  day: number | null;
}

export type DateRange = {
  start: DateParts;
  end: DateParts;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export function getMonthName(month: number | null): string {
  if (!month || month < 1 || month > 12) return '';
  return MONTHS[month - 1] ?? '';
}

export function getMonthShortName(month: number | null): string {
  if (!month || month < 1 || month > 12) return '';
  return MONTH_SHORT[month - 1] ?? '';
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(date: DateParts): number {
  if (!date.year || !date.month) return 1;
  return new Date(date.year, date.month - 1, 1).getDay();
}

export function isValidDate(date: DateParts): boolean {
  if (!date.year || !date.month || !date.day) return false;
  
  const d = new Date(date.year, date.month - 1, date.day);
  return d.getFullYear() === date.year &&
         d.getMonth() === date.month - 1 &&
         d.getDate() === date.day;
}

export function datePartsToString(date: DateParts): string | null {
  if (!isValidDate(date)) return null;
  
  const year = date.year!;
  const month = String(date.month!).padStart(2, '0');
  const day = String(date.day!).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function stringToDateParts(dateString: string | null | undefined): DateParts {
  if (!dateString) {
    return { year: null, month: null, day: null };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { year: null, month: null, day: null };
  }
  
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function isEmpty(date: DateParts): boolean {
  return !date.year && !date.month && !date.day;
}

export function isComplete(date: DateParts, type: 'full' | 'month' | 'year' = 'full'): boolean {
  switch (type) {
    case 'year':
      return date.year !== null;
    case 'month':
      return date.year !== null && date.month !== null;
    case 'full':
      return date.year !== null && date.month !== null && date.day !== null;
    default:
      return false;
  }
}

export function now(): Date {
  return new Date();
}

export function getToday(): DateParts {
  const today = now();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

export function hasProperties(required: (keyof DateParts)[], check?: (keyof DateParts)[]): (date: DateParts) => boolean {
  return (date: DateParts) => {
    const hasRequired = required.every(key => date[key] !== null);
    if (!check) return hasRequired;
    const hasCheck = check.some(key => date[key] !== null);
    return hasRequired && hasCheck;
  };
}