import { Page, expect } from '@playwright/test';

export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Check basic accessibility requirements
   */
  async checkBasicAccessibility() {
    // Check for page title
    await expect(this.page).toHaveTitle(/.+/);

    // Check for main landmark
    const mainLandmark = this.page.locator('main, [role="main"]');
    if ((await mainLandmark.count()) > 0) {
      await expect(mainLandmark.first()).toBeVisible();
    }

    // Check for navigation landmark
    const navLandmark = this.page.locator('nav, [role="navigation"]');
    if ((await navLandmark.count()) > 0) {
      await expect(navLandmark.first()).toBeVisible();
    }

    // Check for heading structure
    const h1Elements = this.page.locator('h1');
    const h1Count = await h1Elements.count();
    
    if (h1Count === 0) {
      throw new Error('Page should have at least one h1 element');
    }
    
    if (h1Count > 1) {
      // Multiple h1 elements may be acceptable in some layouts
      // but let's warn about it
      console.warn(`Multiple h1 elements found (${h1Count}). Consider using a single h1 per page.`);
    }

    await expect(h1Elements.first()).toBeVisible();
  }

  /**
   * Check form accessibility
   */
  async checkFormAccessibility() {
    const forms = this.page.locator('form');
    const formCount = await forms.count();

    if (formCount === 0) {
      return; // No forms to check
    }

    for (let i = 0; i < formCount; i++) {
      const form = forms.nth(i);
      
      // Check that form inputs have labels or aria-labels
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let j = 0; j < inputCount; j++) {
        const input = inputs.nth(j);
        const inputType = await input.getAttribute('type');
        
        // Skip hidden inputs
        if (inputType === 'hidden') {
          continue;
        }

        // Check if input has proper labeling
        const hasLabel = await this.hasProperLabel(input);
        if (!hasLabel) {
          const inputId = await input.getAttribute('id') || `input-${j}`;
          console.warn(`Input element (${inputId}) may not have proper labeling`);
        }
      }

      // Check for submit button
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      if ((await submitButton.count()) > 0) {
        await expect(submitButton.first()).toBeVisible();
      }
    }
  }

  /**
   * Check if an input has proper labeling
   */
  private async hasProperLabel(input: any): Promise<boolean> {
    // Check for aria-label
    const ariaLabel = await input.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      return true;
    }

    // Check for aria-labelledby
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const referencedElement = this.page.locator(`#${ariaLabelledBy}`);
      if ((await referencedElement.count()) > 0) {
        return true;
      }
    }

    // Check for associated label
    const inputId = await input.getAttribute('id');
    if (inputId) {
      const associatedLabel = this.page.locator(`label[for="${inputId}"]`);
      if ((await associatedLabel.count()) > 0) {
        return true;
      }
    }

    // Check if input is wrapped in a label
    const parentLabel = input.locator('xpath=ancestor::label[1]');
    if ((await parentLabel.count()) > 0) {
      return true;
    }

    // Check for placeholder (not ideal but acceptable)
    const placeholder = await input.getAttribute('placeholder');
    return Boolean(placeholder && placeholder.trim());
  }

  /**
   * Check keyboard navigation
   */
  async checkKeyboardNavigation() {
    // Test that interactive elements can be focused
    const interactiveElements = this.page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const elementCount = await interactiveElements.count();

    if (elementCount === 0) {
      return; // No interactive elements
    }

    // Test focus on first few elements
    const elementsToTest = Math.min(elementCount, 3);
    
    for (let i = 0; i < elementsToTest; i++) {
      const element = interactiveElements.nth(i);
      
      if (await element.isVisible()) {
        await element.focus();
        await expect(element).toBeFocused();
      }
    }
  }

  /**
   * Check color contrast (basic simulation)
   */
  async checkColorContrast() {
    // This is a basic check - for comprehensive contrast testing,
    // you would need a proper accessibility testing library
    
    // Check for common accessibility issues in CSS
    const elementsWithLowContrast = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues: string[] = [];
      
      elements.forEach((element, index) => {
        if (element.textContent?.trim()) {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Basic check for very light text on light background
          if (color === 'rgb(255, 255, 255)' && 
              (backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'rgba(0, 0, 0, 0)')) {
            issues.push(`Element ${index}: White text on white/transparent background`);
          }
          
          // Check for very light gray text which might have contrast issues
          if (color.startsWith('rgb(') && color.includes('240, 240, 240')) {
            issues.push(`Element ${index}: Very light gray text may have contrast issues`);
          }
        }
      });
      
      return issues;
    });

    if (elementsWithLowContrast.length > 0) {
      console.warn('Potential color contrast issues:', elementsWithLowContrast.slice(0, 5));
    }
  }

  /**
   * Check for alt text on images
   */
  async checkImageAltText() {
    const images = this.page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Images should have alt text (can be empty for decorative images)
      if (alt === null) {
        console.warn(`Image without alt attribute: ${src}`);
      }
    }
  }

  /**
   * Run comprehensive accessibility check
   */
  async runFullAccessibilityCheck() {
    await this.checkBasicAccessibility();
    await this.checkFormAccessibility();
    await this.checkKeyboardNavigation();
    await this.checkColorContrast();
    await this.checkImageAltText();
  }
}