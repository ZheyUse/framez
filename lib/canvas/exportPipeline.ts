import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { compositeImage, resolveTextForImage } from './compositor';
import { UploadedImage } from '@/types/editor';
import { Template } from '@/types/template';
import { TextElement } from '@/types/textElement';

export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality: number;
}

export async function runBatchExport(
  images: UploadedImage[],
  template: Template,
  options: ExportOptions,
  onProgress: (done: number, total: number) => void,
  cancelRef: { cancelled: boolean },
  textElements?: TextElement[],
  canvasWidth?: number,
  canvasHeight?: number,
): Promise<void> {
  const zip = new JSZip();
  const ext = options.format === 'jpeg' ? 'jpg' : 'png';

  for (let i = 0; i < images.length; i++) {
    // Check cancellation BEFORE processing next image
    if (cancelRef.cancelled) {
      return;
    }

    const img = images[i];

    // Resolve text elements for this image (apply overrides)
    const resolvedElements = textElements?.map((el) => resolveTextForImage(el, i)) || [];

    const outputWidth = template.width || img.width;
    const outputHeight = template.height || img.height;
    const blob = await compositeImage({
      photoDataURL: img.dataURL,
      templateDataURL: template.dataURL,
      outputWidth,
      outputHeight,
      format: options.format,
      quality: options.quality,
      textElements: resolvedElements.length > 0 ? resolvedElements : undefined,
      canvasWidth,
      canvasHeight,
    });

    // Check again after async operation - if cancelled, don't add to zip
    if (cancelRef.cancelled) {
      return;
    }

    const name = `${String(i + 1).padStart(4, '0')}_${img.name.replace(/\.[^.]+$/, '')}.${ext}`;
    zip.file(name, blob);
    onProgress(i + 1, images.length);

    // Yield to UI thread every 10 images to prevent freeze
    if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${template.name}.zip`);
}