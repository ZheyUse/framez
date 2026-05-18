import googleFonts from './googleFonts.json';

interface FontInfo {
  name: string;
  category: string;
  weights: string[];
}

export const FONTS = googleFonts as FontInfo[];

const loadedFonts = new Set<string>();
let googleFontsLinkId: string | null = null;

export function getGoogleFontsUrl(fonts: string[]): string {
  if (fonts.length === 0) return '';

  const families = fonts.map((fontName) => {
    const font = FONTS.find((f) => f.name === fontName);
    const weights = font?.weights || ['400'];
    const w = weights.join(';');
    return `family=${encodeURIComponent(fontName)}:wght@${w}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

export function loadFont(fontName: string): void {
  if (loadedFonts.has(fontName)) return;

  loadedFonts.add(fontName);
  const url = getGoogleFontsUrl(Array.from(loadedFonts));

  if (!googleFontsLinkId) {
    const existingLink = document.getElementById('google-fonts');
    if (existingLink) {
      googleFontsLinkId = 'google-fonts';
    }
  }

  if (googleFontsLinkId) {
    const link = document.getElementById(googleFontsLinkId);
    if (link) {
      link.setAttribute('href', url);
    }
  } else {
    const link = document.createElement('link');
    link.id = 'google-fonts';
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    googleFontsLinkId = 'google-fonts';
  }
}

export function loadFonts(fontNames: string[]): void {
  fontNames.forEach(loadFont);
}

export function searchFonts(query: string, category?: string): FontInfo[] {
  const lowercaseQuery = query.toLowerCase();

  return FONTS.filter((font) => {
    const matchesQuery = font.name.toLowerCase().includes(lowercaseQuery);
    const matchesCategory = !category || font.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function getFontCategories(): string[] {
  return [...new Set(FONTS.map((f) => f.category))];
}

export function getFontByName(name: string): FontInfo | undefined {
  return FONTS.find((f) => f.name === name);
}

export const DEFAULT_FONTS = ['Space Grotesk', 'Montserrat', 'Playfair Display', 'Roboto', 'Poppins'];

export const COMMON_FONT_SIZES = [12, 14, 16, 18, 24, 32, 48, 64, 72, 96, 128];

export const DEFAULT_FONT = 'Space Grotesk';
export const DEFAULT_FONT_SIZE = 48;
export const DEFAULT_FONT_COLOR = '#ffffff';