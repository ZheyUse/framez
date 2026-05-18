'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TextElement, TextElementStyle } from '@/types/textElement';
import { loadFont } from '@/lib/canvas/fontLoader';

interface FabricCanvasProps {
  elements: TextElement[];
  selectedId: string | null;
  multiSelectedIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  onSelectElement: (id: string | null) => void;
  onMultiSelectChange: (ids: string[]) => void;
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
  getActiveObject: () => TextObj | null;
}

export default function FabricCanvas({
  elements,
  selectedId,
  multiSelectedIds,
  canvasWidth,
  canvasHeight,
  onSelectElement,
  onMultiSelectChange,
  onUpdateElement,
  onDeleteElement,
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvasInstance | null>(null);
  const objectMapRef = useRef<Map<string, TextObj>>(new Map());
  const isUpdatingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isProcessingSelectionRef = useRef(false);
  const lastSelectedIdsRef = useRef<string[]>([]);
  const multiSelectedIdsRef = useRef<string[]>([]);
  const fabricModuleRef = useRef<unknown>(null);

  // Get all element IDs in order for range selection
  const orderedIds = elements.map((el) => el.id);

  // Sync multiSelectedIds prop to ref for use in event handlers
  useEffect(() => {
    multiSelectedIdsRef.current = multiSelectedIds;
  }, [multiSelectedIds]);

  // Initialize fabric canvas
  useEffect(() => {
    if (isInitializedRef.current && fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width: canvasWidth, height: canvasHeight });
      return;
    }

    let fabricCanvas: FabricCanvasInstance | null = null;

    const initCanvas = async () => {
      const fabricModule = await import('fabric');
      fabricModuleRef.current = fabricModule;

      if (!canvasRef.current) return;
      if (fabricCanvasRef.current) return;

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

      fabricCanvas.selectionColor = 'rgba(170, 255, 0, 0.1)';
      fabricCanvas.selectionBorderColor = '#aaff00';
      fabricCanvas.selectionLineWidth = 2;

      // Handle Ctrl+click and Shift+click via object:mousedown
      fabricCanvas.on('object:mousedown', (e: { target?: TextObj; e?: MouseEvent }) => {
        if (!e.target?.elementId) return;
        const ctrlKey = e.e?.ctrlKey || e.e?.metaKey;
        const shiftKey = e.e?.shiftKey;
        const targetId = e.target.elementId;

        if (ctrlKey) {
          // Ctrl+click: toggle this element in/out of selection
          fabricCanvas?.discardActiveObject();
          setTimeout(() => {
            const current = multiSelectedIdsRef.current;
            const newSelection = current.includes(targetId)
              ? current.filter((id) => id !== targetId)
              : [...current, targetId];
            onMultiSelectChange(newSelection);
            isProcessingSelectionRef.current = true;
            setTimeout(() => {
              isProcessingSelectionRef.current = false;
            }, 100);
          }, 0);
        } else if (shiftKey) {
          // Shift+click: range select from anchor to target
          fabricCanvas?.discardActiveObject();
          setTimeout(() => {
            const current = multiSelectedIdsRef.current;
            let anchorId = current.length > 0
              ? current[0]
              : lastSelectedIdsRef.current[lastSelectedIdsRef.current.length - 1] || targetId;

            const anchorIdx = orderedIds.indexOf(anchorId);
            const targetIdx = orderedIds.indexOf(targetId);

            if (anchorIdx !== -1 && targetIdx !== -1) {
              const lo = Math.min(anchorIdx, targetIdx);
              const hi = Math.max(anchorIdx, targetIdx);
              const rangeIds = orderedIds.slice(lo, hi + 1);

              // Toggle range in existing selection
              const newSelected = new Set(current);
              rangeIds.forEach((rid) => {
                if (newSelected.has(rid)) {
                  newSelected.delete(rid);
                } else {
                  newSelected.add(rid);
                }
              });

              onMultiSelectChange(Array.from(newSelected));
              isProcessingSelectionRef.current = true;
              setTimeout(() => {
                isProcessingSelectionRef.current = false;
              }, 100);
            }
            lastSelectedIdsRef.current = [targetId];
          }, 0);
        } else {
          // Regular click - track as last selected
          lastSelectedIdsRef.current = [targetId];
        }
      });

      // Handle selection events - sync all selected items to store
      fabricCanvas.on('selection:created', (e: { selected?: TextObj[] }) => {
        if (isProcessingSelectionRef.current) return;
        if (e.selected && e.selected.length > 0) {
          const selectedIds = e.selected
            .map((obj) => obj.elementId)
            .filter((id): id is string => !!id);

          if (selectedIds.length > 1) {
            // Multi-selection from shift-drag or native multi-select
            lastSelectedIdsRef.current = selectedIds;
            isProcessingSelectionRef.current = true;
            onMultiSelectChange(selectedIds);
            // Call selectElement after multi-select change
            onSelectElement(selectedIds[0]);
            setTimeout(() => {
              isProcessingSelectionRef.current = false;
            }, 100);
          } else if (selectedIds.length === 1) {
            onSelectElement(selectedIds[0]);
          }
        }
      });

      fabricCanvas.on('selection:updated', (e: { selected?: TextObj[] }) => {
        if (isProcessingSelectionRef.current) return;
        if (e.selected && e.selected.length > 0) {
          const selectedIds = e.selected
            .map((obj) => obj.elementId)
            .filter((id): id is string => !!id);

          lastSelectedIdsRef.current = selectedIds;
          if (selectedIds.length > 1) {
            isProcessingSelectionRef.current = true;
            onMultiSelectChange(selectedIds);
            onSelectElement(selectedIds[0]);
            setTimeout(() => {
              isProcessingSelectionRef.current = false;
            }, 100);
          } else if (selectedIds.length === 1) {
            onSelectElement(selectedIds[0]);
          }
        }
      });

      fabricCanvas.on('selection:cleared', () => {
        if (isProcessingSelectionRef.current) return;
        onSelectElement(null);
        onMultiSelectChange([]);
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
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width: canvasWidth, height: canvasHeight });
    }
  }, [canvasWidth, canvasHeight]);

  const createTextObject = useCallback(async (element: TextElement): Promise<TextObj | null> => {
    try {
      const fabricModule = await import('fabric');
      const fs = fabricModule as unknown as { Textbox: new (text: string, options?: Record<string, unknown>) => TextObj };

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

  const updateAllElements = useCallback(async (newElements: TextElement[]) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newIds = new Set(newElements.map((el) => el.id));
    const existingIds = new Set(objectMapRef.current.keys());

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const obj = objectMapRef.current.get(id);
        if (obj) {
          canvas.remove(obj);
          objectMapRef.current.delete(id);
        }
      }
    }

    for (const element of newElements) {
      const existingObj = objectMapRef.current.get(element.id);

      if (existingObj) {
        updateTextObject(existingObj, element);
      } else {
        const textObject = await createTextObject(element);
        if (textObject) {
          canvas.add(textObject);
          objectMapRef.current.set(element.id, textObject);
        }
      }
    }
  }, [createTextObject, updateTextObject]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      isUpdatingRef.current = true;
      const elementsSnapshot = [...elements];
      updateAllElements(elementsSnapshot).then(() => {
        isUpdatingRef.current = false;
      });
    }
  }, [elements, updateAllElements]);

  // Handle single-selection from store (selectedId changes)
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

  // Sync multiSelectedIds from store to canvas (for Ctrl+A and Shift operations)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || multiSelectedIds.length === 0) return;

    // Filter to only include elements currently on this canvas
    const canvasIds = new Set(elements.map((el) => el.id));
    const visibleMultiSelected = multiSelectedIds.filter((id) => canvasIds.has(id));

    if (visibleMultiSelected.length === 0) return;

    // If only one selected, use regular setActiveObject
    if (visibleMultiSelected.length === 1) {
      const obj = objectMapRef.current.get(visibleMultiSelected[0]);
      if (obj) {
        isProcessingSelectionRef.current = true;
        canvas.setActiveObject(obj);
        canvas.renderAll();
        setTimeout(() => {
          isProcessingSelectionRef.current = false;
        }, 100);
      }
      return;
    }

    // For multiple selected, create an ActiveSelection to show all selected
    const fabricModule = fabricModuleRef.current as { ActiveSelection: new (objects: TextObj[], options: { canvas: FabricCanvasInstance }) => TextObj } | null;
    if (!fabricModule) return;

    const selectedObjs = visibleMultiSelected
      .map((id) => objectMapRef.current.get(id))
      .filter((obj): obj is TextObj => !!obj);

    if (selectedObjs.length > 0) {
      isProcessingSelectionRef.current = true;
      try {
        const activeSelection = new fabricModule.ActiveSelection(selectedObjs, { canvas });
        canvas.setActiveObject(activeSelection);
      } catch {
        // Fallback: just set the first object as active
        canvas.setActiveObject(selectedObjs[0]);
      }
      canvas.renderAll();
      setTimeout(() => {
        isProcessingSelectionRef.current = false;
      }, 100);
    }
  }, [multiSelectedIds, elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        onSelectElement(null);
        onMultiSelectChange([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSelectElement, onMultiSelectChange]);

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas ref={canvasRef} />
    </div>
  );
}