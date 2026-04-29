export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | null;
  percent: number;
  colorClass: 'text-destructive' | 'text-warning' | 'text-success' | null;
};

const SCORE_MAP: Record<
  1 | 2 | 3 | 4,
  Pick<PasswordStrength, 'label' | 'colorClass'>
> = {
  1: { label: 'Weak', colorClass: 'text-destructive' },
  2: { label: 'Fair', colorClass: 'text-warning' },
  3: { label: 'Good', colorClass: 'text-success' },
  4: { label: 'Strong', colorClass: 'text-success' },
};

function countCharacterClasses(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count++;
  if (/[A-Z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[^a-zA-Z0-9]/.test(password)) count++;
  return count;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { score: 0, label: null, percent: 0, colorClass: null };
  }

  const classes = countCharacterClasses(password);
  let score: 1 | 2 | 3 | 4 = 1;

  if (password.length >= 12 && classes >= 4) {
    score = 4;
  } else if (password.length >= 8 && classes >= 3) {
    score = 3;
  } else if (password.length >= 8 && classes >= 2) {
    score = 2;
  }

  return {
    score,
    percent: score * 25,
    ...SCORE_MAP[score],
  };
}
