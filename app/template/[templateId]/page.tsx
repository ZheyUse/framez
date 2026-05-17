'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplate } from '@/lib/storage/templates';
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
import { Download, Type, Layers, X, Trash2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default function TemplateEditorPage({ params }: PageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [showLayersPanel, setShowLayersPanel] = useState(false);
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

  // Save text elements when they change
  useEffect(() => {
    if (!templateId || elements.length === 0) return;
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
    start(images, template, { format: 'png', quality: 0.95 }, elements);
  };

  const activeImage = images.length > 0 ? images[activeIndex] : null;

  // Display elements in reverse order (top layer first)
  const displayElements = useMemo(() => [...elements].reverse(), [elements]);
  const displayElementIds = useMemo(() => displayElements.map((el) => el.id), [displayElements]);

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
          />
        </div>

        {/* Layers Panel Toggle Button */}
        {elements.length > 0 && !showLayersPanel && (
          <button
            onClick={() => setShowLayersPanel(true)}
            className="fixed right-4 top-32 z-30 w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                       flex items-center justify-center text-[#a0a0a0] hover:text-white hover:border-[#aaff00]
                       transition-all cursor-pointer shadow-lg"
            title="Show Layers"
          >
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#aaff00] text-black text-xs font-bold rounded-full flex items-center justify-center">
              {elements.length}
            </span>
          </button>
        )}

        {/* Layers Panel Overlay */}
        {showLayersPanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => { setShowLayersPanel(false); clearMultiSelection(); }}
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
                    Layers ({elements.length})
                    {multiSelectedIds.length > 0 && (
                      <span className="ml-2 text-[#a0a0a0]">({multiSelectedIds.length} selected)</span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => { setShowLayersPanel(false); clearMultiSelection(); }}
                  className="w-6 h-6 flex items-center justify-center rounded text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Actions bar */}
              {elements.length > 1 && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a]">
                  <button
                    onClick={() => selectAll()}
                    className="text-xs text-[#a0a0a0] hover:text-[#aaff00] transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                  >
                    Select All (Ctrl+A)
                  </button>
                  {multiSelectedIds.length > 0 && (
                    <button
                      onClick={() => clearMultiSelection()}
                      className="text-xs text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
                      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                      Clear
                    </button>
                  )}
                  {multiSelectedIds.length > 0 && (
                    <button
                      onClick={() => deleteSelected()}
                      className="ml-auto flex items-center gap-1 px-2 py-1 bg-[#ff4444]/20 text-[#ff4444] hover:bg-[#ff4444]/30 rounded text-xs transition-colors cursor-pointer"
                      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete ({multiSelectedIds.length})
                    </button>
                  )}
                </div>
              )}

              <div className="p-3 overflow-y-auto max-h-[calc(100%-100px)]">
                <p
                  className="text-[#a0a0a0] text-xs mb-2"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  Ctrl+Click to toggle, Shift+Click for range
                </p>
                <div className="space-y-2">
                  {displayElements.map((el) => {
                    const isSelected = selectedId === el.id;
                    const isMultiSelected = multiSelectedIds.includes(el.id);
                    return (
                      <button
                        key={el.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
                            // Ctrl+Shift+Click: extend selection with range (like Windows Explorer)
                            e.preventDefault();
                            useTextElementStore.getState().ctrlShiftSelect(el.id, displayElementIds);
                          } else if (e.shiftKey) {
                            // Shift+Click: recalculate range from anchor to clicked
                            e.preventDefault();
                            useTextElementStore.getState().shiftSelect(el.id, displayElementIds);
                          } else if (e.ctrlKey || e.metaKey) {
                            // Ctrl+Click: toggle individual item
                            e.preventDefault();
                            toggleMultiSelect(el.id);
                          } else {
                            selectElement(el.id);
                            clearMultiSelection();
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2
                                    ${isMultiSelected
                                      ? 'bg-[#aaff00]/20 text-[#aaff00] border border-[#aaff00]'
                                      : isSelected
                                        ? 'bg-[#aaff00]/10 text-white border border-white/20'
                                        : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                                    }`}
                        style={{ fontFamily: `${el.style.fontFamily}, sans-serif` }}
                      >
                        {/* Selection indicator */}
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                                        ${isMultiSelected
                                          ? 'bg-[#aaff00] border-[#aaff00]'
                                          : 'border-[#2a2a2a]'}`}>
                          {isMultiSelected && (
                            <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="truncate block">{el.text || 'Empty text'}</span>
                          <span
                            className="text-[#a0a0a0] text-xs"
                            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                          >
                            {el.style.fontFamily}, {el.style.fontSize}px
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
        templateDataURL={template.dataURL}
        templateWidth={template.width}
        templateHeight={template.height}
        open={previewImage !== null}
        onClose={() => setPreviewImage(null)}
      />

      {/* Mobile bottom padding for drawer */}
      <div className="md:hidden h-[60px]" />
    </div>
  );
}