// CORE: pixel-perfect compositing. NEVER use html2canvas.

export interface CompositorInput {
  photoDataURL: string;
  templateDataURL: string;
  outputWidth: number;
  outputHeight: number;
  format: 'png' | 'jpeg';
  quality: number;
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
  const { photoDataURL, templateDataURL, outputWidth, outputHeight, format, quality } = input;
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

  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('toBlob failed'))),
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality,
    ),
  );
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