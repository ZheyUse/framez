'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, ChevronDown } from 'lucide-react';
import { useTextElementStore } from '@/store/useTextElementStore';
import { FONTS, loadFont, searchFonts, DEFAULT_FONT } from '@/lib/canvas/fontLoader';
import { DEFAULT_TEXT_STYLE } from '@/types/textElement';
import { Button } from '@/components/ui/button';

interface TextPanelProps {
  onClose: () => void;
  isMobile?: boolean;
}

const TEXT_PRESETS = [
  { label: 'Add Text', text: 'Add your text', size: 48, weight: 700 },
  { label: 'Add Heading', text: 'Heading', size: 64, weight: 800 },
  { label: 'Add Subheading', text: 'Subheading', size: 32, weight: 600 },
  { label: 'Add Tagline', text: 'Your tagline here', size: 24, weight: 500 },
  { label: 'Add Caption', text: 'Caption text', size: 18, weight: 400 },
];

export function TextPanel({ onClose, isMobile = false }: TextPanelProps) {
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT);
  const [recentFonts] = useState<string[]>(['Space Grotesk', 'Montserrat', 'Playfair Display']);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    elements,
    addElement,
    currentTemplateId,
  } = useTextElementStore();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load selected font
  useEffect(() => {
    if (selectedFont) {
      loadFont(selectedFont);
    }
  }, [selectedFont]);

  const filteredFonts = searchFonts(fontSearchQuery);

  const handleFontSelect = (fontName: string) => {
    setSelectedFont(fontName);
    loadFont(fontName);
    setShowFontDropdown(false);
    setFontSearchQuery('');
  };

  const handleAddText = (preset?: typeof TEXT_PRESETS[number]) => {
    if (!currentTemplateId) return;

    addElement({
      text: preset?.text || 'Add your text',
      templateId: currentTemplateId,
      x: 200,
      y: 200,
      style: {
        ...DEFAULT_TEXT_STYLE,
        fontFamily: selectedFont,
        fontSize: preset?.size || 48,
        fontWeight: preset?.weight || 700,
      },
    });
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-3'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-white font-medium"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          Add Text
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Font selector with search */}
      <div ref={dropdownRef} className="relative mb-4">
        <label
          className="block text-[#a0a0a0] text-xs mb-1.5"
          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          Default Font
        </label>

        <div
          className="relative cursor-pointer"
          onClick={() => setShowFontDropdown(!showFontDropdown)}
        >
          <input
            ref={inputRef}
            type="text"
            value={fontSearchQuery}
            onChange={(e) => setFontSearchQuery(e.target.value)}
            placeholder="Search fonts..."
            onClick={(e) => {
              e.stopPropagation();
              setShowFontDropdown(true);
            }}
            onFocus={() => setShowFontDropdown(true)}
            className="w-full h-9 px-3 pr-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm
                       focus:outline-none focus:border-[#aaff00] transition-colors"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
        </div>

        {/* Font dropdown */}
        {showFontDropdown && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                       max-h-[250px] overflow-y-auto z-50 shadow-xl"
          >
            {/* Recent fonts */}
            {!fontSearchQuery && recentFonts.length > 0 && (
              <div className="p-2 border-b border-[#2a2a2a]">
                <p
                  className="text-[#a0a0a0] text-xs mb-2"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  Recent
                </p>
                {recentFonts.map((font) => (
                  <button
                    key={font}
                    onClick={() => {
                      setSelectedFont(font);
                      loadFont(font);
                      setShowFontDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#2a2a2a] rounded
                               transition-colors cursor-pointer flex items-center justify-between"
                    style={{ fontFamily: `${font}, sans-serif` }}
                  >
                    {font}
                    {selectedFont === font && (
                      <span className="w-2 h-2 rounded-full bg-[#aaff00]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Search results or all fonts */}
            <div className="p-2">
              <p
                className="text-[#a0a0a0] text-xs mb-2"
                style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                {fontSearchQuery ? 'Results' : 'All Fonts'}
              </p>
              {(fontSearchQuery ? filteredFonts : FONTS.slice(0, 30)).map((font) => (
                <button
                  key={font.name}
                  onClick={() => handleFontSelect(font.name)}
                  className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#2a2a2a] rounded
                             transition-colors cursor-pointer flex items-center justify-between"
                  style={{ fontFamily: `${font.name}, sans-serif` }}
                >
                  <span>{font.name}</span>
                  {selectedFont === font.name && (
                    <span className="w-2 h-2 rounded-full bg-[#aaff00]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected font preview */}
      <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
        <p
          className="text-[#a0a0a0] text-xs mb-1"
          style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
        >
          Selected: {selectedFont}
        </p>
        <p
          className="text-white text-lg truncate"
          style={{ fontFamily: `${selectedFont}, sans-serif` }}
        >
          The quick brown fox
        </p>
      </div>

      {/* Add text buttons */}
      <div className="space-y-2">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleAddText(preset)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a]
                       border border-[#2a2a2a] hover:border-[#aaff00]/50 rounded-lg
                       transition-all duration-200 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#aaff00]/10 flex items-center justify-center
                          group-hover:bg-[#aaff00]/20 transition-colors">
              <Plus className="w-4 h-4 text-[#aaff00]" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">{preset.label}</p>
              <p className="text-[#a0a0a0] text-xs">Size: {preset.size}px</p>
            </div>
          </button>
        ))}
      </div>

      {/* Existing text elements */}
      {elements.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
          <p
            className="text-[#a0a0a0] text-xs mb-3"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Active text elements ({elements.length})
          </p>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {elements.map((el) => (
              <div
                key={el.id}
                className="px-3 py-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]
                           text-white text-sm truncate"
                style={{
                  fontFamily: `${el.style.fontFamily}, sans-serif`,
                  fontSize: Math.min(el.style.fontSize, 16),
                }}
              >
                {el.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}