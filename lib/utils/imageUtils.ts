export function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = src;
  });
}

export function createThumbnail(dataURL: string, maxSize: number): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataURL;
  });
}

export const validateTemplateFile = (f: File) =>
  ['image/png', 'image/svg+xml'].includes(f.type);

export const validateImageFile = (f: File) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);