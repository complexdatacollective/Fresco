export const random = (a = 1, b = 0) => {
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  return lower + Math.random() * (upper - lower);
};

export const randomInt = (a = 1, b = 0) => {
  const lower = Math.ceil(Math.min(a, b));
  const upper = Math.floor(Math.max(a, b));
  return Math.floor(lower + Math.random() * (upper - lower + 1));
};

/**
 * Formats a list of numbers into a human-readable string.
 */
export function formatNumberList(numbers: number[]): string {
    // "1"    
    if (numbers.length === 1) {
        return numbers[0]!.toString();
    }

    // "1 and 2"
    if (numbers.length === 2) {
        return numbers.join(' and ');
    }
    
    // "1, 2, and 3"
    const lastNumber = numbers.pop();
    const formattedList = numbers.join(', ') + `, and ${lastNumber}`;
    
    return formattedList;
}