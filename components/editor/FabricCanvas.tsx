'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TextElement, TextElementStyle } from '@/types/textElement';
import { loadFont } from '@/lib/canvas/fontLoader';

interface FabricCanvasProps {
  elements: TextElement[];
  selectedId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, changes: Partial<Omit<TextElement, 'style'>> & { style?: Partial<TextElementStyle> }) => void;
  onDeleteElement: (id: string) => void;
}

interface TextObj {
  elementId?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  text?: string;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
}

interface FabricCanvasInstance {
  selectionColor?: string;
  selectionBorderColor?: string;
  selectionLineWidth?: number;
  on: (event: string, handler: (e: Record<string, unknown>) => void) => void;
  dispose?: () => void;
  clear: () => void;
  add: (...objects: TextObj[]) => void;
  remove: (object: TextObj) => void;
  renderAll: () => void;
  setActiveObject: (object: TextObj) => void;
  getObjects: () => TextObj[];
  discardActiveObject: () => void;
  setDimensions: (dims: { width: number; height: number }) => void;
}

export default function FabricCanvas({
  elements,
  selectedId,
  canvasWidth,
  canvasHeight,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvasInstance | null>(null);
  const objectMapRef = useRef<Map<string, TextObj>>(new Map());
  const isUpdatingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Initialize fabric canvas
  useEffect(() => {
    // Skip if already initialized
    if (isInitializedRef.current && fabricCanvasRef.current) {
      // Just update dimensions if canvas exists
      fabricCanvasRef.current.setDimensions({ width: canvasWidth, height: canvasHeight });
      return;
    }

    let fabricCanvas: FabricCanvasInstance | null = null;

    const initCanvas = async () => {
      const fabricModule = await import('fabric');

      if (!canvasRef.current) return;
      if (fabricCanvasRef.current) return; // Already have a canvas

      const fs = fabricModule as unknown as {
        Canvas: new (el: HTMLCanvasElement, options?: Record<string, unknown>) => FabricCanvasInstance;
        IText: new (text: string, options?: Record<string, unknown>) => TextObj;
        Textbox: new (text: string, options?: Record<string, unknown>) => TextObj;
      };

      fabricCanvas = new fs.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      isInitializedRef.current = true;

      // Style the selection border
      fabricCanvas.selectionColor = 'rgba(170, 255, 0, 0.1)';
      fabricCanvas.selectionBorderColor = '#aaff00';
      fabricCanvas.selectionLineWidth = 2;

      // Event handlers
      fabricCanvas.on('selection:created', (e: { selected?: TextObj[] }) => {
        if (e.selected && e.selected.length > 0) {
          const selected = e.selected[0];
          if (selected?.elementId) {
            onSelectElement(selected.elementId);
          }
        }
      });

      fabricCanvas.on('selection:updated', (e: { selected?: TextObj[] }) => {
        if (e.selected && e.selected.length > 0) {
          const selected = e.selected[0];
          if (selected?.elementId) {
            onSelectElement(selected.elementId);
          }
        }
      });

      fabricCanvas.on('selection:cleared', () => {
        onSelectElement(null);
      });

      fabricCanvas.on('object:modified', (e: { target?: TextObj }) => {
        if (isUpdatingRef.current || !e.target) return;

        const target = e.target;
        if (target?.elementId) {
          const scaleX = target.scaleX ?? 1;
          const scaleY = target.scaleY ?? 1;
          const newWidth = (target.width ?? 0) * scaleX;
          const newHeight = (target.height ?? 0) * scaleY;
          const currentFontSize = (target as TextObj & { fontSize?: number }).fontSize ?? 16;
          const scale = (scaleX + scaleY) / 2;
          const newFontSize = Math.max(1, currentFontSize * scale);

          // Apply the scale to dimensions and reset scale to keep model and canvas in sync.
          target.set({
            width: newWidth,
            height: newHeight,
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();

          onUpdateElement(target.elementId, {
            x: target.left ?? 0,
            y: target.top ?? 0,
            width: newWidth,
            height: newHeight,
            style: { fontSize: newFontSize } as Partial<TextElementStyle>,
            angle: target.angle ?? 0,
          });
        }
      });

      fabricCanvas.on('text:changed', (e: { target?: TextObj }) => {
        if (isUpdatingRef.current || !e.target) return;

        const target = e.target;
        if (target?.elementId && target.text !== undefined) {
          onUpdateElement(target.elementId, { text: target.text });
        }
      });

      // Initial render of any existing elements
      updateAllElements(elements);
    };

    initCanvas();

    return () => {
      if (fabricCanvas && typeof fabricCanvas.dispose === 'function') {
        fabricCanvas.dispose();
        fabricCanvasRef.current = null;
        isInitializedRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handle dimension changes separately
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width: canvasWidth, height: canvasHeight });
    }
  }, [canvasWidth, canvasHeight]);

  // Create a text object
  const createTextObject = useCallback(async (element: TextElement): Promise<TextObj | null> => {
    try {
      const fabricModule = await import('fabric');
      const fs = fabricModule as unknown as { Textbox: new (text: string, options?: Record<string, unknown>) => TextObj };

      // Load font before creating text
      loadFont(element.style.fontFamily);

      const text = new fs.Textbox(element.text, {
        left: element.x,
        top: element.y,
        width: element.width,
        fontFamily: element.style.fontFamily,
        fontSize: element.style.fontSize,
        fontWeight: String(element.style.fontWeight),
        fontStyle: element.style.fontStyle,
        fill: element.style.fill,
        underline: element.style.textDecoration === 'underline',
        linethrough: element.style.textDecoration === 'line-through',
        textAlign: element.style.textAlign,
        lineHeight: element.style.lineHeight,
        charSpacing: (element.style.letterSpacing / element.style.fontSize) * 1000,
        originX: 'left',
        originY: 'top',
        splitByGrapheme: false,
      }) as unknown as TextObj;

      text.set({ minScaleLimit: 0.01 });

      // Apply custom properties
      text.elementId = element.id;
      (text as { selectable?: boolean }).selectable = true;
      (text as { hasControls?: boolean }).hasControls = true;
      (text as { hasBorders?: boolean }).hasBorders = true;
      (text as { borderColor?: string }).borderColor = '#aaff00';
      (text as { cornerColor?: string }).cornerColor = '#aaff00';
      (text as { cornerStyle?: string }).cornerStyle = 'circle';
      (text as { cornerSize?: number }).cornerSize = 10;
      (text as { transparentCorners?: boolean }).transparentCorners = false;

      return text;
    } catch (e) {
      console.error('Failed to create text object:', e);
      return null;
    }
  }, []);

  // Update text object properties
  const updateTextObject = useCallback((obj: TextObj, element: TextElement) => {
    obj.set({
      text: element.text,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontFamily: element.style.fontFamily,
      fontSize: element.style.fontSize,
      fontWeight: String(element.style.fontWeight),
      fontStyle: element.style.fontStyle,
      fill: element.style.fill,
      underline: element.style.textDecoration === 'underline',
      linethrough: element.style.textDecoration === 'line-through',
      textAlign: element.style.textAlign,
      lineHeight: element.style.lineHeight,
      charSpacing: (element.style.letterSpacing / element.style.fontSize) * 1000,
      minScaleLimit: 0.01,
      angle: element.angle,
    });
    obj.setCoords();
    fabricCanvasRef.current?.renderAll();
  }, []);

  // Update all elements when they change
  const updateAllElements = useCallback(async (newElements: TextElement[]) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newIds = new Set(newElements.map((el) => el.id));
    const existingIds = new Set(objectMapRef.current.keys());

    // Remove elements that no longer exist
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const obj = objectMapRef.current.get(id);
        if (obj) {
          canvas.remove(obj);
          objectMapRef.current.delete(id);
        }
      }
    }

    // Add or update elements
    for (const element of newElements) {
      const existingObj = objectMapRef.current.get(element.id);

      if (existingObj) {
        // Update existing object
        updateTextObject(existingObj, element);
      } else {
        // Create new text object
        const textObject = await createTextObject(element);
        if (textObject) {
          canvas.add(textObject);
          objectMapRef.current.set(element.id, textObject);
        }
      }
    }
  }, [createTextObject, updateTextObject]);

  // Sync elements with fabric canvas
  useEffect(() => {
    if (fabricCanvasRef.current) {
      isUpdatingRef.current = true;
      const elementsSnapshot = [...elements]; // Capture current elements
      updateAllElements(elementsSnapshot).then(() => {
        isUpdatingRef.current = false;
      });
    }
  }, [elements, updateAllElements]);

  // Handle selection changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (selectedId) {
      const selectedObj = objectMapRef.current.get(selectedId);
      if (selectedObj) {
        canvas.setActiveObject(selectedObj);
        canvas.renderAll();
        return;
      }
    }

    canvas.discardActiveObject();
    canvas.renderAll();
  }, [selectedId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;

      // Don't delete if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Delete selected text
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteElement(selectedId);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        onSelectElement(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onDeleteElement, onSelectElement]);

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas ref={canvasRef} />
    </div>
  );
}