/**
 * Color conversion and manipulation utilities
 * Optimized for performance with memoization where appropriate
 */

// Cache for expensive color calculations
const colorCache = new Map<string, {
  hsl: [number, number, number],
  harmony: string[]
}>();

/**
 * Converts a hex color to HSL values
 * @param hex Hex color string (e.g., "#FF0000")
 * @returns [hue, saturation, lightness]
 */
export function hexToHsl(hex: string): [number, number, number] {
  // Check cache first
  if (colorCache.has(hex)) {
    return colorCache.get(hex)!.hsl;
  }

  // Convert hex to RGB
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  const hsl: [number, number, number] = [
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100)
  ];

  // Cache the result
  colorCache.set(hex, {
    hsl,
    harmony: [] // Will be populated when getHarmonyColors is called
  });

  return hsl;
}

/**
 * Converts HSL values to a hex color string
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param l Lightness (0-100)
 * @returns Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  const hex = `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  
  // Cache the HSL values for this hex
  if (!colorCache.has(hex)) {
    colorCache.set(hex, {
      hsl: [h, s * 100, l * 100],
      harmony: []
    });
  }

  return hex;
}

/**
 * Generates harmony colors for a given hex color
 * @param hex Hex color string
 * @returns Array of harmony color hex strings
 */
export function getHarmonyColors(hex: string): string[] {
  // Check cache first
  if (colorCache.has(hex) && colorCache.get(hex)!.harmony.length > 0) {
    return colorCache.get(hex)!.harmony;
  }

  const [h, s, l] = hexToHsl(hex);
  
  // Generate complementary, analogous, and triadic colors
  const harmony = [
    // Complementary
    hslToHex((h + 180) % 360, s, l),
    // Analogous
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h - 30 + 360) % 360, s, l),
    // Triadic
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l)
  ];

  // Cache the harmony colors
  if (colorCache.has(hex)) {
    colorCache.get(hex)!.harmony = harmony;
  }

  return harmony;
}

/**
 * Preset color palettes
 */
export const PRESET_COLORS = {
  'Primary': [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF'  // Cyan
  ],
  'Neutral': [
    '#000000', // Black
    '#404040', // Dark Gray
    '#808080', // Medium Gray
    '#C0C0C0', // Light Gray
    '#FFFFFF'  // White
  ],
  'Material': [
    '#F44336', // Red
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FFEB3B', // Yellow
    '#9C27B0', // Purple
    '#FF9800'  // Orange
  ]
} as const;

/**
 * Cleans up the color cache
 * Call this when the color picker is unmounted
 */
export function clearColorCache(): void {
  colorCache.clear();
}

/**
 * Validates a hex color string
 * @param hex Hex color string to validate
 * @returns boolean indicating if the hex color is valid
 */
export function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Adjusts the lightness of a hex color
 * @param hex Hex color string
 * @param amount Amount to adjust lightness by (-100 to 100)
 * @returns New hex color string
 */
export function adjustLightness(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + amount)));
}