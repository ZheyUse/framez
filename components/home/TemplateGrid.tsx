'use client';

import { LayoutTemplate } from 'lucide-react';

interface TemplateGridProps {
  children: React.ReactNode;
}

export function TemplateGrid({ children }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}