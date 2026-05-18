'use client';

import { useState, useRef, useEffect } from 'react';
import { Type, Image, FileCode } from 'lucide-react';
import { useTextElementStore } from '@/store/useTextElementStore';
import { TextPanel } from './TextPanel';
import { ScriptPanel } from './ScriptPanel';

export function EditSidebar() {
  const [activeTool, setActiveTool] = useState<'text' | 'elements' | 'script' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: 'text' | 'elements' | 'script') => {
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);
    }
  };

  // Close on click outside the entire sidebar (both nav and content)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only close if clicking outside BOTH the nav and the content panel
      const clickedNav = navRef.current?.contains(e.target as Node);
      const clickedContent = contentRef.current?.contains(e.target as Node);

      if (!clickedNav && !clickedContent) {
        setActiveTool(null);
      }
    };

    if (activeTool) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTool]);

  return (
    <>
      {/* Desktop Layout: Nav + Content Panel Side by Side */}
      <div className="hidden md:flex fixed left-0 top-[72px] bottom-0 z-40">
        {/* Nav Panel - Fixed width, always visible */}
        <div
          ref={navRef}
          className="w-[60px] bg-[#111111]/95 backdrop-blur-sm border-r border-[#2a2a2a] flex flex-col items-center py-4 gap-2"
        >
          {/* Text Tool */}
          <button
            onClick={() => handleToolClick('text')}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
              ${activeTool === 'text'
                ? 'bg-[#aaff00] text-black'
                : 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
            title="Text"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Script Tool */}
          <button
            onClick={() => handleToolClick('script')}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
              ${activeTool === 'script'
                ? 'bg-[#aaff00] text-black'
                : 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
            title="Script"
          >
            <FileCode className="w-5 h-5" />
          </button>

          {/* Elements Tool - Placeholder */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#a0a0a0]/40 cursor-not-allowed"
            title="Elements (Coming Soon)"
            disabled
          >
            <Image className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel - Only shows when a tool is active */}
        {activeTool === 'text' && (
          <div
            ref={contentRef}
            className="w-[280px] bg-[#111111]/95 backdrop-blur-sm border-r border-[#2a2a2a] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TextPanel onClose={() => setActiveTool(null)} />
          </div>
        )}

        {/* Script Content Panel */}
        {activeTool === 'script' && (
          <div
            ref={contentRef}
            className="w-[280px] bg-[#111111]/95 backdrop-blur-sm border-r border-[#2a2a2a] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ScriptPanel onClose={() => setActiveTool(null)} />
          </div>
        )}
      </div>

      {/* Mobile Layout: Bottom Drawer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* Nav icons at bottom */}
        <div
          className="h-[60px] bg-[#111111]/95 backdrop-blur-sm border-t border-[#2a2a2a] flex items-center justify-center gap-8"
        >
          <button
            onClick={() => handleToolClick('text')}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
              ${activeTool === 'text'
                ? 'bg-[#aaff00] text-black'
                : 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
            title="Text"
          >
            <Type className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleToolClick('script')}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
              ${activeTool === 'script'
                ? 'bg-[#aaff00] text-black'
                : 'text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
            title="Script"
          >
            <FileCode className="w-5 h-5" />
          </button>

          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#a0a0a0]/40 cursor-not-allowed"
            title="Elements (Coming Soon)"
            disabled
          >
            <Image className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel - Bottom Sheet */}
        {activeTool === 'text' && (
          <div
            className="h-[50vh] bg-[#111111] border-t border-[#2a2a2a] rounded-t-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center py-2 cursor-pointer"
              onClick={() => setActiveTool(null)}
            >
              <div className="w-12 h-1 rounded-full bg-[#2a2a2a]" />
            </div>
            <div className="h-[calc(100%-24px)] overflow-y-auto">
              <TextPanel onClose={() => setActiveTool(null)} isMobile />
            </div>
          </div>
        )}

        {/* Script Content Panel - Bottom Sheet */}
        {activeTool === 'script' && (
          <div
            className="h-[50vh] bg-[#111111] border-t border-[#2a2a2a] rounded-t-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center py-2 cursor-pointer"
              onClick={() => setActiveTool(null)}
            >
              <div className="w-12 h-1 rounded-full bg-[#2a2a2a]" />
            </div>
            <div className="h-[calc(100%-24px)] overflow-y-auto">
              <ScriptPanel onClose={() => setActiveTool(null)} isMobile />
            </div>
          </div>
        )}

        {/* Bottom padding for the nav bar */}
        <div className="h-[60px]" />
      </div>
    </>
  );
}