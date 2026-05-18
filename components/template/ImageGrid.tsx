'use client';

import { useState, useMemo, useEffect } from 'react';
import { ImageCard } from './ImageCard';
import { UploadedImage } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGridProps {
  images: UploadedImage[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onDelete: (id: string) => void;
  onAddMore: () => void;
}

const ITEMS_PER_PAGE = 20;
const VISIBLE_PAGES = 5;

export function ImageGrid({ images, activeIndex, onSelect, onDelete, onAddMore }: ImageGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);

  // Reset to page 1 when images change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [images.length, totalPages, currentPage]);

  const visibleImages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return images.slice(start, end);
  }, [images, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= VISIBLE_PAGES + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm uppercase tracking-wider text-[#a0a0a0]"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          {images.length} photo{images.length !== 1 ? 's' : ''}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddMore}
          className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add More
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visibleImages.map((image, idx) => {
          const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;
          return (
            <ImageCard
              key={image.id}
              image={image}
              isActive={actualIndex === activeIndex}
              onClick={() => onSelect(actualIndex)}
              onDelete={() => onDelete(image.id)}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] disabled:opacity-30 disabled:hover:border-[#2a2a2a] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="text-[#a0a0a0] px-2">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage
                    ? 'bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold min-w-[36px] cursor-pointer'
                    : 'border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] min-w-[36px] cursor-pointer'
                  }
                >
                  {page}
                </Button>
              )
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] disabled:opacity-30 disabled:hover:border-[#2a2a2a] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}