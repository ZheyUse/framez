'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UploadedImage } from '@/types/editor';

interface TemplatePreviewProps {
  templateDataURL: string;
  templateWidth: number;
  templateHeight: number;
  activeImage: UploadedImage | null;
  total: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function TemplatePreview({
  templateDataURL,
  templateWidth,
  templateHeight,
  activeImage,
  total,
  activeIndex,
  onPrev,
  onNext,
}: TemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 338 });

  // Calculate canvas size based on template dimensions, constrained to max width
  useEffect(() => {
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 600;

    if (templateWidth && templateHeight) {
      const templateRatio = templateWidth / templateHeight;

      // Scale down to fit within max dimensions while maintaining aspect ratio
      let width = templateWidth;
      let height = templateHeight;

      if (width > MAX_WIDTH) {
        width = MAX_WIDTH;
        height = width / templateRatio;
      }

      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT;
        width = height * templateRatio;
      }

      // Round to integers
      width = Math.round(width);
      height = Math.round(height);

      setCanvasSize({ width, height });
    }
  }, [templateWidth, templateHeight]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const draw = async () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        const [tmpl] = await Promise.all([loadImg(templateDataURL)]);

        // Draw template at full canvas size
        ctx.drawImage(tmpl, 0, 0, canvas.width, canvas.height);

        // If there's a photo, draw it on top
        if (activeImage) {
          const [photo] = await Promise.all([loadImg(activeImage.dataURL)]);

          // Layer: user photo, contain-fit (entire photo visible, letterboxed)
          // Since template is drawn first, photo will be "under" or show through transparent areas
          const photoRatio = photo.naturalWidth / photo.naturalHeight;
          const canvasRatio = canvas.width / canvas.height;
          let dw: number, dh: number;

          if (photoRatio > canvasRatio) {
            // Photo is wider - fit to width
            dw = canvas.width;
            dh = dw / photoRatio;
          } else {
            // Photo is taller - fit to height
            dh = canvas.height;
            dw = dh * photoRatio;
          }

          // Center the photo within the canvas
          const offsetX = (canvas.width - dw) / 2;
          const offsetY = (canvas.height - dh) / 2;
          ctx.drawImage(photo, offsetX, offsetY, dw, dh);

          // Re-draw template on top so it overlays the photo
          ctx.drawImage(tmpl, 0, 0, canvas.width, canvas.height);
        } else {
          // No photo - draw text to indicate where photos will appear
          ctx.fillStyle = 'rgba(10, 10, 10, 0.6)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#ffffff';
          ctx.font = '16px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Upload photos below to preview', canvas.width / 2, canvas.height / 2);
        }
      } catch {
        console.error('Failed to draw image');
      }
    };

    draw();
  }, [templateDataURL, activeImage, canvasSize]);

  return (
    <div className="mb-8">
      <div className="max-w-[600px] w-full mx-auto rounded-xl overflow-hidden bg-[#111111] border border-[#2a2a2a]">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
        />
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={onPrev}
            disabled={activeIndex === 0}
            className="p-2 rounded-lg border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span
            className="text-[#aaff00] min-w-[80px] text-center"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {activeIndex + 1} / {total}
          </span>

          <button
            onClick={onNext}
            disabled={activeIndex === total - 1}
            className="p-2 rounded-lg border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}