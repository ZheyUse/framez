export interface TextElementStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  fill: string;
  textDecoration: 'normal' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  padding: [number, number, number, number]; // top, right, bottom, left
}

export interface TextElementOverrides {
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: Partial<TextElementStyle>;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  style: TextElementStyle;
  templateId: string;
  imageIndex?: number; // undefined/negative = global (applies to all), >= 0 = individual
  overrides: Record<number, TextElementOverrides>; // imageIndex -> overrides for this image
  createdAt: number;
}

export const DEFAULT_TEXT_STYLE: TextElementStyle = {
  fontFamily: 'Space Grotesk',
  fontSize: 48,
  fontWeight: 700,
  fontStyle: 'normal',
  fill: '#ffffff',
  textDecoration: 'normal',
  textTransform: 'none',
  textAlign: 'center',
  letterSpacing: 0,
  lineHeight: 1.2,
  padding: [0, 0, 0, 0],
};

// Check if a text element is global (applies to all images)
export function isGlobalText(element: TextElement): boolean {
  return element.imageIndex === undefined || element.imageIndex < 0;
}

// Get the effective value for a property (override or base)
export function getEffectiveValue<T>(
  element: TextElement,
  imageIndex: number,
  key: keyof Omit<TextElement, 'id' | 'style' | 'overrides' | 'imageIndex' | 'createdAt'>,
  defaultValue: T
): T {
  if (element.overrides) {
    const override = element.overrides[imageIndex];
    if (override && key in override) {
      return override[key as keyof TextElementOverrides] as T;
    }
  }
  return element[key] as unknown as T;
}

// Get the effective style (merged override with base style)
export function getEffectiveStyle(
  element: TextElement,
  imageIndex: number
): TextElementStyle {
  if (element.overrides) {
    const override = element.overrides[imageIndex];
    if (override?.style) {
      return { ...element.style, ...override.style };
    }
  }
  return element.style;
}

// Check if an element has overrides for a specific image
export function hasOverridesForImage(element: TextElement, imageIndex: number): boolean {
  return element.overrides ? imageIndex in element.overrides : false;
}