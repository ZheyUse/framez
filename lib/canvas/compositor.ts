// CORE: pixel-perfect compositing. NEVER use html2canvas.

import { TextElement, isGlobalText } from '@/types/textElement';

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
  const { photoDataURL, templateDataURL, outputWidth, outputHeight, format, quality, textElements } = input;
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
    for (const element of textElements) {
      await renderTextOnCanvas(ctx, element, outputWidth, outputHeight);
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
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  const { text, x, y, width, height, style } = element;

  // Calculate scale factors based on original dimensions
  const elementScaleX = canvasWidth / width;
  const elementScaleY = canvasHeight / height;

  // Handle case where element dimensions might be 0
  const safeScaleX = elementScaleX > 0 ? elementScaleX : 1;
  const safeScaleY = elementScaleY > 0 ? elementScaleY : 1;
  const scale = Math.min(safeScaleX, safeScaleY);

  // Scale position and size from element coordinates to canvas coordinates
  const scaledX = x;
  const scaledY = y;
  const scaledWidth = width;
  const scaledHeight = height;

  // Set font
  const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';
  const fontWeight = style.fontWeight >= 600 ? 'bold' : 'normal';
  const fontSize = style.fontSize * scale;

  try {
    ctx.font = `${fontStyle}${fontWeight} ${fontSize}px "${style.fontFamily}", sans-serif`;
  } catch {
    // Fallback if font loading failed
    ctx.font = `${fontStyle}${fontWeight} ${fontSize}px sans-serif`;
  }

  ctx.fillStyle = style.fill;
  ctx.textBaseline = 'top';

  // Set text alignment
  let textAlign: CanvasTextAlign = 'left';
  if (style.textAlign === 'center') textAlign = 'center';
  else if (style.textAlign === 'right') textAlign = 'right';
  ctx.textAlign = textAlign;

  // Calculate text position
  let textX = scaledX;
  if (style.textAlign === 'center') {
    textX = scaledX + scaledWidth / 2;
  } else if (style.textAlign === 'right') {
    textX = scaledX + scaledWidth;
  }

  // Apply letter spacing if supported
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${style.letterSpacing}px`;
  }

  // Apply padding
  const paddingLeft = style.padding[3];
  const paddingTop = style.padding[0];
  const paddingRight = style.padding[1];

  // Wrap text to fit within bounds
  const maxWidth = scaledWidth - paddingLeft - paddingRight;
  const lines = wrapText(ctx, text, maxWidth, fontSize, style.lineHeight);

  // Calculate start Y for vertical centering within element
  const totalTextHeight = lines.length * style.lineHeight * fontSize;
  const elementHeight = scaledHeight - paddingTop - style.padding[2];
  let startY = scaledY + paddingTop;

  // If tall enough, center vertically
  if (elementHeight > totalTextHeight) {
    startY = scaledY + paddingTop + (elementHeight - totalTextHeight) / 2;
  }

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
    if (style.textDecoration === 'underline') {
      const metrics = ctx.measureText(displayText);
      const underlineY = currentY - 2 * scale;
      ctx.beginPath();
      ctx.moveTo(textX - (style.textAlign === 'right' ? metrics.width : 0), underlineY);
      ctx.lineTo(
        textX + (style.textAlign === 'left' ? metrics.width : style.textAlign === 'center' ? metrics.width / 2 : 0),
        underlineY
      );
      ctx.strokeStyle = style.fill;
      ctx.lineWidth = Math.max(1, fontSize / 16);
      ctx.stroke();
    }

    if (style.textDecoration === 'line-through') {
      const metrics = ctx.measureText(displayText);
      const strikeY = currentY - style.lineHeight * fontSize / 2;
      ctx.beginPath();
      ctx.moveTo(textX - (style.textAlign === 'right' ? metrics.width : 0), strikeY);
      ctx.lineTo(
        textX + (style.textAlign === 'left' ? metrics.width : style.textAlign === 'center' ? metrics.width / 2 : 0),
        strikeY
      );
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