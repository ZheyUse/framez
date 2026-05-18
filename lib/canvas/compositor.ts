// CORE: pixel-perfect compositing. NEVER use html2canvas.

import { TextElement, isGlobalText } from '@/types/textElement';
import { loadFont } from '@/lib/canvas/fontLoader';

// Helper to resolve text element values for a specific image
export function resolveTextForImage(element: TextElement, imageIndex: number): TextElement {
  if (isGlobalText(element) && element.overrides) {
    const override = element.overrides[imageIndex];
    if (override) {
      return {
        ...element,
        text: override.text ?? element.text,
        x: override.x ?? element.x,
        y: override.y ?? element.y,
        width: override.width ?? element.width,
        height: override.height ?? element.height,
        style: override.style ? { ...element.style, ...override.style } : element.style,
      };
    }
  }
  return element;
}

export interface CompositorInput {
  photoDataURL: string;
  templateDataURL: string;
  outputWidth: number;
  outputHeight: number;
  format: 'png' | 'jpeg';
  quality: number;
  textElements?: TextElement[];
  canvasWidth?: number;
  canvasHeight?: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}


export async function compositeImage(input: CompositorInput): Promise<Blob> {
  const { photoDataURL, templateDataURL, outputWidth, outputHeight, format, quality, textElements, canvasWidth = 600, canvasHeight = 338 } = input;

  // Calculate scale factors to map from canvas dimensions to output dimensions
  const scaleX = outputWidth / canvasWidth;
  const scaleY = outputHeight / canvasHeight;
  const [photo, tmpl] = await Promise.all([loadImg(photoDataURL), loadImg(templateDataURL)]);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  // Layer 1 (BOTTOM): user photo, cover-fit
  const photoRatio = photo.naturalWidth / photo.naturalHeight;
  const canvasRatio = outputWidth / outputHeight;
  let dw: number, dh: number;

  if (photoRatio > canvasRatio) {
    dh = outputHeight;
    dw = dh * photoRatio;
  } else {
    dw = outputWidth;
    dh = dw / photoRatio;
  }
  ctx.drawImage(photo, (outputWidth - dw) / 2, (outputHeight - dh) / 2, dw, dh);

  // Layer 2 (TOP): template overlay — always full canvas
  ctx.drawImage(tmpl, 0, 0, outputWidth, outputHeight);

  // Layer 3 (TEXT): if text elements provided
  if (textElements && textElements.length > 0) {
    const uniqueFonts = Array.from(new Set(textElements.map((el) => el.style.fontFamily)));
    uniqueFonts.forEach(loadFont);
    if (typeof document !== 'undefined' && document.fonts) {
      await Promise.all(
        uniqueFonts.map((font) => document.fonts.load(`16px "${font}"`))
      );
      await document.fonts.ready;
    }

    let renderedWithFabric = false;

    try {
      const fabricModule = await import('fabric');
      const fs = fabricModule as unknown as {
        StaticCanvas: new (el: HTMLCanvasElement, options?: Record<string, unknown>) => {
          add: (...objects: unknown[]) => void;
          renderAll: () => void;
        };
        IText: new (text: string, options?: Record<string, unknown>) => unknown;
      };

      const offscreen = document.createElement('canvas');
      offscreen.width = outputWidth;
      offscreen.height = outputHeight;
      const textCanvas = new fs.StaticCanvas(offscreen, {
        width: outputWidth,
        height: outputHeight,
      });

      for (const element of textElements) {
        const { text, x, y, width, height, style } = element;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;
        const fontSize = style.fontSize * scaleX;

        const textObj = new fs.IText(text, {
          left: scaledX,
          top: scaledY,
          width: scaledWidth,
          height: scaledHeight,
          fontFamily: style.fontFamily,
          fontSize,
          fontWeight: String(style.fontWeight || 400),
          fontStyle: style.fontStyle,
          fill: style.fill,
          underline: style.textDecoration === 'underline',
          linethrough: style.textDecoration === 'line-through',
          textAlign: style.textAlign,
          lineHeight: style.lineHeight,
          charSpacing: (style.letterSpacing / style.fontSize) * 1000,
          originX: 'left',
          originY: 'top',
        });

        textCanvas.add(textObj);
      }

      textCanvas.renderAll();
      ctx.drawImage(offscreen, 0, 0);
      renderedWithFabric = true;
    } catch {
      renderedWithFabric = false;
    }

    if (!renderedWithFabric) {
      for (const element of textElements) {
        await renderTextOnCanvas(ctx, element, scaleX, scaleY);
      }
    }
  }

  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('toBlob failed'))),
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality,
    ),
  );
}

// Helper to render text on canvas
async function renderTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  scaleX: number,
  scaleY: number
): Promise<void> {
  const { text, x, y, width, height, style } = element;

  // Scale position and size from canvas coordinates to output coordinates
  const scaledX = x * scaleX;
  const scaledY = y * scaleY;
  const scaledWidth = width * scaleX;
  const scaledHeight = height * scaleY;

  // Set font with scaled font size
  const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
  const fontWeight = String(style.fontWeight || 400);
  const fontSize = style.fontSize * scaleX; // Scale by X since fonts are sized relative to canvas width in editor

  try {
    ctx.font = `${fontStyle}${fontWeight} ${fontSize}px "${style.fontFamily}", sans-serif`;
  } catch {
    ctx.font = `${fontStyle}${fontWeight} ${fontSize}px sans-serif`;
  }

  ctx.fillStyle = style.fill;
  ctx.textBaseline = 'top';

  // Set text alignment
  let textAlign: CanvasTextAlign = 'left';
  if (style.textAlign === 'center') textAlign = 'center';
  else if (style.textAlign === 'right') textAlign = 'right';
  ctx.textAlign = textAlign;

  // Apply scaled padding
  const paddingLeft = style.padding[3] * scaleX;
  const paddingTop = style.padding[0] * scaleY;
  const paddingRight = style.padding[1] * scaleX;

  // Calculate scaled text position (include padding for left alignment)
  let textX: number;
  if (style.textAlign === 'center') {
    textX = scaledX + scaledWidth / 2;
  } else if (style.textAlign === 'right') {
    textX = scaledX + scaledWidth - paddingRight;
  } else {
    textX = scaledX + paddingLeft;
  }

  // Apply letter spacing if supported (scale by scaleX)
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${style.letterSpacing * scaleX}px`;
  }

  // Wrap text to fit within bounds
  const maxWidth = scaledWidth - paddingLeft - paddingRight;
  const lines = wrapText(ctx, text, maxWidth, fontSize, style.lineHeight);

  // Match Fabric's top-aligned text positioning
  const startY = scaledY + paddingTop;

  let currentY = startY;

  // Draw each line
  for (const line of lines) {
    // Apply text transform
    let displayText = line;
    switch (style.textTransform) {
      case 'uppercase':
        displayText = line.toUpperCase();
        break;
      case 'lowercase':
        displayText = line.toLowerCase();
        break;
      case 'capitalize':
        displayText = line
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
    }

    ctx.fillText(displayText, textX, currentY);
    currentY += style.lineHeight * fontSize;

    // Draw underline or strikethrough
    if (style.textDecoration === 'underline' || style.textDecoration === 'line-through') {
      const metrics = ctx.measureText(displayText);
      const textWidth = metrics.width;
      let decorX1: number, decorX2: number;
      if (style.textAlign === 'center') {
        decorX1 = textX - textWidth / 2;
        decorX2 = textX + textWidth / 2;
      } else if (style.textAlign === 'right') {
        decorX1 = textX - textWidth;
        decorX2 = textX;
      } else {
        decorX1 = textX;
        decorX2 = textX + textWidth;
      }

      ctx.beginPath();
      if (style.textDecoration === 'underline') {
        const underlineY = currentY + fontSize + fontSize * 0.12;
        ctx.moveTo(decorX1, underlineY);
        ctx.lineTo(decorX2, underlineY);
      } else {
        const strikeY = currentY + fontSize * 0.55;
        ctx.moveTo(decorX1, strikeY);
        ctx.lineTo(decorX2, strikeY);
      }
      ctx.strokeStyle = style.fill;
      ctx.lineWidth = Math.max(1, fontSize / 16);
      ctx.stroke();
    }
  }

  // Reset letter spacing
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = 'normal';
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  lineHeight: number
): string[] {
  if (maxWidth <= 0) return [text];

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

// Single image download (no zip)
export async function downloadSingleImage(
  photoDataURL: string,
  templateDataURL: string,
  width: number,
  height: number,
  filename: string,
): Promise<void> {
  const blob = await compositeImage({
    photoDataURL,
    templateDataURL,
    outputWidth: width,
    outputHeight: height,
    format: 'png',
    quality: 1,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.[^.]+$/, '') + '_framed.png';
  a.click();
  URL.revokeObjectURL(url);
}