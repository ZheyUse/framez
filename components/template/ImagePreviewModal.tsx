'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UploadedImage } from '@/types/editor';
import { downloadSingleImage } from '@/lib/canvas/compositor';

interface ImagePreviewModalProps {
  image: UploadedImage | null;
  templateDataURL: string;
  templateWidth: number;
  templateHeight: number;
  open: boolean;
  onClose: () => void;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function ImagePreviewModal({
  image,
  templateDataURL,
  templateWidth,
  templateHeight,
  open,
  onClose,
}: ImagePreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null);

  // Update current image when image prop changes
  useEffect(() => {
    if (image) {
      setCurrentImage(image);
    }
  }, [image]);

  // Calculate canvas size based on template dimensions
  const MAX_WIDTH = 700;
  const MAX_HEIGHT = 450;

  const canvasWidth = templateWidth && templateHeight ? Math.min(templateWidth, MAX_WIDTH) : 600;
  const canvasHeight = templateWidth && templateHeight
    ? Math.round(templateHeight * (canvasWidth / templateWidth))
    : 400;

  // Ensure we cap height too
  const finalCanvasHeight = Math.min(canvasHeight, MAX_HEIGHT);
  const finalCanvasWidth = Math.round(canvasWidth * (finalCanvasHeight / canvasHeight));

  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current || !currentImage || !open) return;

    const canvas = canvasRef.current;
    canvas.width = finalCanvasWidth;
    canvas.height = finalCanvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const [photo, tmpl] = await Promise.all([
        loadImg(currentImage.dataURL),
        loadImg(templateDataURL),
      ]);

      // Layer 1 (BOTTOM): user photo, contain-fit (entire photo visible, letterboxed)
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

      // Layer 2 (TOP): template overlay
      ctx.drawImage(tmpl, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.error('Failed to draw image:', e);
    }
  }, [currentImage, templateDataURL, open, finalCanvasWidth, finalCanvasHeight]);

  // Draw when image changes or modal opens
  useEffect(() => {
    if (open && currentImage) {
      // Small delay to ensure canvas DOM is ready
      const timer = setTimeout(drawCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [open, currentImage, drawCanvas]);

  const handleDownload = async () => {
    if (!currentImage) return;
    await downloadSingleImage(
      currentImage.dataURL,
      templateDataURL,
      currentImage.width,
      currentImage.height,
      currentImage.name,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Image Preview</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center bg-[#0a0a0a] rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[50vh] w-auto h-auto"
            style={{ display: 'block' }}
          />
        </div>

        {currentImage && (
          <div className="flex items-center justify-between mt-4">
            <div>
              <p
                className="text-white"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                {currentImage.name}
              </p>
              <p className="text-[#a0a0a0] text-sm" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                {currentImage.width} × {currentImage.height} px
              </p>
            </div>

            <Button
              onClick={handleDownload}
              className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download this image
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}