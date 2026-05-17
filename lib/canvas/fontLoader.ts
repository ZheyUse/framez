const GOOGLE_FONTS = [
  // Sans-serif popular
  { name: 'Space Grotesk', category: 'sans-serif', weights: ['700'] },
  { name: 'Montserrat', category: 'sans-serif', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Poppins', category: 'sans-serif', weights: ['400', '500', '600', '700', '800'] },
  { name: 'Inter', category: 'sans-serif', weights: ['400', '500', '600', '700', '800'] },
  { name: 'Roboto', category: 'sans-serif', weights: ['400', '500', '700', '900'] },
  { name: 'Open Sans', category: 'sans-serif', weights: ['400', '500', '600', '700', '800'] },
  { name: 'Lato', category: 'sans-serif', weights: ['400', '700', '900'] },
  { name: 'Oswald', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
  { name: 'Raleway', category: 'sans-serif', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Nunito', category: 'sans-serif', weights: ['400', '600', '700', '800'] },
  { name: 'Quicksand', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
  { name: 'DM Sans', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
  { name: 'Rubik', category: 'sans-serif', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Karla', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
  { name: 'Manrope', category: 'sans-serif', weights: ['400', '500', '600', '700', '800'] },

  // Serif
  { name: 'Playfair Display', category: 'serif', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Merriweather', category: 'serif', weights: ['400', '700', '900'] },
  { name: 'Lora', category: 'serif', weights: ['400', '500', '600', '700'] },
  { name: 'Crimson Text', category: 'serif', weights: ['400', '600', '700'] },
  { name: 'Libre Baskerville', category: 'serif', weights: ['400', '700'] },
  { name: 'Cormorant Garamond', category: 'serif', weights: ['400', '500', '600', '700'] },
  { name: 'EB Garamond', category: 'serif', weights: ['400', '500', '600', '700', '800'] },
  { name: 'Bitter', category: 'serif', weights: ['400', '500', '600', '700', '800', '900'] },

  // Display/Impact
  { name: 'Bebas Neue', category: 'display', weights: ['400'] },
  { name: 'Anton', category: 'display', weights: ['400'] },
  { name: 'Archivo Black', category: 'display', weights: ['400'] },
  { name: 'Righteous', category: 'display', weights: ['400'] },
  { name: 'Permanent Marker', category: 'handwriting', weights: ['400'] },
  { name: 'Pacifico', category: 'handwriting', weights: ['400'] },
  { name: 'Dancing Script', category: 'handwriting', weights: ['400', '500', '600', '700'] },
  { name: 'Satisfy', category: 'handwriting', weights: ['400'] },
  { name: 'Great Vibes', category: 'handwriting', weights: ['400'] },
  { name: 'Caveat', category: 'handwriting', weights: ['400', '500', '600', '700'] },
  { name: 'Sacramento', category: 'handwriting', weights: ['400'] },
  { name: 'Leckerli One', category: 'handwriting', weights: ['400'] },

  // Monospace
  { name: 'Space Mono', category: 'monospace', weights: ['400', '700'] },
  { name: 'Fira Code', category: 'monospace', weights: ['400', '500', '600', '700'] },
  { name: 'Source Code Pro', category: 'monospace', weights: ['400', '500', '600', '700'] },

  // Condensed
  { name: 'Barlow Condensed', category: 'sans-serif', weights: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Teko', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
  { name: 'Fjalla One', category: 'sans-serif', weights: ['400'] },
];

interface FontInfo {
  name: string;
  category: string;
  weights: string[];
}

export const FONTS = GOOGLE_FONTS as FontInfo[];

const loadedFonts = new Set<string>();
let googleFontsLinkId: string | null = null;

export function getGoogleFontsUrl(fonts: string[]): string {
  if (fonts.length === 0) return '';

  const families = fonts.map((fontName) => {
    const font = FONTS.find((f) => f.name === fontName);
    const weights = font?.weights || ['400'];
    const w = weights.join(';');
    return `family=${encodeURIComponent(fontName)}:${w}`;
  });

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

export function loadFont(fontName: string): void {
  if (loadedFonts.has(fontName)) return;

  const url = getGoogleFontsUrl([fontName]);

  if (!googleFontsLinkId) {
    const existingLink = document.getElementById('google-fonts');
    if (existingLink) {
      googleFontsLinkId = 'google-fonts';
    }
  }

  if (googleFontsLinkId) {
    const link = document.getElementById(googleFontsLinkId);
    if (link) {
      const currentHref = link.getAttribute('href') || '';
      const baseUrl = currentHref.split('&family=')[0];
      const newHref = baseUrl ? `${baseUrl}&family=${encodeURIComponent(fontName)}:400;700` : url;
      link.setAttribute('href', newHref);
    }
  } else {
    const link = document.createElement('link');
    link.id = 'google-fonts';
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    googleFontsLinkId = 'google-fonts';
  }

  loadedFonts.add(fontName);
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