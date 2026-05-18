'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getTemplate } from '@/lib/storage/templates';
import { updateTemplate } from '@/lib/storage/templates';
import { loadTemplateTexts, saveTemplateTexts } from '@/lib/storage/templateTexts';
import { Template } from '@/types/template';
import { useEditorStore } from '@/store/useEditorStore';
import { useTextElementStore } from '@/store/useTextElementStore';
import { useBatchExport } from '@/hooks/useBatchExport';
import { Navbar } from '@/components/layout/Navbar';
import { TemplateCanvas } from '@/components/editor/TemplateCanvas';
import { EditSidebar } from '@/components/editor/EditSidebar';
import { FloatingToolbar } from '@/components/editor/FloatingToolbar';
import { ImageGrid } from '@/components/template/ImageGrid';
import { ImageUploadZone } from '@/components/template/ImageUploadZone';
import { ImagePreviewModal } from '@/components/template/ImagePreviewModal';
import { DownloadProgress } from '@/components/template/DownloadProgress';
import { Button } from '@/components/ui/button';
import { UploadedImage } from '@/types/editor';
import { Download, Type, Layers, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { TextElement } from '@/types/textElement';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// Sortable base layer item component
function SortableBaseLayerItem({
  id,
  layer,
  label,
  templateOnTop,
  activeIndex,
}: {
  id: string;
  layer: 'template' | 'image';
  label: string;
  templateOnTop: boolean;
  activeIndex: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2
                  ${isDragging ? 'opacity-40 scale-95 bg-[#1a1a1a] ring-2 ring-[#aaff00] shadow-xl z-50 relative' : 'opacity-100'}
                  border-[#2a2a2a] bg-[#0f0f0f] text-white`}
    >
      <span
        {...listeners}
        className="text-[#a0a0a0] cursor-grab active:cursor-grabbing hover:text-white transition-colors touch-none select-none"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        ⋮⋮
      </span>
      <span className="truncate" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
        {label}
      </span>
      {layer === 'template' && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#2a2a2a] text-[#a0a0a0]">
          {templateOnTop ? 'Top' : 'Bottom'}
        </span>
      )}
      {layer === 'image' && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#aaff00]/20 text-[#aaff00]">
          Page {activeIndex + 1}
        </span>
      )}
    </div>
  );
}

// Sortable text layer item component
function SortableTextLayerItem({
  element,
  isSelected,
  multiSelectedIds,
  displayElementIds,
  displayElements,
  activeIndex,
  onSelect,
  onToggleMultiSelect,
  onClearMultiSelection,
  onClosePanel,
}: {
  element: TextElement;
  isSelected: boolean;
  multiSelectedIds: string[];
  displayElementIds: string[];
  displayElements: TextElement[];
  activeIndex: number;
  onSelect: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onClearMultiSelection: () => void;
  onClosePanel: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms ease',
  };

  const isMultiSelected = multiSelectedIds.includes(element.id);
  const isGlobal = element.imageIndex === undefined || element.imageIndex < 0;
  const displayText = element.text || 'Empty text';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      useTextElementStore.getState().ctrlShiftSelect(element.id, displayElementIds.filter(id =>
        displayElements.some(d => d.id === id && (d.imageIndex === undefined || d.imageIndex < 0 || d.imageIndex === activeIndex))
      ));
    } else if (e.shiftKey) {
      e.preventDefault();
      useTextElementStore.getState().shiftSelect(element.id, displayElementIds.filter(id =>
        displayElements.some(d => d.id === id && (d.imageIndex === undefined || d.imageIndex < 0 || d.imageIndex === activeIndex))
      ));
    } else if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onToggleMultiSelect(element.id);
    } else {
      onSelect(element.id);
      onClearMultiSelection();
    }
  };

  const handleDoubleClick = () => {
    onSelect(element.id);
    onClosePanel();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`w-full px-3 py-2 rounded-lg text-sm border transition-all flex items-center gap-2 cursor-pointer select-none
                  ${isDragging ? 'opacity-40 scale-95 ring-2 ring-[#aaff00] shadow-xl z-50 relative' : ''}
                  ${isMultiSelected
                    ? 'bg-[#aaff00]/20 text-[#aaff00] border-[#aaff00]'
                    : isSelected
                      ? 'bg-[#aaff00]/10 text-white border-[#aaff00]'
                      : 'bg-[#1a1a1a] text-white border-[#2a2a2a] hover:bg-[#2a2a2a]'
                  }`}
    >
      <span
        {...listeners}
        className="text-[#a0a0a0] cursor-grab active:cursor-grabbing hover:text-white transition-colors touch-none select-none"
      >
        ⋮⋮
      </span>
      <Type className="w-4 h-4 shrink-0 text-[#a0a0a0]" />
      <div className="min-w-0 flex-1">
        <span className="truncate block">{displayText}</span>
        <span
          className="text-[#a0a0a0] text-xs"
          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          {element.style.fontFamily}, {element.style.fontSize}px
          {isGlobal && ' • Global'}
        </span>
      </div>
    </div>
  );
}

export default function TemplateEditorPage({ params }: PageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [canvasRenderSize, setCanvasRenderSize] = useState({ width: 600, height: 338 });
  const [templateOnTop, setTemplateOnTop] = useState(true);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const { images, activeIndex, addImages, removeImage, setActive, clear } = useEditorStore();
  const {
    elements,
    selectedId,
    multiSelectedIds,
    setElements,
    setCurrentTemplateId,
    clear: clearTextElements,
    selectElement,
    toggleMultiSelect,
    shiftSelect,
    selectAll,
    clearMultiSelection,
    deleteSelected,
  } = useTextElementStore();
  const { progress, start, cancel, reset } = useBatchExport();

  const handleCanvasResize = useCallback((width: number, height: number) => {
    setCanvasRenderSize((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  // Keyboard shortcuts for layers panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Ctrl+A = Select all layers (only when elements exist)
      if (e.ctrlKey && e.key === 'a' && elements.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        selectAll();
      }

      // Delete/Backspace to delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && multiSelectedIds.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelected();
      }

      // Escape to clear selection and close panel
      if (e.key === 'Escape') {
        if (multiSelectedIds.length > 0) {
          clearMultiSelection();
        }
        if (showLayersPanel) {
          setShowLayersPanel(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capturing phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showLayersPanel, multiSelectedIds.length, elements.length, selectAll, clearMultiSelection, deleteSelected]);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTemplateId(resolvedParams.templateId);
    };
    resolveParams();
  }, [params]);

  // Load template
  useEffect(() => {
    if (!templateId) return;

    const loadTemplate = async () => {
      const tmpl = await getTemplate(templateId);
      if (!tmpl) {
        router.push('/');
        return;
      }
      setTemplate(tmpl);
      setTemplateOnTop(tmpl.templateOnTop ?? true);
      setCurrentTemplateId(templateId);
      setLoading(false);
    };

    loadTemplate();
  }, [templateId, router, setCurrentTemplateId]);

  // Load text elements
  useEffect(() => {
    if (!templateId) return;

    const loadTexts = async () => {
      const texts = await loadTemplateTexts(templateId);
      setElements(texts);
    };

    loadTexts();
  }, [templateId, setElements]);

  // Save text elements when they change (including when empty to clear deleted elements)
  useEffect(() => {
    if (!templateId) return;
    saveTemplateTexts(templateId, elements);
  }, [templateId, elements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clear();
      clearTextElements();
    };
  }, [clear, clearTextElements]);

  const handleStartExport = () => {
    if (!template || images.length === 0) return;
    start(images, template, { format: 'png', quality: 0.95 }, elements, canvasRenderSize.width, canvasRenderSize.height);
  };

  const activeImage = images.length > 0 ? images[activeIndex] : null;

  const baseLayerOrder = useMemo(() => {
    return templateOnTop ? (['template', 'image'] as const) : (['image', 'template'] as const);
  }, [templateOnTop]);

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Display elements in reverse order (top layer first)
  const displayElements = useMemo(() => [...elements].reverse(), [elements]);
  const displayElementIds = useMemo(() => displayElements.map((el) => el.id), [displayElements]);

  // Handle text layer reorder with dnd-kit
  const handleTextDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeIdx = elements.findIndex(el => el.id === activeId);
    const overIdx = elements.findIndex(el => el.id === overId);

    if (activeIdx === -1 || overIdx === -1) return;

    // Elements are in reverse render order internally (bottom layer first)
    // We need to account for the reversed display
    const displayActiveIdx = displayElementIds.indexOf(activeId);
    const displayOverIdx = displayElementIds.indexOf(overId);

    if (displayActiveIdx === -1 || displayOverIdx === -1) return;

    // arrayMove works on the displayElements array which is reversed from elements
    const newDisplayElements = arrayMove(displayElements, displayActiveIdx, displayOverIdx);

    // Convert back to internal order (reverse)
    const newElements = [...newDisplayElements].reverse();
    setElements(newElements);
  }, [elements, displayElements, displayElementIds, setElements]);

  if (loading || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-[#a0a0a0]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar
        rightContent={
          <div className="flex items-center gap-4">
            <span
              className="hidden sm:block truncate max-w-[200px] text-white"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {template.name}
            </span>
            <Button
              onClick={handleStartExport}
              disabled={images.length === 0}
              className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All ({images.length})
            </Button>
          </div>
        }
      />

      {/* Edit Sidebar */}
      <EditSidebar />

      {/* Floating Toolbar (when text is selected) */}
      {selectedId && (
        <FloatingToolbar canvasOffset={canvasOffset} />
      )}

      <main className={`flex-1 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full ${selectedId ? 'pt-40' : 'pt-24'}`}>
        {/* Hero - Template Name */}
        <div className="mb-8 text-center sm:hidden">
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {template.name}
          </h1>
        </div>

        {/* Template Canvas with Text */}
        <div className="flex justify-center">
          <TemplateCanvas
            template={template}
            activeImage={activeImage}
            total={images.length}
            activeIndex={activeIndex}
            onPrev={() => setActive(Math.max(0, activeIndex - 1))}
            onNext={() => setActive(Math.min(images.length - 1, activeIndex + 1))}
            onCanvasResize={handleCanvasResize}
            templateOnTop={templateOnTop}
          />
        </div>

        {/* Layers Panel Toggle Button */}
        {(images.length > 0 || elements.length > 0) && !showLayersPanel && (
          <button
            onClick={() => setShowLayersPanel(true)}
            className="fixed right-4 top-32 z-30 w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                       flex items-center justify-center text-[#a0a0a0] hover:text-white hover:border-[#aaff00]
                       transition-all cursor-pointer shadow-lg"
            title="Show Layers"
          >
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#aaff00] text-black text-xs font-bold rounded-full flex items-center justify-center">
              {Math.max(images.length, elements.length)}
            </span>
          </button>
        )}

        {/* Layers Panel Overlay */}
        {showLayersPanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => { setShowLayersPanel(false); clearMultiSelection(); setActiveDragId(null); }}
            />

            {/* Panel */}
            <div className="fixed right-4 top-24 w-[280px] max-h-[calc(100vh-140px)] bg-[#111111] border border-[#2a2a2a] rounded-xl z-40 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#aaff00]" />
                  <h3
                    className="text-white text-sm font-medium"
                    style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                  >
                    Layers
                    {multiSelectedIds.length > 0 && (
                      <span className="ml-2 text-[#a0a0a0]">({multiSelectedIds.length} selected)</span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => { setShowLayersPanel(false); clearMultiSelection(); setActiveDragId(null); }}
                  className="w-6 h-6 flex items-center justify-center rounded text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Base layer controls - separate DndContext for base layers */}
              <DndContext
                sensors={sensors}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragStart={({ active }) => setActiveDragId(active.id as string)}
                onDragEnd={(event) => {
                  setActiveDragId(null);
                  const { active, over } = event;

                  // Only swap if dropped on the other item
                  if (!over || active.id === over.id) return;
                  if (!active.id.toString().startsWith('base-layer-')) return;

                  // Use functional updater to avoid stale closure
                  setTemplateOnTop((prev) => {
                    const next = !prev;
                    if (templateId) updateTemplate(templateId, { templateOnTop: next });
                    return next;
                  });
                }}
              >
                <div className="p-3 border-b border-[#2a2a2a]">
                  <p
                    className="text-[#a0a0a0] text-xs mb-2"
                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                  >
                    Base layers
                  </p>
                  <SortableContext items={baseLayerOrder.map(layer => `base-layer-${layer}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {baseLayerOrder.map((layer) => {
                        const layerId = `base-layer-${layer}`;
                        const label = layer === 'template'
                          ? 'Template'
                          : activeImage
                            ? `Image: ${activeImage.name}`
                            : 'Image (none)';

                        return (
                          <SortableBaseLayerItem
                            key={layerId}
                            id={layerId}
                            layer={layer}
                            label={label}
                            templateOnTop={templateOnTop}
                            activeIndex={activeIndex}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </div>
              </DndContext>

                {/* Page tabs */}
                {images.length > 1 && (
                  <div className="px-3 py-2 border-b border-[#2a2a2a]">
                    <p
                      className="text-[#a0a0a0] text-xs mb-2"
                      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                      Pages
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setActive(idx)}
                          className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer
                                      ${idx === activeIndex
                                        ? 'bg-[#aaff00] text-black font-bold'
                                        : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                                      }`}
                          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page layers content */}
                <div className="p-3 overflow-y-auto max-h-[calc(100%-100px)]">
                  {/* Current page image layer */}
                  {activeImage && (
                    <div className="mb-3">
                      <div className="w-full px-3 py-2 rounded-lg text-sm border bg-[#1a1a1a] text-white border-[#2a2a2a]">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#aaff00] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="truncate block" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                              {activeImage.name}
                            </span>
                            <span
                              className="text-[#a0a0a0] text-xs"
                              style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                            >
                              {activeImage.width} × {activeImage.height}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
                          <span
                            className="text-[#a0a0a0] text-[10px]"
                            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                          >
                            Page {activeIndex + 1} of {images.length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(activeImage.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-[#ff4444] hover:bg-[#ff4444]/20 rounded transition-colors cursor-pointer"
                            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text elements for current page - separate DndContext for text layers */}
                  {displayElements.filter(el => {
                    const isGlobal = el.imageIndex === undefined || el.imageIndex < 0;
                    return isGlobal || el.imageIndex === activeIndex;
                  }).length > 0 && (
                    <DndContext
                      sensors={sensors}
                      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                      onDragStart={({ active }) => setActiveDragId(active.id as string)}
                      onDragEnd={(event) => {
                        setActiveDragId(null);
                        handleTextDragEnd(event);
                      }}
                    >
                      <SortableContext
                        items={displayElementIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                          <p
                            className="text-[#a0a0a0] text-xs mb-2"
                            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                          >
                            Text layers ({displayElements.filter(el => {
                              const isGlobal = el.imageIndex === undefined || el.imageIndex < 0;
                              return isGlobal || el.imageIndex === activeIndex;
                            }).length})
                          </p>
                          <div className="space-y-1">
                            {displayElements.filter(el => {
                              const isGlobal = el.imageIndex === undefined || el.imageIndex < 0;
                              return isGlobal || el.imageIndex === activeIndex;
                            }).map((el) => {
                              return (
                                <SortableTextLayerItem
                                  key={el.id}
                                  element={el}
                                  isSelected={selectedId === el.id}
                                  multiSelectedIds={multiSelectedIds}
                                  displayElementIds={displayElementIds}
                                  displayElements={displayElements}
                                  activeIndex={activeIndex}
                                  onSelect={selectElement}
                                  onToggleMultiSelect={toggleMultiSelect}
                                  onClearMultiSelection={clearMultiSelection}
                                  onClosePanel={() => { setShowLayersPanel(false); setActiveDragId(null); }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Actions bar for multi-selected items */}
                  {multiSelectedIds.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => selectAll()}
                          className="text-xs text-[#a0a0a0] hover:text-[#aaff00] transition-colors cursor-pointer"
                          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => clearMultiSelection()}
                          className="text-xs text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
                          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => deleteSelected()}
                          className="ml-auto flex items-center gap-1 px-2 py-1 bg-[#ff4444]/20 text-[#ff4444] hover:bg-[#ff4444]/30 rounded text-xs transition-colors cursor-pointer"
                          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete ({multiSelectedIds.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        {/* Mobile: Text elements list */}
        {elements.length > 0 && (
          <div className="lg:hidden mt-4 p-4 bg-[#111111] rounded-xl border border-[#2a2a2a]">
            <h3
              className="text-white text-sm font-medium mb-3"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Text Elements ({elements.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {elements.map((el) => (
                <button
                  key={el.id}
                  onClick={() => useTextElementStore.getState().selectElement(el.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer truncate max-w-[150px]
                              ${selectedId === el.id
                                ? 'bg-[#aaff00] text-black font-bold'
                                : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                              }`}
                  style={{ fontFamily: `${el.style.fontFamily}, sans-serif` }}
                >
                  {el.text || 'Empty'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Images Grid */}
        <ImageGrid
          images={images}
          activeIndex={activeIndex}
          onSelect={(i) => {
            setActive(i);
            setPreviewImage(images[i]);
          }}
          onDelete={removeImage}
          onAddMore={() => uploadInputRef.current?.click()}
        />

        {/* Hidden file input for adding more */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              const processImages = async () => {
                const validFiles = Array.from(files).filter((f) =>
                  ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
                );
                const processed: UploadedImage[] = [];

                for (const file of validFiles) {
                  const dataURL = await new Promise<string>((res) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.readAsDataURL(file);
                  });

                  const { width, height } = await new Promise<{ width: number; height: number }>((res) => {
                    const img = new Image();
                    img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
                    img.src = dataURL;
                  });

                  const thumbCanvas = document.createElement('canvas');
                  const scale = Math.min(400 / width, 400 / height, 1);
                  thumbCanvas.width = Math.round(width * scale);
                  thumbCanvas.height = Math.round(height * scale);
                  thumbCanvas.getContext('2d')?.drawImage(
                    Object.assign(document.createElement('img'), { src: dataURL }),
                    0, 0, thumbCanvas.width, thumbCanvas.height
                  );

                  processed.push({
                    id: crypto.randomUUID(),
                    file,
                    dataURL,
                    thumb: thumbCanvas.toDataURL('image/jpeg', 0.92),
                    name: file.name,
                    width,
                    height,
                  });
                }

                addImages(processed);
              };
              processImages();
            }
            e.target.value = '';
          }}
        />

        {/* Bulk Upload Zone */}
        <ImageUploadZone onImagesAdded={addImages} />

        {/* Mobile: Add text button */}
        <div className="lg:hidden mt-4">
          <Button
            onClick={() => {
              if (!templateId) return;
              const id = useTextElementStore.getState().addElement({
                text: 'Add your text',
                templateId,
                x: 200,
                y: 200,
              });
            }}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] cursor-pointer"
          >
            <Type className="w-4 h-4 mr-2" />
            Add Text
          </Button>
        </div>

        {/* Download Progress */}
        <DownloadProgress
          progress={progress}
          templateName={template.name}
          onCancel={cancel}
          onClose={reset}
        />
      </main>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        imageIndex={previewImage ? images.findIndex(img => img.id === previewImage.id) : 0}
        templateDataURL={template.dataURL}
        templateWidth={template.width}
        templateHeight={template.height}
        templateOnTop={templateOnTop}
        textElements={elements}
        open={previewImage !== null}
        onClose={() => setPreviewImage(null)}
        canvasWidth={canvasRenderSize.width}
        canvasHeight={canvasRenderSize.height}
      />

      {/* Mobile bottom padding for drawer */}
      <div className="md:hidden h-[60px]" />
    </div>
  );
}