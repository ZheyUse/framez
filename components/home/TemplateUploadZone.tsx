'use client';

import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { validateTemplateFile } from '@/lib/utils/imageUtils';

interface TemplateUploadZoneProps {
  onFileSelected: (file: File) => void;
}

export function TemplateUploadZone({ onFileSelected }: TemplateUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (validateTemplateFile(file)) {
          onFileSelected(file);
        } else {
          toast.error('Only PNG and SVG files are supported');
        }
      }
    },
    [onFileSelected],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateTemplateFile(file)) {
          onFileSelected(file);
        } else {
          toast.error('Only PNG and SVG files are supported');
        }
      }
      e.target.value = '';
    },
    [onFileSelected],
  );

  const isActive = isDragOver || isHovered;

  return (
    <div
      className={`
        relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
        transition-all duration-200
        ${isActive
          ? 'border-[#aaff00] bg-[#aaff00]/5 shadow-[0_0_20px_rgba(170,255,0,0.15)]'
          : 'border-[#2a2a2a] bg-[#111111] hover:border-[#aaff00]/50 hover:bg-[#aaff00]/5'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('template-upload-input')?.click()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        id="template-upload-input"
        type="file"
        accept=".png,.svg,image/png,image/svg+xml"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <UploadCloud className={`w-10 h-10 transition-colors duration-200 ${isActive ? 'text-[#aaff00] scale-110' : 'text-[#aaff00]/70'}`} />
        <div>
          <p
            className="font-mono text-white mb-1 transition-colors duration-200"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Drag & drop your template here
          </p>
          <p
            className="text-[#a0a0a0] text-sm transition-colors duration-200"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            PNG or SVG &middot; Click to browse
          </p>
        </div>
      </div>
    </div>
  );
}