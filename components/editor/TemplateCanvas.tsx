'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TextElement, isGlobalText, getEffectiveStyle, getEffectiveValue } from '@/types/textElement';
import { UploadedImage } from '@/types/editor';
import { Template } from '@/types/template';
import { useTextElementStore } from '@/store/useTextElementStore';
import { loadFont } from '@/lib/canvas/fontLoader';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import fabric to avoid SSR issues
const FabricCanvas = dynamic(() => import('./FabricCanvas'), { ssr: false });

interface TemplateCanvasProps {
  template: Template;
  activeImage: UploadedImage | null;
  total: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

interface CanvasState {
  width: number;
  height: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function TemplateCanvas({
  template,
  activeImage,
  total,
  activeIndex,
  onPrev,
  onNext,
}: TemplateCanvasProps) {
  const [canvasState, setCanvasState] = useState<CanvasState>({ width: 600, height: 338 });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    elements,
    selectedId,
    currentImageIndex,
    selectElement,
    selectAll,
    addElement,
    updateElement,
    deleteElement,
    setCurrentImageIndex,
    getElementsForCurrentImage,
  } = useTextElementStore();

  // Ctrl+A to select all text elements on canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Ctrl+A = Select all text elements
      if (e.ctrlKey && e.key === 'a' && elements.length > 0) {
        e.preventDefault();
        selectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [elements.length, selectAll]);

  // Update current image index when activeIndex changes
  useEffect(() => {
    setCurrentImageIndex(activeIndex);
  }, [activeIndex, setCurrentImageIndex]);

  // Calculate canvas size based on template dimensions
  useEffect(() => {
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 600;

    if (template.width && template.height) {
      const templateRatio = template.width / template.height;

      let width = template.width;
      let height = template.height;

      if (width > MAX_WIDTH) {
        width = MAX_WIDTH;
        height = width / templateRatio;
      }

      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT;
        width = height * templateRatio;
      }

      width = Math.round(width);
      height = Math.round(height);

      setCanvasState({ width, height });
    }
  }, [template.width, template.height]);

  // Composite template + image into single background
  useEffect(() => {
    const compositeBackground = async () => {
      try {
        const [tmpl] = await Promise.all([loadImg(template.dataURL)]);

        const canvas = document.createElement('canvas');
        canvas.width = canvasState.width;
        canvas.height = canvasState.height;
        const ctx = canvas.getContext('2d')!;

        // Fill with dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw template
        ctx.drawImage(tmpl, 0, 0, canvas.width, canvas.height);

        // If there's a photo, draw it
        if (activeImage) {
          const [photo] = await Promise.all([loadImg(activeImage.dataURL)]);

          const photoRatio = photo.naturalWidth / photo.naturalHeight;
          const canvasRatio = canvas.width / canvas.height;
          let dw: number, dh: number;

          if (photoRatio > canvasRatio) {
            dw = canvas.width;
            dh = dw / photoRatio;
          } else {
            dh = canvas.height;
            dw = dh * photoRatio;
          }

          const offsetX = (canvas.width - dw) / 2;
          const offsetY = (canvas.height - dh) / 2;
          ctx.drawImage(photo, offsetX, offsetY, dw, dh);

          // Re-draw template on top
          ctx.drawImage(tmpl, 0, 0, canvas.width, canvas.height);
        }

        setBackgroundImage(canvas.toDataURL());
        setIsReady(true);
      } catch (e) {
        console.error('Failed to composite background:', e);
        setIsReady(true);
      }
    };

    compositeBackground();
  }, [template.dataURL, activeImage, canvasState.width, canvasState.height]);

  // Load fonts for all text elements
  useEffect(() => {
    const fontsToLoad = elements.map((el) => el.style.fontFamily);
    fontsToLoad.forEach(loadFont);
  }, [elements]);

  // Get elements visible for current image with resolved values
  const currentElements = getElementsForCurrentImage().map((el) => {
    // If element is global and has override for this image, merge override
    if (isGlobalText(el) && el.overrides && currentImageIndex in el.overrides) {
      const override = el.overrides[currentImageIndex];
      return {
        ...el,
        text: override.text ?? el.text,
        x: override.x ?? el.x,
        y: override.y ?? el.y,
        width: override.width ?? el.width,
        height: override.height ?? el.height,
        style: { ...el.style, ...override.style },
      } as TextElement;
    }
    return el;
  });

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // If clicking on the canvas background (not a text object), deselect
      if (e.target === e.currentTarget) {
        selectElement(null);
      }
    },
    [selectElement]
  );

  const handleAddText = useCallback(() => {
    const id = addElement({
      text: 'Add your text',
      templateId: template.id,
      x: canvasState.width / 2 - 150,
      y: canvasState.height / 2 - 30,
    });

    // Load the default font
    loadFont('Space Grotesk');

    return id;
  }, [addElement, template.id, canvasState.width, canvasState.height]);

  const handleUpdateTextElement = useCallback(
    (id: string, changes: Partial<TextElement>) => {
      updateElement(id, changes);
    },
    [updateElement]
  );

  const handleDeleteTextElement = useCallback(
    (id: string) => {
      deleteElement(id);
      selectElement(null);
    },
    [deleteElement, selectElement]
  );

  return (
    <div className="mb-8">
      <div
        className="max-w-[800px] w-full mx-auto rounded-xl overflow-hidden bg-[#111111] border border-[#2a2a2a] relative"
        onClick={handleCanvasClick}
      >
        {/* Canvas container */}
        <div
          className="relative"
          style={{ width: canvasState.width, height: canvasState.height }}
        >
          {/* Background image (template + photo composite) */}
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Template background"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ backgroundColor: '#0a0a0a' }}
            />
          )}

          {/* Fabric.js canvas overlay for text */}
          {isReady && (
            <div className="absolute inset-0">
              <FabricCanvas
                elements={currentElements}
                selectedId={selectedId}
                canvasWidth={canvasState.width}
                canvasHeight={canvasState.height}
                onSelectElement={selectElement}
                onUpdateElement={handleUpdateTextElement}
                onDeleteElement={handleDeleteTextElement}
              />
            </div>
          )}

          {/* Empty state */}
          {!activeImage && !isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/60">
              <p
                className="text-white/60 text-sm"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                Upload photos below to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation controls */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={activeIndex === 0}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <span
            className="text-[#aaff00] min-w-[80px] text-center"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {activeIndex + 1} / {total}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={activeIndex === total - 1}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}