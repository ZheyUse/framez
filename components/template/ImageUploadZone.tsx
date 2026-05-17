'use client';

import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { UploadedImage } from '@/types/editor';
import {
  fileToDataURL,
  getImageDimensions,
  createThumbnail,
  validateImageFile,
} from '@/lib/utils/imageUtils';
import { generateId } from '@/lib/utils/fileUtils';

interface ImageUploadZoneProps {
  onImagesAdded: (imgs: UploadedImage[]) => void;
}

const CHUNK_SIZE = 50;

export function ImageUploadZone({ onImagesAdded }: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [processing, setProcessing] = useState<{ current: number; total: number } | null>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(validateImageFile);
      const invalidCount = fileArray.length - validFiles.length;

      if (invalidCount > 0) {
        toast.error(`${invalidCount} file${invalidCount !== 1 ? 's' : ''} skipped — unsupported format`);
      }

      if (validFiles.length === 0) return;

      setProcessing({ current: 0, total: validFiles.length });

      const processedImages: UploadedImage[] = [];

      for (let i = 0; i < validFiles.length; i += CHUNK_SIZE) {
        const chunk = validFiles.slice(i, i + CHUNK_SIZE);
        const chunkImages = await Promise.all(
          chunk.map(async (file) => {
            const dataURL = await fileToDataURL(file);
            const { width, height } = await getImageDimensions(dataURL);
            const thumb = await createThumbnail(dataURL, 400);

            return {
              id: generateId(),
              file,
              dataURL,
              thumb,
              name: file.name,
              width,
              height,
            } as UploadedImage;
          }),
        );

        processedImages.push(...chunkImages);
        setProcessing({ current: i + chunk.length, total: validFiles.length });
        onImagesAdded(chunkImages);

        // Yield to UI thread
        await new Promise((r) => setTimeout(r, 0));
      }

      setProcessing(null);
    },
    [onImagesAdded],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      e.target.value = '';
    },
    [processFiles],
  );

  const isActive = isDragOver || isHovered;

  return (
    <div>
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${isActive
            ? 'border-[#aaff00] bg-[#aaff00]/5 shadow-[0_0_20px_rgba(170,255,0,0.15)]'
            : 'border-[#2a2a2a] bg-[#111111] hover:border-[#aaff00]/50 hover:bg-[#aaff00]/5'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('image-upload-input')?.click()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <UploadCloud className={`w-10 h-10 transition-all duration-200 ${isActive ? 'text-[#aaff00] scale-110' : 'text-[#aaff00]/70'}`} />
          <div>
            <p
              className="text-white mb-1 transition-colors duration-200"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {processing ? `Processing ${processing.current} / ${processing.total}...` : 'Drop your photos here or click to browse'}
            </p>
            <p
              className="text-[#a0a0a0] text-sm transition-colors duration-200"
              style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              JPG &middot; PNG &middot; WEBP &middot; Supports 1000+ photos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}