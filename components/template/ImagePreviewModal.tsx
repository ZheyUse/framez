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
import { TextElement } from '@/types/textElement';
import { compositeImage, resolveTextForImage } from '@/lib/canvas/compositor';

interface ImagePreviewModalProps {
  image: UploadedImage | null;
  imageIndex: number;
  templateDataURL: string;
  templateWidth: number;
  templateHeight: number;
  templateOnTop?: boolean;
  textElements: TextElement[];
  open: boolean;
  onClose: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function ImagePreviewModal({
  image,
  imageIndex,
  templateDataURL,
  templateWidth,
  templateHeight,
  templateOnTop = true,
  textElements,
  open,
  onClose,
  canvasWidth: editorCanvasWidth,
  canvasHeight: editorCanvasHeight,
}: ImagePreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentImage, setCurrentImage] = useState<UploadedImage | null>(null);

  // Update current image when image prop changes
  useEffect(() => {
    if (image) {
      setCurrentImage(image);
    }
  }, [image]);

  // Calculate canvas size based on template dimensions (for display)
  const MAX_WIDTH = 700;
  const MAX_HEIGHT = 450;

  const displayWidth = templateWidth && templateHeight ? Math.min(templateWidth, MAX_WIDTH) : 600;
  const displayHeight = templateWidth && templateHeight
    ? Math.round(templateHeight * (displayWidth / templateWidth))
    : 400;

  // Ensure we cap height too
  const finalCanvasHeight = Math.min(displayHeight, MAX_HEIGHT);
  const finalCanvasWidth = Math.round(displayWidth * (finalCanvasHeight / displayHeight));

  // Draw using compositor for proper text rendering
  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current || !currentImage || !open) return;

    const canvas = canvasRef.current;
    canvas.width = finalCanvasWidth;
    canvas.height = finalCanvasHeight;

    // Resolve text elements for this specific image
    const resolvedElements = textElements
      .map(el => resolveTextForImage(el, imageIndex))
      .filter(el => {
        // Filter out individual elements that don't apply to this image
        const isGlobal = el.imageIndex === undefined || el.imageIndex < 0;
        return isGlobal || el.imageIndex === imageIndex;
      });

    try {
      const blob = await compositeImage({
        photoDataURL: currentImage.dataURL,
        templateDataURL,
        outputWidth: finalCanvasWidth,
        outputHeight: finalCanvasHeight,
        format: 'png',
        quality: 1,
        textElements: resolvedElements,
        canvasWidth: editorCanvasWidth,
        canvasHeight: editorCanvasHeight,
        templateOnTop,
      });

      const url = URL.createObjectURL(blob);
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, finalCanvasWidth, finalCanvasHeight);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error('Failed to composite image:', e);
    }
  }, [currentImage, imageIndex, textElements, templateDataURL, finalCanvasWidth, finalCanvasHeight, open, editorCanvasWidth, editorCanvasHeight]);

  // Redraw when dependencies change
  useEffect(() => {
    if (open && currentImage) {
      const timer = setTimeout(drawCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [open, currentImage, drawCanvas]);

  const handleDownload = async () => {
    if (!currentImage) return;

    // Resolve text elements for this specific image
    const resolvedElements = textElements
      .map(el => resolveTextForImage(el, imageIndex))
      .filter(el => {
        const isGlobal = el.imageIndex === undefined || el.imageIndex < 0;
        return isGlobal || el.imageIndex === imageIndex;
      });

    const outputWidth = templateWidth || currentImage.width;
    const outputHeight = templateHeight || currentImage.height;
    const blob = await compositeImage({
      photoDataURL: currentImage.dataURL,
      templateDataURL,
      outputWidth,
      outputHeight,
      format: 'png',
      quality: 1,
      textElements: resolvedElements,
      canvasWidth: editorCanvasWidth,
      canvasHeight: editorCanvasHeight,
      templateOnTop,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentImage.name.replace(/\.[^.]+$/, '') + '_framed.png';
    a.click();
    URL.revokeObjectURL(url);
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