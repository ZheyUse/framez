'use client';

import { LayoutTemplate } from 'lucide-react';

export function EmptyTemplates() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <LayoutTemplate className="w-12 h-12 text-[#aaff00] mb-4" />
      <h3
        className="text-white mb-2"
        style={{ fontFamily: 'var(--font-space-mono), monospace' }}
      >
        No templates yet
      </h3>
      <p
        className="text-[#a0a0a0]"
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        Upload a template above to get started
      </p>
    </div>
  );
}