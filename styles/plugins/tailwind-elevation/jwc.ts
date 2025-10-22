import {
  clamp,
  getValuesForBezierCurve,
  normalize,
  range,
  roundTo,
} from './utils';

export type Elevation = 'low' | 'medium' | 'high';

type ShadowOffsetParams = {
  elevation: Elevation;
  oomph: number;
  crispy: number;
  layerIndex: number;
  lightSource: { x: number; y: number };
  numOfLayers: number;
};

type BlurRadiusParams = {
  x: number;
  y: number;
  elevation: Elevation;
  oomph: number;
  crispy: number;
  layerIndex: number;
  numOfLayers: number;
};

type ShadowOpacityParams = {
  oomph: number;
  crispy: number;
  layerIndex: number;
  numOfLayers: number;
  minLayers: number;
  maxLayers: number;
};

type SpreadParams = {
  oomph: number;
  crispy: number;
  layerIndex: number;
  numOfLayers: number;
};

type GenerateShadowsParams = {
  lightSource: { x: number; y: number };
  resolution: number;
  oomph: number;
  crispy: number;
};

export function formatOklchValues(
  lightness: number,
  chroma: number,
  hue: number,
) {
  return `${lightness} ${chroma} ${hue}`;
}

export function formatOklchString(
  lightness: number,
  chroma: number,
  hue: number,
) {
  return `oklch(${formatOklchValues(lightness, chroma, hue)})`;
}

function calculateShadowOffsets({
  elevation,
  oomph,
  crispy,
  layerIndex,
  lightSource,
  numOfLayers,
}: ShadowOffsetParams) {
  const maxOffsetByElevation = {
    low: normalize(oomph, 0, 1, 12, 18),
    medium: normalize(oomph, 0, 1, 22, 32),
    high: normalize(oomph, 0, 1, 36, 50),
  };

  // We don't want to use linear interpolation here because we want
  // the shadows to cluster near the front and fall off. Otherwise,
  // the most opaque part of the shadow is in the middle of the
  // group, rather than being near the element.
  // We'll use a bezier curve and pluck points along it.
  const curve = {
    startPoint: [0, 1] as [number, number],
    endPoint: [1, 0] as [number, number],
    controlPoint1: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0),
    ] as [number, number],
    controlPoint2: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0),
    ] as [number, number],
  };
  const t = layerIndex / (numOfLayers - 1);
  const [ratio] = getValuesForBezierCurve(curve, t);

  const max = maxOffsetByElevation[elevation];

  // Now, for x/y offset... we have this lightSource value, with
  // X and Y from -1 to 1.
  const xOffsetMin = normalize(lightSource.x, -1, 1, 1, -1);
  const xOffsetMax = normalize(lightSource.x, -1, 1, max, max * -1);
  const yOffsetMin = normalize(lightSource.y, -1, 1, 1, -1);
  const yOffsetMax = normalize(lightSource.y, -1, 1, max, max * -1);

  const x = roundTo(normalize(ratio, 0, 1, xOffsetMin, xOffsetMax), 1);
  const y = roundTo(normalize(ratio, 0, 1, yOffsetMin, yOffsetMax), 1);

  return { x, y };
}

function calculateBlurRadius({
  x,
  y,
  elevation,
  oomph: _oomph,
  crispy,
  layerIndex: _layerIndex,
  numOfLayers: _numOfLayers,
}: BlurRadiusParams) {
  // The blur radius should depend on the x/y offset.
  // Calculate the hypothenuse length and use it as the blur radius?
  const hypothenuse = (x ** 2 + y ** 2) ** 0.5;

  // Base blur calculation
  let radius = normalize(crispy, 0, 1, hypothenuse * 1.5, hypothenuse * 0.75);

  // Apply elevation-specific blur adjustments for visual hierarchy
  const elevationBlurMultiplier = {
    low: 0.7, // Sharper shadows for low elevation
    medium: 0.85, // Moderate blur for medium elevation
    high: 1.0, // More diffused shadows for high elevation
  };

  radius *= elevationBlurMultiplier[elevation];

  // Ensure minimum blur for visibility
  radius = Math.max(radius, 0.5);

  return roundTo(radius, 1);
}

function calculateShadowOpacity({
  oomph,
  crispy,
  layerIndex,
  numOfLayers,
  minLayers,
  maxLayers,
}: ShadowOpacityParams) {
  const baseOpacity = normalize(oomph, 0, 1, 0.4, 1.25);

  const initialOpacityMultiplier = normalize(crispy, 0, 1, 0, 1);
  const finalOpacityMultiplier = normalize(crispy, 0, 1, 1, 0);

  // Crispy determines which shadows are more visible, and
  // which shadows are less visible.
  const layerOpacityMultiplier = normalize(
    layerIndex,
    0,
    numOfLayers,
    initialOpacityMultiplier,
    finalOpacityMultiplier,
  );

  const opacity = baseOpacity * layerOpacityMultiplier;

  // So, here's the problem.
  // The `resolution` param lets us change how many layers are
  // generated. Every additional layer should reduce the opacity
  // of all layers, so that "resolution" doesn't change the
  // perceived opacity.
  const averageLayers = (minLayers + maxLayers) / 2;
  const ratio = averageLayers / numOfLayers;

  const layerOpacity = opacity * ratio;

  return clamp(roundTo(layerOpacity, 2), 0, 1);
}

function calculateSpread({
  oomph: _oomph,
  crispy,
  layerIndex,
  numOfLayers,
}: SpreadParams) {
  // return 0;

  if (layerIndex === 0) {
    return 0;
  }

  const maxReduction = normalize(crispy, 0, 1, 0, -5);
  const actualReduction = normalize(
    layerIndex + 1,
    1,
    numOfLayers,
    0,
    maxReduction,
  );

  return roundTo(actualReduction, 1);
}

/**
 * We'll generate a set of 3 shadows: low, medium, high elevation.
 * Each shadow will have multiple layers, depending on the elevation.
 * A low elevation shadow might only have 2 layers, a high elevation might have 6.
 * Though, this is affected by the `resolution` parameter
 */
export function generateShadows({
  lightSource,
  resolution,
  oomph,
  crispy,
}: GenerateShadowsParams) {
  const output: string[][][] = [];

  const SHADOW_LAYER_LIMITS: Record<Elevation, { min: number; max: number }> = {
    low: {
      min: 2,
      max: 3,
    },
    medium: {
      min: 2,
      max: 5,
    },
    high: {
      min: 3,
      max: 10,
    },
  };

  const elevations: Elevation[] = ['low', 'medium', 'high'];
  for (const elevation of elevations) {
    const numOfLayers = Math.round(
      normalize(
        resolution,
        0,
        1,
        SHADOW_LAYER_LIMITS[elevation].min,
        SHADOW_LAYER_LIMITS[elevation].max,
      ),
    );

    const layersForElevation: string[][] = [];

    range(numOfLayers).map((layerIndex) => {
      const opacity = calculateShadowOpacity({
        oomph,
        crispy,
        layerIndex,
        numOfLayers,
        minLayers: SHADOW_LAYER_LIMITS[elevation].min,
        maxLayers: SHADOW_LAYER_LIMITS[elevation].max,
      });

      const { x, y } = calculateShadowOffsets({
        elevation,
        oomph,
        crispy,
        lightSource,
        layerIndex,
        numOfLayers,
      });

      const blurRadius = calculateBlurRadius({
        x,
        y,
        elevation,
        oomph,
        crispy,
        layerIndex,
        numOfLayers,
      });

      const spread = calculateSpread({
        oomph,
        crispy,
        layerIndex,
        numOfLayers,
      });
      const spreadString = spread !== 0 ? `${spread}px ` : '';

      layersForElevation.push([
        `${x}px ${y}px ${blurRadius}px ${spreadString}oklch(var(--shadow-color) / ${opacity})`,
      ]);
    });

    output.push(layersForElevation);
  }

  return output;
}

export function getShadowBackgroundOklchValues(
  oomph: number,
  backgroundOklch: [number, number, number],
) {
  const [initialLightness, initialChroma, hue] = backgroundOklch;
  let lightness = initialLightness;
  let chroma = initialChroma;

  const maxLightness = normalize(oomph, 0, 1, 0.85, 0.5);

  const chromaEnhancement = normalize(lightness, 0.5, 1, 1, 0.25);

  chroma = roundTo(clamp(chroma * chromaEnhancement, 0, 0.4), 3);
  lightness = roundTo(
    clamp(normalize(lightness, 0, 1, 0, maxLightness) - 0.05, 0, 1),
    3,
  );

  return formatOklchValues(lightness, chroma, hue);
}

export function generateShadowLayers(
  elevation: Elevation,
  oomph: number,
  crispy: number,
  lightSource: { x: number; y: number },
  resolution: number,
): {
  offsetX: string;
  offsetY: string;
  blurRadius: string;
  spreadRadius: string;
  opacity: number;
}[] {
  // Determine the number of layers based on elevation and resolution
  const SHADOW_LAYER_LIMITS: Record<Elevation, { min: number; max: number }> = {
    low: {
      min: 2,
      max: 3,
    },
    medium: {
      min: 2,
      max: 5,
    },
    high: {
      min: 3,
      max: 10,
    },
  };

  const numOfLayers = Math.round(
    normalize(
      resolution,
      0,
      1,
      SHADOW_LAYER_LIMITS[elevation].min,
      SHADOW_LAYER_LIMITS[elevation].max,
    ),
  );

  const layers: {
    offsetX: string;
    offsetY: string;
    blurRadius: string;
    spreadRadius: string;
    opacity: number;
    adjustedChroma?: number;
  }[] = [];

  for (let layerIndex = 0; layerIndex < numOfLayers; layerIndex++) {
    const opacity = calculateShadowOpacity({
      oomph,
      crispy,
      layerIndex,
      numOfLayers,
      minLayers: SHADOW_LAYER_LIMITS[elevation].min,
      maxLayers: SHADOW_LAYER_LIMITS[elevation].max,
    });

    const { x, y } = calculateShadowOffsets({
      elevation,
      oomph,
      crispy,
      lightSource,
      layerIndex,
      numOfLayers,
    });

    const blurRadius = calculateBlurRadius({
      x,
      y,
      elevation,
      oomph,
      crispy,
      layerIndex,
      numOfLayers,
    });

    const spread = calculateSpread({
      oomph,
      crispy,
      layerIndex,
      numOfLayers,
    });

    layers.push({
      offsetX: `${x}px`,
      offsetY: `${y}px`,
      blurRadius: `${blurRadius}px`,
      spreadRadius: `${spread}px`,
      opacity: opacity,
    });
  }

  return layers;
}

export function formatShadowsAsDropShadow(shadows: string[][]) {
  return shadows.map((shadowsForSize) => {
    const reducedString = shadowsForSize.reduce(
      (acc: string, shadowString: string) =>
        `${acc} drop-shadow(${shadowString})`,
      '',
    );

    return reducedString.trim();
  });
}

export function formatShadowsAsBoxShadow(shadows: string[][]) {
  return shadows.map((shadowsForSize) => {
    const reducedString = shadowsForSize.reduce(
      (acc: string, shadowString: string) => {
        if (!acc) {
          return shadowString;
        }
        return `${acc},\n${shadowString}`;
      },
      '',
    );

    return reducedString.trim();
  });
}

export function generateCode(
  shadows: string[][],
  shadowBackgroundValues: string,
) {
  const [low, medium, high] = shadows;

  function renderShadowLayers(layers: string[]) {
    return layers.join(',\n    ');
  }

  let code = `
:root {
  --shadow-color: ${shadowBackgroundValues};
  --shadow-elevation-low:
    ${renderShadowLayers(low ?? [])};
  --shadow-elevation-medium:
    ${renderShadowLayers(medium ?? [])};
  --shadow-elevation-high:
    ${renderShadowLayers(high ?? [])};
}`;

  code = code.trim();
  return code;
}
