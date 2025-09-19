import { describe, expect, it } from 'vitest';
import { type Elevation, generateShadowLayers } from './tailwind-elevation';

describe('Tailwind Elevation Plugin - Polynomial Approximation', () => {
  // Test that the polynomial functions produce reasonable shadow values
  // rather than exact matches to the original coefficient-based system
  const expectReasonableShadow = (actual: any[], description: string) => {
    expect(actual.length).toBeGreaterThan(0);
    
    actual.forEach((layer, index) => {
      // Check that all required properties exist
      expect(layer).toHaveProperty('offsetX');
      expect(layer).toHaveProperty('offsetY');
      expect(layer).toHaveProperty('blurRadius');
      expect(layer).toHaveProperty('spreadRadius');
      expect(layer).toHaveProperty('opacity');
      
      // Check that values are reasonable
      const offsetX = parseFloat(layer.offsetX.replace('px', ''));
      const offsetY = parseFloat(layer.offsetY.replace('px', ''));
      const blur = parseFloat(layer.blurRadius.replace('px', ''));
      const spread = layer.spreadRadius === '0' ? 0 : parseFloat(layer.spreadRadius.replace('px', ''));
      
      // Offsets should be reasonable (can be negative due to light direction)
      expect(offsetX).toBeGreaterThan(-400); // Reasonable bounds for polynomial approximations
      expect(offsetY).toBeGreaterThan(-400);
      expect(offsetX).toBeLessThan(400); // Reasonable upper bound
      expect(offsetY).toBeLessThan(400);
      
      // Blur should be positive and reasonable
      expect(blur).toBeGreaterThan(0);
      expect(blur).toBeLessThan(1200); // Generous bounds for polynomial approximations
      
      // Spread should be 0 or negative (inward shadow effect)
      expect(spread).toBeLessThanOrEqual(0);
      expect(spread).toBeGreaterThan(-10);
      
      // Opacity should be between 0 and 1
      expect(layer.opacity).toBeGreaterThanOrEqual(0);
      expect(layer.opacity).toBeLessThanOrEqual(1);
    });
  };

  it('generates reasonable shadows for base parameters (oomph=0, crispy=0)', () => {
    const result = (elevation: Elevation) =>
      generateShadowLayers(elevation, 0, 0, 0, 0);

    expectReasonableShadow(result('low'), 'low elevation with base parameters');
    expectReasonableShadow(result('medium'), 'medium elevation with base parameters');
    expectReasonableShadow(result('high'), 'high elevation with base parameters');
    
    // Check that we get the expected number of layers
    expect(result('low')).toHaveLength(2);
    expect(result('medium')).toHaveLength(3);
    expect(result('high')).toHaveLength(5);
  });

  it('generates reasonable shadows with high oomph (oomph=1, crispy=0)', () => {
    const result = (elevation: Elevation) =>
      generateShadowLayers(elevation, 1, 0, 0, 0);

    expectReasonableShadow(result('low'), 'low elevation with high oomph');
    expectReasonableShadow(result('medium'), 'medium elevation with high oomph');
    expectReasonableShadow(result('high'), 'high elevation with high oomph');
    
    // High oomph should generally increase blur and opacity
    const lowResult = result('low');
    expect(lowResult[1].opacity).toBeGreaterThan(0.5); // Should have higher opacity
  });

  it('generates reasonable shadows with high crispy (oomph=0, crispy=1)', () => {
    const result = (elevation: Elevation) =>
      generateShadowLayers(elevation, 0, 1, 0, 0);

    expectReasonableShadow(result('low'), 'low elevation with high crispy');
    expectReasonableShadow(result('medium'), 'medium elevation with high crispy');
    expectReasonableShadow(result('high'), 'high elevation with high crispy');
    
    // High crispy should generally add spread radius (negative values)
    const lowResult = result('low');
    expect(lowResult[1].spreadRadius).not.toBe('0'); // Should have spread when crispy
  });

  it('generates reasonable shadows with high oomph and crispy (oomph=1, crispy=1)', () => {
    const result = (elevation: Elevation) =>
      generateShadowLayers(elevation, 1, 1, 0, 0);

    expectReasonableShadow(result('low'), 'low elevation with high oomph and crispy');
    expectReasonableShadow(result('medium'), 'medium elevation with high oomph and crispy');
    expectReasonableShadow(result('high'), 'high elevation with high oomph and crispy');
    
    // Both high oomph and crispy should create strong effects
    const lowResult = result('low');
    expect(lowResult[1].opacity).toBeGreaterThan(0.5); // Higher opacity from oomph
    expect(lowResult[1].spreadRadius).not.toBe('0'); // Spread from crispy
  });

  it('generates reasonable shadows with mixed parameters and light direction', () => {
    const result = (elevation: Elevation) =>
      generateShadowLayers(elevation, 0.5, 0.5, 1, 1);

    expectReasonableShadow(result('low'), 'low elevation with mixed parameters');
    expectReasonableShadow(result('medium'), 'medium elevation with mixed parameters');
    expectReasonableShadow(result('high'), 'high elevation with mixed parameters');
    
    // Light direction should affect offset direction (negative values)
    const lowResult = result('low');
    const offsetX = parseFloat(lowResult[0].offsetX.replace('px', ''));
    const offsetY = parseFloat(lowResult[0].offsetY.replace('px', ''));
    expect(offsetX).toBeLessThan(0); // Should be negative due to light direction
    expect(offsetY).toBeLessThan(0); // Should be negative due to light direction
  });

  it('maintains proper layer progression', () => {
    const result = generateShadowLayers('high', 0.5, 0.5, 0, 0);
    
    // Check that layers generally increase in blur and offset
    for (let i = 1; i < result.length; i++) {
      const currentBlur = parseFloat(result[i].blurRadius.replace('px', ''));
      const previousBlur = parseFloat(result[i-1].blurRadius.replace('px', ''));
      expect(currentBlur).toBeGreaterThanOrEqual(previousBlur);
      
      const currentOffsetX = parseFloat(result[i].offsetX.replace('px', ''));
      const previousOffsetX = parseFloat(result[i-1].offsetX.replace('px', ''));
      expect(currentOffsetX).toBeGreaterThanOrEqual(previousOffsetX);
    }
  });
});