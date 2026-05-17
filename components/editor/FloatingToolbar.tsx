'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreHorizontal,
  ChevronDown,
  Type,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useTextElementStore } from '@/store/useTextElementStore';
import { FONTS, loadFont, COMMON_FONT_SIZES } from '@/lib/canvas/fontLoader';
import { TextElementStyle, isGlobalText, getEffectiveStyle } from '@/types/textElement';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FloatingToolbarProps {
  canvasOffset: { x: number; y: number };
  imageName?: string;
}

export function FloatingToolbar({ canvasOffset, imageName }: FloatingToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const {
    elements,
    selectedId,
    textMode,
    currentImageIndex,
    updateStyleForCurrentImage,
    deleteElement,
    duplicateElement,
    selectElement,
    setTextMode,
    clearOverrides,
    undo,
    redo,
    canUndo,
    canRedo,
    saveToHistory,
  } = useTextElementStore();

  const selectedElement = elements.find((el) => el.id === selectedId);
  const style = selectedElement ? getEffectiveStyle(selectedElement, currentImageIndex) : null;
  const isGlobal = selectedElement ? isGlobalText(selectedElement) : false;
  const hasOverrides = isGlobal && selectedElement && selectedElement.overrides && currentImageIndex in selectedElement.overrides;
  const undoAvailable = canUndo();
  const redoAvailable = canRedo();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl+Z = Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z = Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }

      // Ctrl+D = Duplicate
      if (e.ctrlKey && e.key === 'd' && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateElement, selectElement, selectedId]);

  // Position toolbar
  const toolbarStyle: React.CSSProperties = {
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'max-content',
    maxWidth: '90vw',
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFontDropdown(false);
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) setShowSizeDropdown(false);
      if (caseRef.current && !caseRef.current.contains(e.target as Node)) setShowCaseDropdown(false);
      if (advancedRef.current && !advancedRef.current.contains(e.target as Node)) setShowAdvanced(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!selectedElement || !style) return null;

  const handleStyleChange = (changes: Partial<TextElementStyle>) => {
    if (selectedId) {
      updateStyleForCurrentImage(selectedId, changes);
      if (changes.fontFamily) loadFont(changes.fontFamily);
    }
  };

  const handleDuplicate = () => {
    if (selectedId) {
      duplicateElement(selectedId);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteElement(selectedId);
    }
  };

  const handleUnlock = () => {
    if (selectedId && hasOverrides) {
      clearOverrides(selectedId, currentImageIndex);
      setShowUnlockModal(false);
    }
  };

  return (
    <Fragment>
      <div
        ref={toolbarRef}
        className="fixed z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 flex items-center gap-2 px-3 py-2"
        style={toolbarStyle}
      >
        {/* Left Actions Toolbar (fixed) */}
        <div className="flex items-center gap-1 pr-3 border-r border-[#2a2a2a]">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={!undoAvailable}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer
              ${undoAvailable ? 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white' : 'text-[#2a2a2a] cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={!redoAvailable}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer
              ${redoAvailable ? 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white' : 'text-[#2a2a2a] cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#2a2a2a]" />

          {hasOverrides && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#ff8800]/20 text-[#ff8800] hover:bg-[#ff8800]/30 transition-colors cursor-pointer"
              title="Unlock to apply global changes"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
          {isGlobal && !hasOverrides && (
            <span className="px-2 py-1 text-[10px] text-[#aaff00] bg-[#aaff00]/10 rounded" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              Global
            </span>
          )}
          {isGlobal && !hasOverrides && (
            <button
              onClick={handleDuplicate}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a0a0a0] hover:bg-[#ff4444]/20 hover:text-[#ff4444] transition-colors cursor-pointer"
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-[#0a0a0a] rounded-lg p-0.5">
          <button
            onClick={() => setTextMode('all')}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${textMode === 'all' ? 'bg-[#aaff00] text-black font-bold' : 'text-[#a0a0a0] hover:text-white'}`}
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            All
          </button>
          <button
            onClick={() => setTextMode('individual')}
            className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${textMode === 'individual' ? 'bg-[#aaff00] text-black font-bold' : 'text-[#a0a0a0] hover:text-white'}`}
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Individual
          </button>
        </div>

        <div className="w-px h-6 bg-[#2a2a2a]" />

        {/* Color picker */}
        <div className="relative group">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer" title="Text color">
            <div className="w-5 h-5 rounded border-2 border-white/30" style={{ backgroundColor: style.fill }} />
          </button>
          <div className="absolute top-full left-0 mt-1 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
            <input
              type="color"
              value={style.fill}
              onChange={(e) => handleStyleChange({ fill: e.target.value })}
              className="w-24 h-24 cursor-pointer border border-[#2a2a2a] rounded"
            />
            <div className="mt-2 flex flex-wrap gap-1 max-w-[150px]">
              {['#ffffff', '#000000', '#aaff00', '#ff4455', '#ffcc00', '#00ccff', '#ff00ff', '#00ff88'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleChange({ fill: color })}
                  className="w-6 h-6 rounded border border-[#2a2a2a] hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Font selector */}
        <div ref={fontRef} className="relative">
          <button
            onClick={() => { setShowFontDropdown(!showFontDropdown); setShowSizeDropdown(false); setShowCaseDropdown(false); }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer max-w-[120px]"
            style={{ fontFamily: `${style.fontFamily}, sans-serif` }}
          >
            <span className="text-white text-sm truncate">{style.fontFamily}</span>
            <ChevronDown className="w-3 h-3 text-[#a0a0a0] shrink-0" />
          </button>
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-h-[300px] overflow-y-auto z-50 shadow-xl">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search fonts..."
                  className="w-full h-8 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm focus:outline-none focus:border-[#aaff00]"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                />
              </div>
              <div className="p-2 max-h-[250px] overflow-y-auto">
                {FONTS.slice(0, 40).map((font) => (
                  <button
                    key={font.name}
                    onClick={() => { handleStyleChange({ fontFamily: font.name }); setShowFontDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] rounded transition-colors cursor-pointer flex items-center justify-between ${style.fontFamily === font.name ? 'text-[#aaff00]' : 'text-white'}`}
                    style={{ fontFamily: `${font.name}, sans-serif` }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Size selector */}
        <div ref={sizeRef} className="relative">
          <button
            onClick={() => { setShowSizeDropdown(!showSizeDropdown); setShowFontDropdown(false); setShowCaseDropdown(false); }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer min-w-[60px]"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <Type className="w-4 h-4 text-white" />
            <span className="text-white text-sm">{style.fontSize}</span>
            <ChevronDown className="w-3 h-3 text-[#a0a0a0]" />
          </button>
          {showSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg z-50 shadow-xl">
              <div className="p-2">
                <input
                  type="number"
                  min="8"
                  max="300"
                  value={style.fontSize}
                  onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) || 16 })}
                  className="w-full h-8 px-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm focus:outline-none focus:border-[#aaff00]"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                />
              </div>
              <div className="p-2 border-t border-[#2a2a2a]">
                <div className="grid grid-cols-3 gap-1">
                  {COMMON_FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => { handleStyleChange({ fontSize: size }); setShowSizeDropdown(false); }}
                      className={`px-2 py-1 text-xs rounded hover:bg-[#2a2a2a] transition-colors cursor-pointer ${style.fontSize === size ? 'text-[#aaff00]' : 'text-white'}`}
                      style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#2a2a2a]" />

        <button
          onClick={() => handleStyleChange({ fontWeight: style.fontWeight >= 700 ? 400 : 700 })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.fontWeight >= 700 ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleStyleChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.fontStyle === 'italic' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleStyleChange({ textDecoration: style.textDecoration === 'underline' ? 'normal' : 'underline' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textDecoration === 'underline' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleStyleChange({ textDecoration: style.textDecoration === 'line-through' ? 'normal' : 'line-through' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textDecoration === 'line-through' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div ref={caseRef} className="relative">
          <button
            onClick={() => { setShowCaseDropdown(!showCaseDropdown); setShowFontDropdown(false); setShowSizeDropdown(false); }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textTransform !== 'none' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
            title="Text transform"
          >
            <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>AA</span>
          </button>
          {showCaseDropdown && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg z-50 shadow-xl min-w-[120px]">
              {[
                { value: 'none', label: 'Aa (No change)' },
                { value: 'uppercase', label: 'AA (ALL CAPS)' },
                { value: 'lowercase', label: 'aa (all lowercase)' },
                { value: 'capitalize', label: 'Aa (Capitalize)' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { handleStyleChange({ textTransform: option.value as TextElementStyle['textTransform'] }); setShowCaseDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer ${style.textTransform === option.value ? 'text-[#aaff00]' : 'text-white'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#2a2a2a]" />

        <button
          onClick={() => handleStyleChange({ textAlign: 'left' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textAlign === 'left' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleStyleChange({ textAlign: 'center' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textAlign === 'center' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleStyleChange({ textAlign: 'right' })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${style.textAlign === 'right' ? 'bg-[#aaff00] text-black' : 'hover:bg-[#2a2a2a] text-white'}`}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-[#2a2a2a]" />

        <div ref={advancedRef} className="relative">
          <button
            onClick={() => { setShowAdvanced(!showAdvanced); setShowFontDropdown(false); setShowSizeDropdown(false); setShowCaseDropdown(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer text-white"
            title="Advanced settings"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showAdvanced && (
            <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg z-50 shadow-xl min-w-[220px] p-4">
              <h4 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
                Advanced Settings
              </h4>
              <div className="mb-3">
                <label className="block text-[#a0a0a0] text-xs mb-1" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  Letter Spacing: {style.letterSpacing}px
                </label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  value={style.letterSpacing}
                  onChange={(e) => handleStyleChange({ letterSpacing: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#aaff00] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
              <div className="mb-3">
                <label className="block text-[#a0a0a0] text-xs mb-1" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
                  Line Height: {style.lineHeight.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={style.lineHeight}
                  onChange={(e) => handleStyleChange({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#aaff00] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
              <Unlock className="w-5 h-5 text-[#ff8800]" />
              Unlock Text Override?
            </DialogTitle>
            <DialogDescription className="text-[#a0a0a0]" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              <p className="mb-2">
                This text has been customized for <strong className="text-white">{imageName || `image ${currentImageIndex + 1}`}</strong>.
              </p>
              <p className="mb-2">
                <strong className="text-[#ff8800]">Warning:</strong> Unlocking will apply the global text settings (position, font, size, color, etc.) to this image. Your individual changes will be lost.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowUnlockModal(false)} className="border border-[#2a2a2a] text-white hover:bg-[#2a2a2a] cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleUnlock}
              className="bg-[#ff8800] text-black hover:bg-[#ff8800]/80 font-bold cursor-pointer"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Unlock & Apply Global
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}