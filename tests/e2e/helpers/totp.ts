import { type Locator, type Page } from '@playwright/test';
import { Secret, TOTP } from 'otpauth';

export function generateTotpCode(secret: string): string {
  const totp = new TOTP({ secret: Secret.fromBase32(secret) });
  return totp.generate();
}

export async function fillSegmentedCode(
  container: Page | Locator,
  code: string,
): Promise<void> {
  for (let i = 0; i < code.length; i++) {
    const input = container.getByRole('textbox', {
      name: `Digit ${i + 1} of ${code.length}`,
    });
    await input.fill(code[i]!);
  }
}
